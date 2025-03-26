import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RouteUrlBase } from "../src/RouteUrl";

describe("RouteUrlBase Implementation", () => {
  describe("Server", () => {
    let routeUrl: RouteUrlBase;

    beforeEach(() => {
      routeUrl = new RouteUrlBase({
        baseUrl: "/api",
        relativeUrls: true,
      });
    });

    it("should handle server-side URLs correctly", () => {
      routeUrl.setUrl("/api/users/123");
      const url = routeUrl.createRouteUrl();
      expect(url.getPath()).toBe("/users/123");
    });

    it("should handle query parameters on server", () => {
      routeUrl.setUrl("/api/users?page=1&limit=10");
      const url = routeUrl.createRouteUrl();
      expect(url.getPath()).toBe("/users");
      expect(url.getQuery().get("page")).toBe("1");
      expect(url.getQuery().get("limit")).toBe("10");
    });
  });

  describe("In-Memory", () => {
    let routeUrl: RouteUrlBase;

    beforeEach(() => {
      routeUrl = new RouteUrlBase({
        baseUrl: "",
        relativeUrls: true,
      });
    });

    it("should handle in-memory navigation", () => {
      routeUrl.setUrl("/dashboard");
      const url1 = routeUrl.createRouteUrl();
      expect(url1.getPath()).toBe("/dashboard");

      routeUrl.setUrl("/profile");
      const url2 = routeUrl.createRouteUrl();
      expect(url2.getPath()).toBe("/profile");

      routeUrl.back();
      const url3 = routeUrl.createRouteUrl();
      expect(url3.getPath()).toBe("/dashboard");
    });

    it("should handle history stack correctly", () => {
      routeUrl.setUrl("/page1");
      routeUrl.setUrl("/page2");
      routeUrl.setUrl("/page3");

      const url1 = routeUrl.createRouteUrl();
      expect(url1.getPath()).toBe("/page3");
      routeUrl.back();
      const url2 = routeUrl.createRouteUrl();
      expect(url2.getPath()).toBe("/page2");
      routeUrl.back();
      const url3 = routeUrl.createRouteUrl();
      expect(url3.getPath()).toBe("/page1");
      routeUrl.forward();
      const url4 = routeUrl.createRouteUrl();
      expect(url4.getPath()).toBe("/page2");
    });
  });

  describe("Browser", () => {
    let routeUrl: RouteUrlBase;
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

      routeUrl = new RouteUrlBase({
        baseUrl: "/app",
        relativeUrls: true,
      });
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it("should handle browser URLs correctly", () => {
      routeUrl.setUrl("/app/dashboard");
      const url = routeUrl.createRouteUrl();
      expect(url.getPath()).toBe("/dashboard");
    });

    it("should handle hash routing", () => {
      const hashRouteUrl = new RouteUrlBase({
        baseUrl: "/app",
        hashRouting: true,
        relativeUrls: true,
      });

      hashRouteUrl.setUrl("/app/dashboard#section1");
      const url = hashRouteUrl.createRouteUrl();
      expect(url.getPath()).toBe("/dashboard");
    });

    it("should handle trailing slashes according to option", () => {
      const requireSlashUrl = new RouteUrlBase({
        baseUrl: "/app",
        trailingSlash: "require",
        relativeUrls: true,
      });

      const forbidSlashUrl = new RouteUrlBase({
        baseUrl: "/app",
        trailingSlash: "forbid",
        relativeUrls: true,
      });

      requireSlashUrl.setUrl("/app/users");
      const url1 = requireSlashUrl.createRouteUrl();
      expect(url1.getPath()).toBe("/users/");

      forbidSlashUrl.setUrl("/app/users/");
      const url2 = forbidSlashUrl.createRouteUrl();
      expect(url2.getPath()).toBe("/users");
    });
  });

  describe("Common Functionality", () => {
    let routeUrl: RouteUrlBase;

    beforeEach(() => {
      routeUrl = new RouteUrlBase();
    });

    it("should handle route parameters", () => {
      routeUrl.setUrl("/users/123/posts/456");
      const url = routeUrl.createRouteUrl();
      const params = url.getParams("/users/:userId/posts/:postId");
      expect(params).toEqual({
        userId: "123",
        postId: "456",
      });
    });

    it("should notify subscribers of changes", () => {
      const mockObserver = vi.fn();
      const subscription = routeUrl.subscribe(mockObserver);

      routeUrl.setUrl("/new-path");
      const expectedUrl = routeUrl.createRouteUrl();
      expect(mockObserver).toHaveBeenCalledWith(expectedUrl);

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
      const expectedUrl = routeUrl.createRouteUrl();
      expect(mockObserver).toHaveBeenCalledWith(expectedUrl);

      subscription.unsubscribe();
    });
  });
});
