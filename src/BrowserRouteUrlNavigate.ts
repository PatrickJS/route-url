import { RouteUrlBase, type RouteUrlOptions } from "./RouteUrl.js";
import type {
  NavigateEvent,
  NavigationResult,
} from "./types/navigation-events";
import type { Navigation } from "./types/navigation";

export class BrowserRouteUrlNavigate extends RouteUrlBase {
  private boundOnNavigate: (event: NavigateEvent) => void;

  constructor(options: RouteUrlOptions = {}) {
    super(options);
    this.boundOnNavigate = this.onNavigate.bind(this);
    (window.navigation as Navigation).addEventListener(
      "navigate",
      this.boundOnNavigate
    );
    this.setUrl(this.getPlatformUrl());
  }

  navigate(path: string): NavigationResult {
    const url = this.resolveUrl(path);
    const pathWithoutBase = url.pathname.startsWith(this.baseUrl)
      ? url.pathname.slice(this.baseUrl.length) || "/"
      : url.pathname;
    return (window.navigation as Navigation).navigate(pathWithoutBase, {
      history: "push",
    }) as unknown as NavigationResult;
  }

  replace(path: string): NavigationResult {
    const url = this.resolveUrl(path);
    const pathWithoutBase = url.pathname.startsWith(this.baseUrl)
      ? url.pathname.slice(this.baseUrl.length) || "/"
      : url.pathname;
    return (window.navigation as Navigation).navigate(pathWithoutBase, {
      history: "replace",
    }) as unknown as NavigationResult;
  }

  protected getPlatformUrl(): URL {
    const currentUrl = new URL(
      (window.navigation as Navigation).currentEntry.url
    );
    return this.hashRouting
      ? new URL(currentUrl.hash.slice(1) || "/", location.origin)
      : currentUrl;
  }

  private onNavigate(event: NavigateEvent): void {
    const url = new URL(event.destination.url);
    this.setUrl(this.hashRouting ? url.hash.slice(1) : url.pathname);
  }

  dispose(): void {
    (window.navigation as Navigation).removeEventListener(
      "navigate",
      this.boundOnNavigate
    );
    super.dispose();
  }
}
