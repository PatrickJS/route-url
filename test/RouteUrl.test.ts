import { describe, test, expect } from "vitest";
import { RouteUrl } from "../src/RouteUrl";

describe("RouteUrl", () => {
  test("initializes with default path", () => {
    const routeUrl = new RouteUrl();
    expect(routeUrl.getPath()).toBe("/");
  });

  test("resolves URL correctly with trailing slash required", () => {
    const routeUrl = new RouteUrl({
      baseUrl: "/base",
      trailingSlash: "require",
    });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/base/test/");
  });

  test("handles query parameters correctly", () => {
    const routeUrl = new RouteUrl();
    routeUrl.setUrl("/test?param1=value1&param2=value2");
    const query = routeUrl.getQuery();
    expect(query.get("param1")).toBe("value1");
    expect(query.get("param2")).toBe("value2");
  });

  test("extracts route parameters correctly", () => {
    const routeUrl = new RouteUrl();
    routeUrl.setUrl("/users/123/posts/456");
    const params = routeUrl.getParams("/users/:userId/posts/:postId");
    expect(params).toEqual({
      userId: "123",
      postId: "456",
    });
  });

  test("handles base URL correctly", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    routeUrl.setUrl("/api/users");
    expect(routeUrl.getPath()).toBe("/users");
  });

  test("handles paths that already contain baseUrl", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    // Should handle both cases correctly
    expect(routeUrl.resolveUrl("/api/users").pathname).toBe("/api/users");
    expect(routeUrl.resolveUrl("/users").pathname).toBe("/api/users");
  });

  test("handles trailing slash behavior correctly", () => {
    const requireSlash = new RouteUrl({ trailingSlash: "require" });
    const forbidSlash = new RouteUrl({ trailingSlash: "forbid" });
    const ignoreSlash = new RouteUrl({ trailingSlash: "ignore" });

    expect(requireSlash.resolveUrl("/test").pathname).toBe("/test/");
    expect(forbidSlash.resolveUrl("/test/").pathname).toBe("/test");
    expect(ignoreSlash.resolveUrl("/test").pathname).toBe("/test");
    expect(ignoreSlash.resolveUrl("/test/").pathname).toBe("/test/");
  });

  test("handles hash routing correctly", () => {
    const routeUrl = new RouteUrl({ hashRouting: true });
    routeUrl.setUrl("/test#section");
    expect(routeUrl.getPath()).toBe("/test");
  });

  test("handles relative URLs correctly", () => {
    const routeUrl = new RouteUrl({ relativeUrls: true, baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/api/test");
  });

  test("handles absolute URLs correctly", () => {
    const routeUrl = new RouteUrl({ relativeUrls: false, baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/test").pathname).toBe("/test");
  });

  test("handles URL resolution edge cases", () => {
    const routeUrl = new RouteUrl();
    // Empty and root paths
    expect(routeUrl.resolveUrl("").pathname).toBe("/");
    expect(routeUrl.resolveUrl("/").pathname).toBe("/");
    expect(routeUrl.resolveUrl("//").pathname).toBe("/");

    // Multiple consecutive slashes
    expect(routeUrl.resolveUrl("//test//path").pathname).toBe("/test/path");

    // Trailing slashes
    expect(routeUrl.resolveUrl("/test/").pathname).toBe("/test/");

    // With baseUrl
    const routeUrlWithBase = new RouteUrl({ baseUrl: "/api" });
    expect(routeUrlWithBase.resolveUrl("").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("/").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("//").pathname).toBe("/api");
    expect(routeUrlWithBase.resolveUrl("//test//path").pathname).toBe(
      "/api/test/path"
    );
  });

  test("handles special characters in paths and parameters", () => {
    const routeUrl = new RouteUrl();
    // Unicode characters
    // expect(routeUrl.resolveUrl("/test/你好").pathname).toBe("/test/你好");

    // Special characters in query parameters
    routeUrl.setUrl("/test?param=hello%20world&special=!@#$%^&*()");
    expect(routeUrl.getQuery().get("param")).toBe("hello world");
    expect(routeUrl.getQuery().get("special")).toBe("!@");

    // Special characters in hash
    routeUrl.setUrl("/test#section!@#$%^&*()");
    expect(routeUrl.getPath()).toBe("/test");
  });

  test("handles path traversal attempts", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    expect(routeUrl.resolveUrl("/api/../test").pathname).toBe("/api/test");
    expect(routeUrl.resolveUrl("/api/./test").pathname).toBe("/api/test");
    expect(routeUrl.resolveUrl("/api/../../test").pathname).toBe("/api/test");
  });

  test("handles different baseUrl configurations", () => {
    // Empty baseUrl
    const emptyBase = new RouteUrl({ baseUrl: "" });
    expect(emptyBase.resolveUrl("/test").pathname).toBe("/test");

    // Root baseUrl
    const rootBase = new RouteUrl({ baseUrl: "/" });
    expect(rootBase.resolveUrl("/test").pathname).toBe("/test");

    // Multiple trailing slashes in baseUrl
    const multiSlashBase = new RouteUrl({ baseUrl: "/api//" });
    expect(multiSlashBase.resolveUrl("/test").pathname).toBe("/api/test");
  });

  test("handles query parameters with baseUrl", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    routeUrl.setUrl("/api/test?param=value");
    expect(routeUrl.getPath()).toBe("/test");
    expect(routeUrl.getQuery().get("param")).toBe("value");
  });

  test("handles hash fragments with baseUrl", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    routeUrl.setUrl("/api/test#section");
    expect(routeUrl.getPath()).toBe("/test");
  });

  test("handles combined edge cases", () => {
    const routeUrl = new RouteUrl({
      baseUrl: "/api",
      hashRouting: true, // Enable hash routing for this test
      trailingSlash: "ignore", // Add trailing slash configuration
    });
    // Complex URL with all components
    routeUrl.setUrl("/api/test/你好?param=value#section");
    expect(routeUrl.getPath()).toBe("/test/你好");
    expect(routeUrl.getQuery().get("param")).toBe("value");

    // Multiple trailing slashes with query params
    // expect(routeUrl.resolveUrl("/api/test//?param=value").pathname).toBe(
    //   "/api/test"
    // );

    // Unicode in query parameters
    routeUrl.setUrl("/api/test?param=你好");
    expect(routeUrl.getQuery().get("param")).toBe("你好");
  });

  test("handles combined edge cases with hash fragments", () => {
    const routeUrl = new RouteUrl({
      baseUrl: "/api",
      relativeUrls: true,
      trailingSlash: "ignore",
      hashRouting: false, // Disable hash routing for this test
    });

    // Unicode characters with query params and hash
    routeUrl.setUrl("/api/test/你好?param=value#section");
    expect(routeUrl.getPath()).toBe("/test/你好");
    expect(routeUrl.getQuery().get("param")).toBe("value");

    // Multiple trailing slashes with query params
    // routeUrl.setUrl("/api/test//?param=value");
    // expect(routeUrl.getPath()).toBe("/test");
    // expect(routeUrl.getQuery().get("param")).toBe("value");
  });

  test("subscribe and emitChange work correctly", () => {
    const routeUrl = new RouteUrl();
    let path = "";
    const sub = routeUrl.subscribe((routeUrl) => {
      path = routeUrl.getPath();
    });
    routeUrl.setUrl("/new-path");
    expect(path).toBe("/new-path");
    sub.unsubscribe();
  });

  test("history navigation works correctly", () => {
    const routeUrl = new RouteUrl();
    routeUrl.setUrl("/path1");
    routeUrl.setUrl("/path2");
    routeUrl.back();
    expect(routeUrl.getPath()).toBe("/path1");
    routeUrl.forward();
    expect(routeUrl.getPath()).toBe("/path2");
  });

  test("canNavigate checks base URL correctly", () => {
    const routeUrl = new RouteUrl({ baseUrl: "/api" });
    expect(routeUrl.canNavigate(new URL("/api/test", "http://localhost"))).toBe(
      true
    );
    expect(
      routeUrl.canNavigate(new URL("/other/test", "http://localhost"))
    ).toBe(false);
  });

  test("dispose cleans up listeners", () => {
    const routeUrl = new RouteUrl();
    let called = false;
    const sub = routeUrl.subscribe(() => {
      called = true;
    });
    routeUrl.dispose();
    routeUrl.setUrl("/test");
    expect(called).toBe(false);
  });
});
