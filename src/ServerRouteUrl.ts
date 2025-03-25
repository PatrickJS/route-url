import { RouteUrl, type RouteUrlOptions } from "./RouteUrl.js";

export class ServerRouteUrl extends RouteUrl {
  constructor(initialPath: string = "/", options: RouteUrlOptions = {}) {
    super(options);
    this.currentUrl = this.resolveUrl(initialPath);
  }

  setUrl(url: string | URL): void {
    const newUrl = this.resolveUrl(url.toString());
    this.currentUrl = newUrl;
    this.emitChange();
  }

  back(): void {
    // No-op on server
  }

  forward(): void {
    // No-op on server
  }

  navigate(path: string): void {
    this.setUrl(this.resolveUrl(path));
  }

  replace(path: string): void {
    this.navigate(path);
  }

  // Override getPlatformUrl to return a default URL since we're on the server
  protected _getPlatformUrl(): URL {
    return new URL("/", "http://localhost");
  }
}
