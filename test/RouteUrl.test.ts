import { describe, test, expect } from "vitest";
import { RouteUrlBase } from "../src/RouteUrl";

describe("RouteUrlBase", () => {
  test("initializes with default path", () => {
    const routeUrl = new RouteUrlBase();
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/");
  });

  test("resolves URL correctly with trailing slash required", () => {
    const routeUrl = new RouteUrlBase({
      baseUrl: "/base",
      trailingSlash: "require",
    });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/base/test/");
  });

  test("handles query parameters correctly", () => {
    const routeUrl = new RouteUrlBase();
    routeUrl.setUrl("/test?param1=value1&param2=value2");
    const url = routeUrl.createRouteUrl();
    const query = url.getQuery();
    expect(query.get("param1")).toBe("value1");
    expect(query.get("param2")).toBe("value2");
  });

  test("extracts route parameters correctly", () => {
    const routeUrl = new RouteUrlBase();
    routeUrl.setUrl("/users/123/posts/456");
    const url = routeUrl.createRouteUrl();
    const params = url.getParams("/users/:userId/posts/:postId");
    expect(params).toEqual({
      userId: "123",
      postId: "456",
    });
  });

  test("handles base URL correctly", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    routeUrl.setUrl("/api/users");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/users");
  });

  test("handles paths that already contain baseUrl", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    // Should handle both cases correctly
    expect(routeUrl.resolveUrl("/api/users").pathname).toBe("/api/users");
    expect(routeUrl.resolveUrl("/users").pathname).toBe("/api/users");
  });

  test("handles trailing slash behavior correctly", () => {
    const requireSlash = new RouteUrlBase({ trailingSlash: "require" });
    const forbidSlash = new RouteUrlBase({ trailingSlash: "forbid" });
    const ignoreSlash = new RouteUrlBase({ trailingSlash: "ignore" });

    expect(requireSlash.resolveUrl("/test").pathname).toBe("/test/");
    expect(forbidSlash.resolveUrl("/test/").pathname).toBe("/test");
    expect(ignoreSlash.resolveUrl("/test").pathname).toBe("/test");
    expect(ignoreSlash.resolveUrl("/test/").pathname).toBe("/test/");
  });

  test("handles hash routing correctly", () => {
    const routeUrl = new RouteUrlBase({ hashRouting: true });
    routeUrl.setUrl("/test#section");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/test");
  });

  test("handles relative URLs correctly", () => {
    const routeUrl = new RouteUrlBase({ relativeUrls: true, baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/api/test");
  });

  test("handles absolute URLs correctly", () => {
    const routeUrl = new RouteUrlBase({ relativeUrls: false, baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/test");
  });

  test("handles URL resolution edge cases", () => {
    const routeUrl = new RouteUrlBase();
    // Empty and root paths
    expect(routeUrl.resolveUrl("").pathname).toBe("/");
    expect(routeUrl.resolveUrl("/").pathname).toBe("/");
    expect(routeUrl.resolveUrl("//").pathname).toBe("/");

    // Multiple consecutive slashes
    expect(routeUrl.resolveUrl("//test//path").pathname).toBe("/test/path");

    // Trailing slashes
    expect(routeUrl.resolveUrl("/test/").pathname).toBe("/test/");

    // With baseUrl
    const routeUrlWithBase = new RouteUrlBase({ baseUrl: "/api" });
    expect(routeUrlWithBase.resolveUrl("").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("/").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("//").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("//test//path").pathname).toBe(
      "/api/test/path"
    );
  });

  test("handles special characters in paths and parameters", () => {
    const routeUrl = new RouteUrlBase();
    // Unicode characters
    // expect(routeUrl.resolveUrl("/test/你好").pathname).toBe("/test/你好");

    // Special characters in query parameters
    routeUrl.setUrl("/test?param=hello%20world&special=!@#$%^&*()");
    const url = routeUrl.createRouteUrl();
    expect(url.getQuery().get("param")).toBe("hello world");
    expect(url.getQuery().get("special")).toBe("!@");

    // Special characters in hash
    routeUrl.setUrl("/test#section!@#$%^&*()");
    const url2 = routeUrl.createRouteUrl();
    expect(url2.getPath()).toBe("/test");
  });

  test("handles path traversal attempts", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/api/../test").pathname).toBe("/api/test");
    expect(routeUrl.resolveUrl("/api/./test").pathname).toBe("/api/test");
    expect(routeUrl.resolveUrl("/api/../../test").pathname).toBe("/api/test");
  });

  test("handles different baseUrl configurations", () => {
    // Empty baseUrl
    const emptyBase = new RouteUrlBase({ baseUrl: "" });
    expect(emptyBase.resolveUrl("/test").pathname).toBe("/test");

    // Root baseUrl
    const rootBase = new RouteUrlBase({ baseUrl: "/" });
    expect(rootBase.resolveUrl("/test").pathname).toBe("/test");

    // Multiple trailing slashes in baseUrl
    const multiSlashBase = new RouteUrlBase({ baseUrl: "/api//" });
    expect(multiSlashBase.resolveUrl("/test").pathname).toBe("/api/test");
  });

  test("handles query parameters with baseUrl", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    routeUrl.setUrl("/api/test?param=value");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/test");
    expect(url.getQuery().get("param")).toBe("value");
  });

  test("handles hash fragments with baseUrl", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    routeUrl.setUrl("/api/test#section");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/test");
  });

  test("handles combined edge cases", () => {
    const routeUrl = new RouteUrlBase({
      baseUrl: "/api",
      hashRouting: true, // Enable hash routing for this test
      trailingSlash: "ignore", // Add trailing slash configuration
    });
    // Complex URL with all components
    routeUrl.setUrl("/api/test/你好?param=value#section");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/test/你好");
    expect(url.getQuery().get("param")).toBe("value");

    // Multiple trailing slashes with query params
    // expect(routeUrl.resolveUrl("/api/test//?param=value").pathname).toBe(
    //   "/api/test"
    // );

    // Unicode in query parameters
    routeUrl.setUrl("/api/test?param=你好");
    const url2 = routeUrl.createRouteUrl();
    expect(url2.getQuery().get("param")).toBe("你好");
  });

  test("handles combined edge cases with hash fragments", () => {
    const routeUrl = new RouteUrlBase({
      baseUrl: "/api",
      relativeUrls: true,
      trailingSlash: "ignore",
      hashRouting: false, // Disable hash routing for this test
    });

    // Unicode characters with query params and hash
    routeUrl.setUrl("/api/test/你好?param=value#section");
    const url = routeUrl.createRouteUrl();
    expect(url.getPath()).toBe("/test/你好");
    expect(url.getQuery().get("param")).toBe("value");

    // Multiple trailing slashes with query params
    // routeUrl.setUrl("/api/test//?param=value");
    // expect(routeUrl.getPath()).toBe("/test");
    // expect(routeUrl.getQuery().get("param")).toBe("value");
  });

  test("subscribe and emitChange work correctly", () => {
    const routeUrl = new RouteUrlBase();
    let path = "";
    const sub = routeUrl.subscribe((routeUrl) => {
      path = routeUrl.getPath();
    });
    routeUrl.setUrl("/new-path");
    expect(path).toBe("/new-path");
    sub.unsubscribe();
  });

  test("history navigation works correctly", () => {
    const routeUrl = new RouteUrlBase();
    routeUrl.setUrl("/path1");
    routeUrl.setUrl("/path2");
    routeUrl.back();
    const url1 = routeUrl.createRouteUrl();
    expect(url1.getPath()).toBe("/path1");
    routeUrl.forward();
    const url2 = routeUrl.createRouteUrl();
    expect(url2.getPath()).toBe("/path2");
  });

  test("canNavigate checks base URL correctly", () => {
    const routeUrl = new RouteUrlBase({ baseUrl: "/api" });
    expect(routeUrl.canNavigate(new URL("/api/test", "http://localhost"))).toBe(
      true
    );
    expect(
      routeUrl.canNavigate(new URL("/other/test", "http://localhost"))
    ).toBe(false);
  });

  test("dispose cleans up listeners", () => {
    const routeUrl = new RouteUrlBase();
    let called = false;
    const sub = routeUrl.subscribe(() => {
      called = true;
    });
    routeUrl.dispose();
    routeUrl.setUrl("/test");
    expect(called).toBe(false);
  });
});
