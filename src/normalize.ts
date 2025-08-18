export type TrailingSlash = "ignore" | "require" | "forbid";

function toLeadingSlash(input: string): string {
  if (!input) return "/";
  const normalized = input.replace(/\/+/, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function stripTrailingSlash(input: string): string {
  if (input === "/") return "/";
  return input.replace(/\/$/, "");
}

function ensureTrailingSlash(input: string): string {
  if (input === "/") return "/";
  return input.endsWith("/") ? input : `${input}/`;
}

function normalizeSegments(path: string): string {
  const segments = path.split("/").filter(() => true); // keep empties to handle leading
  const out: string[] = [];
  for (const seg of segments) {
    if (seg === "" && out.length === 0) {
      // preserve leading slash
      out.push("");
      continue;
    }
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (out.length > 1) out.pop();
      continue;
    }
    out.push(seg);
  }
  const joined = out.join("/");
  return joined === "" ? "/" : (joined.startsWith("/") ? joined : `/${joined}`);
}

/**
 * Normalize a path according to a base (mount) and trailing slash policy.
 * - Always leading slash
 * - Apply trailing slash policy relative to root (app root = "/")
 * - Do NOT allow traversal above root
 */
export function normalizePath(path: string, base: string, slash: TrailingSlash): string {
  void base; // base is present to emphasize mount-relative semantics, not used for math
  const raw = typeof path === "string" ? path : String(path ?? "");
  // Separate query/hash are NOT handled here; this is pathname-level normalization
  const pathname = raw.split("?")[0].split("#")[0];
  const leading = toLeadingSlash(pathname);
  const normalized = normalizeSegments(leading);

  let result = normalized;
  const isRoot = result === "/";
  if (slash === "require" && !isRoot) {
    result = ensureTrailingSlash(result);
  } else if (slash === "forbid" && !isRoot) {
    result = stripTrailingSlash(result);
  }
  // ignore: preserve as-is (already normalized), except root is "/"
  return result;
}

/**
 * Join a mount and an app-relative path, enforce trailing slash policy,
 * and clamp traversal to within the mount.
 */
export function joinMount(mount: string, path: string, slash: TrailingSlash): string {
  const normMount = stripTrailingSlash(toLeadingSlash(mount || "/"));
  // Treat app path; normalize relative to app root
  const app = normalizePath(path || "/", normMount, slash);

  // If app is root, return mount with its own trailing-style (source of truth)
  if (app === "/") {
    return normMount; // do not force trailing slash on root
  }

  // Combine and then normalize segments to clamp traversal
  const combined = `${normMount}${app}`;
  const combinedNormalized = normalizeSegments(combined);

  // Apply trailing slash policy to the app portion only (non-root app path)
  const appHasTrailing = app.endsWith("/") && app !== "/";
  let host = combinedNormalized;
  if (slash === "require" && !host.endsWith("/")) host += "/";
  if (slash === "forbid" && host.endsWith("/")) host = host.slice(0, -1);
  if (slash === "ignore") {
    if (appHasTrailing && !host.endsWith("/")) host += "/";
    if (!appHasTrailing && host.endsWith("/")) host = host.slice(0, -1);
  }
  return host;
}

export function stripMount(mount: string, hostPath: string): string {
  const normMount = stripTrailingSlash(toLeadingSlash(mount || "/"));
  const normalizedHost = normalizeSegments(hostPath || "/");
  if (normalizedHost === normMount) return "/";
  if (normalizedHost.startsWith(normMount + "/")) {
    const rest = normalizedHost.slice(normMount.length);
    return rest === "" ? "/" : rest;
  }
  // If it doesn't start with mount, treat as root-scoped
  return "/";
}

export function parsePathAndSearch(input: string): { path: string; search: string } {
  const [path, searchHash] = input.split("?");
  const search = searchHash ? `?${searchHash.split("#")[0]}` : "";
  return { path: path || "/", search };
}


