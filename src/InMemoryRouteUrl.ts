import { RouteUrlBase, type RouteUrlOptions } from "./RouteUrl.js";

export class InMemoryRouteUrl extends RouteUrlBase {
  constructor(initialPath: string = "/", options: RouteUrlOptions = {}) {
    super(options);
    this.currentUrl = this.resolveUrl(initialPath);
    this.historyStack = [this.currentUrl];
    this.currentIndex = 0;
  }

  setUrl(url: string | URL): void {
    const newUrl = this.resolveUrl(url.toString());
    this.currentUrl = newUrl;
    this.historyStack = this.historyStack.slice(0, this.currentIndex + 1);
    this.historyStack.push(this.currentUrl);
    this.currentIndex++;
    this.emitChange();
  }

  navigate(path: string): void {
    this.setUrl(path);
  }

  replace(path: string): void {
    const newUrl = this.resolveUrl(path);
    this.currentUrl = newUrl;
    this.historyStack[this.currentIndex] = this.currentUrl;
    this.emitChange();
  }

  // Override getPlatformUrl to return a default URL since we're in-memory
  protected _getPlatformUrl(): URL {
    return new URL("/", "http://localhost");
  }
}
