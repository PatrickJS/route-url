import { RouteUrl, type RouteUrlOptions } from "./RouteUrl.js";
import type { NavigateEvent } from "./types/navigation.js";

export class BrowserRouteUrlNavigate extends RouteUrl {
  private boundOnNavigate: (event: NavigateEvent) => void;

  constructor(options: RouteUrlOptions = {}) {
    super(options);
    this.boundOnNavigate = this.onNavigate.bind(this);
    window.navigation.addEventListener("navigate", this.boundOnNavigate);
    this.setUrl(this.getPlatformUrl());
  }

  navigate(path: string): void {
    const url = this.resolveUrl(path);
    window.navigation.navigate(url.pathname, { history: "push" });
  }

  replace(path: string): void {
    const url = this.resolveUrl(path);
    window.navigation.navigate(url.pathname, { history: "replace" });
  }

  protected getPlatformUrl(): URL {
    const currentUrl = new URL(window.navigation.currentEntry.url);
    return this.hashRouting
      ? new URL(currentUrl.hash.slice(1) || "/", location.origin)
      : currentUrl;
  }

  private onNavigate(event: NavigateEvent): void {
    const url = new URL(event.destination.url);
    this.setUrl(this.hashRouting ? url.hash.slice(1) : url.pathname);
  }

  dispose(): void {
    window.navigation.removeEventListener("navigate", this.boundOnNavigate);
    super.dispose();
  }
}
