import { joinMount, normalizePath, parsePathAndSearch, stripMount, type TrailingSlash } from "./normalize.js";

export type Mode = "history" | "hash" | "memory";

export type RouterOptions = {
  mode?: Mode;
  mount?: string;
  trailingSlash?: TrailingSlash;
  initial?: string | URL;
};

export type GuardResult = boolean | string | Promise<boolean | string>;

export type Router = {
  readonly url: URL; // host URL
  readonly appPath: string; // app-relative path (mount stripped)
  readonly query: URLSearchParams;

  navigate(to: string | URL, opts?: { replace?: boolean; kind?: "app" | "host" | "absolute" }): Promise<void>;
  link(to: string, opts?: { kind?: "app" | "host" | "absolute" }): string;

  subscribe(fn: (r: Router) => void): () => void;

  match<T extends string>(pattern: T): { matched: boolean; params: Record<string, string> };
  when<T extends string>(pattern: T, fn: (r: Router, p: Record<string, string>) => void): () => void;

  guard(fn: (next: URL) => GuardResult): () => void;

  setMount(mount: string): void;
  scope(base: string): Router;
};

type Adapter = {
  current(): URL;
  push(url: URL): Promise<void>;
  replace(url: URL): Promise<void>;
  subscribe(fn: () => void): () => void;
};

function createHistoryAdapter(hash: boolean, getMount: () => string, trailingSlash: TrailingSlash): Adapter {
  const listener = new Set<() => void>();
  const onPop = () => listener.forEach((l) => l());
  const event = hash ? "hashchange" : "popstate";
  if (typeof window !== "undefined") {
    window.addEventListener(event, onPop);
  }
  return {
    current(): URL {
      if (typeof window === "undefined") return new URL("/", "http://localhost");
      if (hash) {
        const h = window.location.hash.slice(1) || "/";
        const hostPath = joinMount(getMount(), normalizePath(h, getMount(), trailingSlash), trailingSlash);
        return new URL(hostPath + window.location.search, window.location.origin);
      }
      return new URL(window.location.pathname + window.location.search, window.location.origin);
    },
    async push(url: URL): Promise<void> {
      if (typeof window === "undefined") return;
      if (hash) {
        const app = stripMount(getMount(), url.pathname);
        const target = normalizePath(app, getMount(), trailingSlash);
        window.history.pushState({}, "", `#${target}${url.search}`);
      } else {
        window.history.pushState({}, "", `${url.pathname}${url.search}`);
      }
      onPop();
    },
    async replace(url: URL): Promise<void> {
      if (typeof window === "undefined") return;
      if (hash) {
        const app = stripMount(getMount(), url.pathname);
        const target = normalizePath(app, getMount(), trailingSlash);
        window.history.replaceState({}, "", `#${target}${url.search}`);
      } else {
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }
      onPop();
    },
    subscribe(fn: () => void): () => void {
      listener.add(fn);
      return () => {
        listener.delete(fn);
        if (typeof window !== "undefined") {
          window.removeEventListener(event, onPop);
        }
      };
    },
  };
}

