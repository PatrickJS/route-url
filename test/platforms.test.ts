import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Navigation } from "@virtualstate/navigation";
import { BrowserRouteUrlLegacy } from "../src/BrowserRouteUrlLegacy";
import { BrowserRouteUrlNavigate } from "../src/BrowserRouteUrlNavigate";
import { ServerRouteUrl } from "../src/ServerRouteUrl";
import { InMemoryRouteUrl } from "../src/InMemoryRouteUrl";
import { createRouteUrl } from "../src/platforms";

// Mock globals
const mockLocation = {
  pathname: "/",
  search: "",
  hash: "",
  origin: "http://localhost",
  href: "http://localhost/",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
} as unknown as Location;

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  length: 1,
  scrollRestoration: "auto",
  state: null,
} as unknown as History;

const mockNavigation = {
  navigate: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  entries: [],
  currentEntry: {
    url: "http://localhost/",
    key: "1",
    id: "1",
    index: 0,
    sameDocument: true,
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as Navigation;

const mockWindow = {
  location: mockLocation,
  history: mockHistory,
  navigation: mockNavigation,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as Window;

describe("Platform-specific RouteUrl implementations", () => {
  let originalWindow: any;
  let originalLocation: Location;
  let originalHistory: History;
  let originalNavigation: any;

  beforeEach(() => {
    // Store original globals
    originalWindow = { ...window };
    originalLocation = window.location;
    originalHistory = window.history;
    originalNavigation = (window as any).navigation;

    // Mock window globals
    delete (window as any).location;
    delete (window as any).history;
    delete (window as any).navigation;
    delete (window as any).addEventListener;
    delete (window as any).removeEventListener;

    window.location = mockLocation;
    window.history = mockHistory;
    (window as any).navigation = mockNavigation;
    window.addEventListener = mockWindow.addEventListener;
    window.removeEventListener = mockWindow.removeEventListener;
  });

  afterEach(() => {
    // Restore original globals
    window = originalWindow;
    window.location = originalLocation;
    window.history = originalHistory;
    (window as any).navigation = originalNavigation;
    window.addEventListener = originalWindow.addEventListener;
    window.removeEventListener = originalWindow.removeEventListener;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("createRouteUrl factory", () => {
    it("creates ServerRouteUrl when platform is server", () => {
      const routeUrl = createRouteUrl({
        platform: "server",
        initialPath: "/api",
      });
      expect(routeUrl).toBeInstanceOf(ServerRouteUrl);
      expect(routeUrl.getPath()).toBe("/api");
    });

    it("creates InMemoryRouteUrl when platform is memory", () => {
      const routeUrl = createRouteUrl({
        platform: "memory",
        initialPath: "/test",
      });
      expect(routeUrl).toBeInstanceOf(InMemoryRouteUrl);
      expect(routeUrl.getPath()).toBe("/test");
    });

    it("creates BrowserRouteUrlNavigate when navigation API is available", () => {
      const routeUrl = createRouteUrl();
      expect(routeUrl).toBeInstanceOf(BrowserRouteUrlNavigate);
    });

    it("creates BrowserRouteUrlLegacy when navigation API is not available", () => {
      delete (window as any).navigation;
      const routeUrl = createRouteUrl();
      expect(routeUrl).toBeInstanceOf(BrowserRouteUrlLegacy);
    });

    it("passes options to the created instance", () => {
      const options = {
        baseUrl: "/api",
        hashRouting: true,
        trailingSlash: "require" as const,
      };

      const routeUrl = createRouteUrl({ platform: "memory", ...options });
      expect(routeUrl.resolveUrl("/test").pathname).toBe("/api/test/");
    });
  });

  describe("ServerRouteUrl", () => {
    let routeUrl: ServerRouteUrl;

    beforeEach(() => {
      routeUrl = new ServerRouteUrl("/api", {
        baseUrl: "/api",
        trailingSlash: "require",
      });
    });

    it("handles server-side URLs correctly", () => {
      routeUrl.setUrl("/api/users/123");
      expect(routeUrl.getPath()).toBe("/users/123/");
    });

    it("handles query parameters on server", () => {
      routeUrl.setUrl("/api/users?page=1&limit=10");
      expect(routeUrl.getPath()).toBe("/users/");
      expect(routeUrl.getQuery().get("page")).toBe("1");
      expect(routeUrl.getQuery().get("limit")).toBe("10");
    });

    it("does not maintain history stack on server", () => {
      routeUrl.navigate("/api/page1");
      routeUrl.navigate("/api/page2");
      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/page2/");
    });
  });

  describe("InMemoryRouteUrl", () => {
    let routeUrl: InMemoryRouteUrl;

    beforeEach(() => {
      routeUrl = new InMemoryRouteUrl("/");
    });

    it("handles in-memory navigation", () => {
      routeUrl.navigate("/dashboard");
      expect(routeUrl.getPath()).toBe("/dashboard");

      routeUrl.navigate("/profile");
      expect(routeUrl.getPath()).toBe("/profile");

      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/dashboard");
    });

    it("maintains history stack correctly", () => {
      routeUrl.navigate("/page1");
      routeUrl.navigate("/page2");
      routeUrl.navigate("/page3");

      expect(routeUrl.getPath()).toBe("/page3");
      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/page2");
      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/page1");
      routeUrl.forward();
      expect(routeUrl.getPath()).toBe("/page2");
    });
  });

  describe("BrowserRouteUrlLegacy", () => {
    let routeUrl: BrowserRouteUrlLegacy;

    beforeEach(() => {
      delete (window as any).navigation;
      routeUrl = new BrowserRouteUrlLegacy({
        baseUrl: "/app",
        relativeUrls: true,
      });
    });

    it("uses history API for navigation", () => {
      routeUrl.navigate("/app/dashboard");
      expect(mockHistory.pushState).toHaveBeenCalled();
    });

    it("handles browser back/forward", () => {
      routeUrl.navigate("/app/page1");
      routeUrl.navigate("/app/page2");

      routeUrl.back();
      expect(mockHistory.back).toHaveBeenCalled();

      routeUrl.forward();
      expect(mockHistory.forward).toHaveBeenCalled();
    });

    it("handles hash routing", () => {
      const hashRouteUrl = new BrowserRouteUrlLegacy({
        baseUrl: "/app",
        hashRouting: true,
      });

      hashRouteUrl.navigate("/app/dashboard");
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, "", "#/dashboard");
    });

    it("handles replace navigation", () => {
      routeUrl.replace("/app/dashboard");
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/dashboard"
      );
    });
  });

  describe("BrowserRouteUrlNavigate", () => {
    let routeUrl: BrowserRouteUrlNavigate;

    beforeEach(() => {
      routeUrl = new BrowserRouteUrlNavigate({
        baseUrl: "/app",
        relativeUrls: true,
      });
    });

    it("uses navigation API for navigation", () => {
      routeUrl.navigate("/app/dashboard");
      expect(mockNavigation.navigate).toHaveBeenCalledWith("/dashboard", {
        history: "push",
      });
    });

    it("handles navigation options correctly", () => {
      routeUrl.replace("/app/dashboard");
      expect(mockNavigation.navigate).toHaveBeenCalledWith("/dashboard", {
        history: "replace",
      });
    });

    it("handles navigation events", () => {
      const navigateEvent = {
        destination: {
          url: "http://localhost/app/dashboard",
        },
      };

      routeUrl["onNavigate"](navigateEvent as any);
      expect(routeUrl.getPath()).toBe("/dashboard");
    });

    it("handles hash routing", () => {
      const hashRouteUrl = new BrowserRouteUrlNavigate({
        baseUrl: "/app",
        hashRouting: true,
      });

      hashRouteUrl.navigate("/app/dashboard");
      expect(mockNavigation.navigate).toHaveBeenCalledWith("/dashboard", {
        history: "push",
      });
    });
  });
});
