import { resolveUrl } from "./resolveUrl";

type TrailingSlash = "ignore" | "require" | "forbid";

export interface RouteUrlOptions {
  hashRouting?: boolean;
  baseUrl?: string;
  relativeUrls?: boolean;
  trailingSlash?: TrailingSlash;
}

interface RouteUrlObserver {
  next: (routeUrl: RouteUrl) => void;
}

export class RouteUrl {
  protected hashRouting: boolean;
  protected baseUrl: string;
  protected relativeUrls: boolean;
  protected trailingSlash: TrailingSlash;
  protected listeners: RouteUrlObserver[];
  protected historyStack: URL[];
  protected currentIndex: number;
  protected currentUrl: URL;

  constructor({
    hashRouting = false,
    baseUrl = "/",
    relativeUrls = true,
    trailingSlash = "ignore",
  }: RouteUrlOptions = {}) {
    this.hashRouting = hashRouting;
    // Normalize baseUrl by removing trailing slashes and multiple consecutive slashes
    this.baseUrl =
      (baseUrl || "/").replace(/\/+/g, "/").replace(/\/$/, "") || "";
    this.relativeUrls = relativeUrls;
    this.trailingSlash = trailingSlash;
    this.listeners = [];
    this.historyStack = [];
    this.currentIndex = -1;
    this.currentUrl = this._getPlatformUrl();
  }

  canNavigate(url: URL): boolean {
    return url.pathname.startsWith(this.baseUrl);
  }

  resolveUrl(path: string): URL {
    return resolveUrl(path, {
      baseUrl: this.baseUrl,
      relativeUrls: this.relativeUrls,
      trailingSlash: this.trailingSlash,
    });
  }

  setUrl(url: string | URL): void {
    // Handle hash fragments and baseUrl normalization
    const urlString = url instanceof URL ? url.toString() : url;
    const [pathWithoutHash, _hashFragment] = urlString.split("#");
    const newUrl = this.resolveUrl(pathWithoutHash);

    // If hash routing is enabled, remove hash from URL
    if (this.hashRouting) {
      newUrl.hash = "";
    }

    this.currentUrl = newUrl;
    this.historyStack = this.historyStack.slice(0, this.currentIndex + 1);
    this.historyStack.push(this.currentUrl);
    this.currentIndex++;
    this.emitChange();
  }

  getPath(): string {
    const pathname = this.currentUrl.pathname;
    // Ensure pathname is not encoded
    const decodedPathname = decodeURIComponent(pathname);
    const path = decodedPathname.startsWith(this.baseUrl)
      ? decodedPathname.slice(this.baseUrl.length) || "/"
      : decodedPathname;

    // Remove query parameters and hash fragment
    const pathWithoutQuery = path.split("?")[0];

    // Normalize multiple consecutive slashes
    const normalizedPath = pathWithoutQuery.replace(/\/+/g, "/");

    if (this.hashRouting) {
      return normalizedPath.split("#")[0];
    }
    return normalizedPath;
  }

  getParams(routePattern: string): Record<string, string> {
    const paramNames: string[] = [];
    const regexPath = routePattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });

    const match = this.getPath().match(new RegExp(`^${regexPath}$`));
    if (match) {
      return paramNames.reduce<Record<string, string>>((params, name, i) => {
        params[name] = match[i + 1];
        return params;
      }, {});
    }
    return {};
  }

  getQuery(): URLSearchParams {
    return this.currentUrl.searchParams;
  }

  subscribe(observer: RouteUrlObserver | ((routeUrl: RouteUrl) => void)): {
    unsubscribe: () => void;
  } {
    const listener =
      typeof observer === "function" ? { next: observer } : observer;
    this.listeners.push(listener);
    return {
      unsubscribe: () =>
        this.listeners.splice(this.listeners.indexOf(listener), 1),
    };
  }

  emitChange(): void {
    for (const listener of this.listeners) {
      listener.next(this);
    }
  }

  when(path: string): {
    subscribe: (
      observer: RouteUrlObserver | ((routeUrl: RouteUrl) => void)
    ) => {
      unsubscribe: () => void;
    };
  } {
    return {
      subscribe: (observer) => {
        const listener =
          typeof observer === "function" ? { next: observer } : observer;
        const wrappedListener: RouteUrlObserver = {
          next: (urlInstance) => {
            if (urlInstance.getPath() === path) listener.next(urlInstance);
          },
        };
        this.listeners.push(wrappedListener);
        return {
          unsubscribe: () =>
            this.listeners.splice(this.listeners.indexOf(wrappedListener), 1),
        };
      },
    };
  }

  reload(): void {
    this.emitChange();
  }

  forward(): void {
    if (this.currentIndex < this.historyStack.length - 1) {
      this.currentIndex++;
      this.currentUrl = this.historyStack[this.currentIndex];
      this.emitChange();
    }
  }

  back(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentUrl = this.historyStack[this.currentIndex];
      this.emitChange();
    }
  }

  protected _getPlatformUrl(): URL {
    return new URL("/", "http://localhost");
  }

  dispose(): void {
    this.listeners = [];
    this.historyStack = [];
    this.currentIndex = -1;
    this.currentUrl = this._getPlatformUrl();
  }
}