function createMemoryAdapter(initial: string | URL | undefined): Adapter {
  let cur = new URL(typeof initial === "string" ? initial : (initial?.toString() ?? "/"), "http://localhost");
  const listeners = new Set<() => void>();
  return {
    current() {
      return cur;
    },
    async push(url: URL) {
      cur = new URL(url.toString());
      listeners.forEach((l) => l());
    },
    async replace(url: URL) {
      cur = new URL(url.toString());
      listeners.forEach((l) => l());
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

function compilePattern(pattern: string): { re: RegExp; keys: string[] } {
  const keys: string[] = [];
  const reStr = pattern
    .replace(/([.+*?=^!:${}()[\]|\/\\])/g, "\\$1")
    .replace(/\\:(\w+)/g, (_m, k) => {
      keys.push(k);
      return "([^/]+)";
    });
  return { re: new RegExp(`^${reStr}$`), keys };
}

export function createRouter(opts: RouterOptions = {}): Router {
  const mode: Mode = opts.mode ?? "history";
  let mount = opts.mount ?? "/";
  const trailingSlash: TrailingSlash = opts.trailingSlash ?? "ignore";
  const guards = new Set<(next: URL) => GuardResult>();
  const subs = new Set<(r: Router) => void>();
  const whenSubs = new Set<{ pattern: string; re: RegExp; keys: string[]; fn: (r: Router, p: Record<string, string>) => void }>();

  const adapter: Adapter = mode === "memory"
    ? createMemoryAdapter(typeof opts.initial === "string" ? opts.initial : opts.initial?.toString())
    : createHistoryAdapter(mode === "hash", () => mount, trailingSlash);

  function getHostUrl(): URL {
    return adapter.current();
  }

  function getRouterSnapshot(): Router {
    const url = getHostUrl();
    const appPath = stripMount(mount, url.pathname);
    const normalizedApp = normalizePath(appPath, mount, trailingSlash);
    return apiFor(url, normalizedApp);
  }

  async function go(to: string | URL, replace?: boolean, kind: "app" | "host" | "absolute" = "app"): Promise<void> {
    const current = getHostUrl();
    let nextUrl: URL;
    if (kind === "absolute") {
      nextUrl = new URL(to.toString());
    } else if (kind === "host") {
      const str = typeof to === "string" ? to : to.toString();
      const { path, search } = parsePathAndSearch(str);
      const normalizedHostPath = normalizePath(path, mount, trailingSlash);
      nextUrl = new URL(normalizedHostPath + search, current.origin);
    } else {
      // app-relative
      const str = typeof to === "string" ? to : to.toString();
      const { path, search } = parsePathAndSearch(str);
      const hostPath = joinMount(mount, path, trailingSlash);
      nextUrl = new URL(hostPath + search, current.origin);
    }

    // run guards in app space
    const nextApp = stripMount(mount, nextUrl.pathname);
    const normalizedNextApp = normalizePath(nextApp, mount, trailingSlash);
    const guarded = new URL(joinMount(mount, normalizedNextApp, trailingSlash) + nextUrl.search, nextUrl.origin);
    for (const g of [...guards]) {
      const res = await g(guarded);
      if (res === true) continue;
      if (res === false) return; // block
      if (typeof res === "string") {
        // redirect in app-relative space
        const redirHost = joinMount(mount, res, trailingSlash);
        await adapter.replace(new URL(redirHost + nextUrl.search, guarded.origin));
        notify();
        return;
      }
    }

    if (replace) await adapter.replace(guarded);
    else await adapter.push(guarded);
    notify();
  }

  function notify() {
    const snap = getRouterSnapshot();
    subs.forEach((fn) => fn(snap));
    for (const sub of whenSubs) {
      const m = sub.re.exec(snap.appPath);
      if (m) {
        const params: Record<string, string> = {};
        sub.keys.forEach((k, i) => (params[k] = m[i + 1]));
        sub.fn(snap, params);
      }
    }
  }

  function apiFor(url: URL, appPath: string): Router {
    return {
      get url() {
        return url;
      },
      get appPath() {
        return appPath;
      },
      get query() {
        return url.searchParams;
      },
      async navigate(to, opts) {
        await go(to, opts?.replace, opts?.kind ?? "app");
      },
      link(to: string, opts?: { kind?: "app" | "host" | "absolute" }): string {
        const kind = opts?.kind ?? "app";
        if (kind === "absolute") return to;
        if (kind === "host") {
          const { path, search } = parsePathAndSearch(to);
          const normalizedHostPath = normalizePath(path, mount, trailingSlash);
          return normalizedHostPath + search;
        }
        const { path, search } = parsePathAndSearch(to);
        const hostPath = joinMount(mount, path, trailingSlash);
        return hostPath + search;
      },
      subscribe(fn) {
        subs.add(fn);
        const off = adapter.subscribe(() => {
          const snap = getRouterSnapshot();
          fn(snap);
        });
        return () => {
          subs.delete(fn);
          off();
        };
      },
      match(pattern) {
        const { re, keys } = compilePattern(normalizePath(pattern, mount, trailingSlash));
        const m = re.exec(appPath);
        if (!m) return { matched: false, params: {} };
        const params: Record<string, string> = {};
        keys.forEach((k, i) => (params[k] = m[i + 1]));
        return { matched: true, params };
      },
      when(pattern, fn) {
        const norm = normalizePath(pattern, mount, trailingSlash);
        const { re, keys } = compilePattern(norm);
        const entry = { pattern: norm, re, keys, fn };
        whenSubs.add(entry);
        return () => void whenSubs.delete(entry);
      },
      guard(fn) {
        guards.add(fn);
        return () => void guards.delete(fn);
      },
      setMount(next) {
        mount = next || "/";
        notify();
      },
      scope(base: string) {
        const baseNorm = normalizePath(base, mount, trailingSlash);
        const parent = createRouter({ mode, mount, trailingSlash, initial: getHostUrl() });
        const navigateScoped = async (to: string | URL, opts?: { replace?: boolean; kind?: "app" | "host" | "absolute" }) => {
          if (opts?.kind && opts.kind !== "app") return parent.navigate(to, opts);
          const str = typeof to === "string" ? to : to.toString();
          const { path, search } = parsePathAndSearch(str);
          const scoped = baseNorm === "/" ? path : `${baseNorm}${normalizePath(path, mount, trailingSlash)}`;
          return parent.navigate(scoped + search, { replace: opts?.replace, kind: "app" });
        };
        const linkScoped = (to: string, opts?: { kind?: "app" | "host" | "absolute" }) => {
          if (opts?.kind && opts.kind !== "app") return parent.link(to, opts);
          const { path, search } = parsePathAndSearch(to);
          const scoped = baseNorm === "/" ? path : `${baseNorm}${normalizePath(path, mount, trailingSlash)}`;
          return parent.link(scoped + search, { kind: "app" });
        };
        const child = createRouter({ mode, mount, trailingSlash, initial: getHostUrl() });
        return {
          ...child,
          navigate: navigateScoped as Router["navigate"],
          link: linkScoped as Router["link"],
        } as Router;
      },
    };
  }

  // initial notify to establish state for subscribers
  setTimeout(() => notify(), 0);

  return getRouterSnapshot();
}

export function makeLinkHandler(router: Router) {
  return (e: MouseEvent) => {
    if ((e as any).defaultPrevented) return;
    const mouse = e as MouseEvent;
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || (mouse as any).button !== 0) return;
    const a = (mouse.currentTarget as unknown) as HTMLAnchorElement;
    const href = a?.getAttribute?.("href") ?? "";
    if (!href.startsWith("http") && !href.startsWith("#")) {
      mouse.preventDefault();
      // app-relative by default
      router.navigate(href, { kind: "app" });
    }
  };
}


