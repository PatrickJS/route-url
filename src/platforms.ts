import { BrowserRouteUrlLegacy } from "./BrowserRouteUrlLegacy.js";
import { BrowserRouteUrlNavigate } from "./BrowserRouteUrlNavigate.js";
import { ServerRouteUrl } from "./ServerRouteUrl.js";
import { InMemoryRouteUrl } from "./InMemoryRouteUrl.js";
import type { RouteUrlOptions } from "./RouteUrl.js";

export function createRouteUrl({
  platform = "browser",
  initialPath = "/",
  ...options
}: RouteUrlOptions & {
  platform?: "browser" | "server" | "memory";
  initialPath?: string;
} = {}) {
  if (platform === "server") return new ServerRouteUrl(initialPath, options);
  if (platform === "memory") return new InMemoryRouteUrl(initialPath, options);
  return "navigation" in window &&
    typeof (window as any).navigation.navigate === "function"
    ? new BrowserRouteUrlNavigate(options)
    : new BrowserRouteUrlLegacy(options);
}
