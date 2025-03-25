import { RouteUrl, type RouteUrlOptions } from "./RouteUrl.js";

export class ServerRouteUrl extends RouteUrl {
  constructor(initialPath: string = "/", options: RouteUrlOptions = {}) {
    super(options);
    this.setUrl(this.resolveUrl(initialPath));
  }

  navigate(path: string): void {
    this.setUrl(this.resolveUrl(path));
  }

  replace(path: string): void {
    this.navigate(path);
  }

  // Override getPlatformUrl to return a default URL since we're on the server
  protected getPlatformUrl(): URL {
    return new URL("/", "http://localhost");
  }
}
