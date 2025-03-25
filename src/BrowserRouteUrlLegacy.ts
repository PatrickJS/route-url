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
    const pathWithoutBase = url.pathname.startsWith(this.baseUrl)
      ? url.pathname.slice(this.baseUrl.length) || "/"
      : url.pathname;
    history.pushState(
      {},
      "",
      this.hashRouting ? `#${pathWithoutBase}` : pathWithoutBase
    );
    this.setUrl(url);
    return true;
  }

  replace(path: string): boolean {
    const url = this.resolveUrl(path);
    if (!this.canNavigate(url)) return false;
    const pathWithoutBase = url.pathname.startsWith(this.baseUrl)
      ? url.pathname.slice(this.baseUrl.length) || "/"
      : url.pathname;
    history.replaceState(
      {},
      "",
      this.hashRouting ? `#${pathWithoutBase}` : pathWithoutBase
    );
    this.setUrl(url);
    return true;
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
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
