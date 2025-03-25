import { RouteUrl, type RouteUrlOptions } from "./RouteUrl.js";

export class BrowserRouteUrlLegacy extends RouteUrl {
  private boundOnPopState: () => void;

  constructor(options: RouteUrlOptions = {}) {
    super(options);
    this.boundOnPopState = this.onPopState.bind(this);
    window.addEventListener(
      this.hashRouting ? "hashchange" : "popstate",
      this.boundOnPopState
    );
    this.setUrl(this.getPlatformUrl());
  }

  navigate(path: string): boolean {
    const url = this.resolveUrl(path);
    if (!this.canNavigate(url)) return false;
    history.pushState(
      {},
      "",
      this.hashRouting ? `#${url.pathname}` : url.pathname
    );
    this.setUrl(url);
    return true;
  }

  replace(path: string): boolean {
    const url = this.resolveUrl(path);
    if (!this.canNavigate(url)) return false;
    history.replaceState(
      {},
      "",
      this.hashRouting ? `#${url.pathname}` : url.pathname
    );
    this.setUrl(url);
    return true;
  }

  protected getPlatformUrl(): URL {
    const href = this.hashRouting
      ? location.hash.slice(1) || "/"
      : location.pathname + location.search;
    return new URL(href, location.origin);
  }

  private onPopState(): void {
    this.setUrl(this.getPlatformUrl());
  }

  dispose(): void {
    window.removeEventListener(
      this.hashRouting ? "hashchange" : "popstate",
      this.boundOnPopState
    );
    super.dispose();
  }
}
