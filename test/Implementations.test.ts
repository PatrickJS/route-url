import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RouteUrl } from "../src/RouteUrl";

describe("RouteUrl Implementation", () => {
  describe("Server", () => {
    let routeUrl: RouteUrl;

    beforeEach(() => {
      routeUrl = new RouteUrl({
        baseUrl: "/api",
        relativeUrls: true,
      });
    });

    it("should handle server-side URLs correctly", () => {
      routeUrl.setUrl("/api/users/123");
      expect(routeUrl.getPath()).toBe("/users/123");
    });

    it("should handle query parameters on server", () => {
      routeUrl.setUrl("/api/users?page=1&limit=10");
      expect(routeUrl.getPath()).toBe("/users");
      expect(routeUrl.getQuery().get("page")).toBe("1");
      expect(routeUrl.getQuery().get("limit")).toBe("10");
    });
  });

  describe("In-Memory", () => {
    let routeUrl: RouteUrl;

    beforeEach(() => {
      routeUrl = new RouteUrl({
        baseUrl: "",
        relativeUrls: true,
      });
    });

    it("should handle in-memory navigation", () => {
      routeUrl.setUrl("/dashboard");
      expect(routeUrl.getPath()).toBe("/dashboard");

      routeUrl.setUrl("/profile");
      expect(routeUrl.getPath()).toBe("/profile");

      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/dashboard");
    });

    it("should handle history stack correctly", () => {
      routeUrl.setUrl("/page1");
      routeUrl.setUrl("/page2");
      routeUrl.setUrl("/page3");

      expect(routeUrl.getPath()).toBe("/page3");
      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/page2");
      routeUrl.back();
      expect(routeUrl.getPath()).toBe("/page1");
      routeUrl.forward();
      expect(routeUrl.getPath()).toBe("/page2");
    });
  });

  describe("Browser", () => {
    let routeUrl: RouteUrl;
    let originalLocation: Location;

    beforeEach(() => {
      // Mock window.location
      originalLocation = window.location;
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        pathname: "/",
        search: "",
        hash: "",
      } as Location;

      routeUrl = new RouteUrl({
        baseUrl: "/app",
        relativeUrls: true,
      });
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it("should handle browser URLs correctly", () => {
      routeUrl.setUrl("/app/dashboard");
      expect(routeUrl.getPath()).toBe("/dashboard");
    });

    it("should handle hash routing", () => {
      const hashRouteUrl = new RouteUrl({
        baseUrl: "/app",
        hashRouting: true,
        relativeUrls: true,
      });

      hashRouteUrl.setUrl("/app/dashboard#section1");
      expect(hashRouteUrl.getPath()).toBe("/dashboard");
    });

    it("should handle trailing slashes according to option", () => {
      const requireSlashUrl = new RouteUrl({
        baseUrl: "/app",
        trailingSlash: "require",
        relativeUrls: true,
      });

      const forbidSlashUrl = new RouteUrl({
        baseUrl: "/app",
        trailingSlash: "forbid",
        relativeUrls: true,
      });

      requireSlashUrl.setUrl("/app/users");
      expect(requireSlashUrl.getPath()).toBe("/users/");

      forbidSlashUrl.setUrl("/app/users/");
      expect(forbidSlashUrl.getPath()).toBe("/users");
    });
  });

  describe("Common Functionality", () => {
    let routeUrl: RouteUrl;

    beforeEach(() => {
      routeUrl = new RouteUrl();
    });

    it("should handle route parameters", () => {
      routeUrl.setUrl("/users/123/posts/456");
      const params = routeUrl.getParams("/users/:userId/posts/:postId");
      expect(params).toEqual({
        userId: "123",
        postId: "456",
      });
    });

    it("should notify subscribers of changes", () => {
      const mockObserver = vi.fn();
      const subscription = routeUrl.subscribe(mockObserver);

      routeUrl.setUrl("/new-path");
      expect(mockObserver).toHaveBeenCalledWith(routeUrl);

      subscription.unsubscribe();
      routeUrl.setUrl("/another-path");
      expect(mockObserver).toHaveBeenCalledTimes(1);
    });

    it("should handle conditional subscriptions with when()", () => {
      const mockObserver = vi.fn();
      const subscription = routeUrl
        .when("/specific-path")
        .subscribe(mockObserver);

      routeUrl.setUrl("/other-path");
      expect(mockObserver).not.toHaveBeenCalled();

      routeUrl.setUrl("/specific-path");
      expect(mockObserver).toHaveBeenCalledWith(routeUrl);

      subscription.unsubscribe();
    });
  });
});
