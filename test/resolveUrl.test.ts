import { describe, it, expect } from "vitest";
import { resolveUrl } from "../src/resolveUrl";

describe("resolveUrl", () => {
  const defaultOptions = {
    baseUrl: "",
    relativeUrls: false,
    trailingSlash: "ignore" as const,
  };

  describe("path traversal", () => {
    it("should resolve single level up with ..", () => {
      const url = resolveUrl("/dashboard/yo/../", defaultOptions);
      expect(url.pathname).toBe("/dashboard/");
    });

    it("should resolve multiple levels up with consecutive ..", () => {
      const url = resolveUrl("/a/b/c/../../", defaultOptions);
      expect(url.pathname).toBe("/a/");
    });

    it("should handle multiple .. segments at the start", () => {
      const url = resolveUrl("/../../a/b", defaultOptions);
      expect(url.pathname).toBe("/a/b");
    });

    it("should not go beyond root with multiple ..", () => {
      const url = resolveUrl("/../../", defaultOptions);
      expect(url.pathname).toBe("/");
    });

    it("should handle . segments correctly", () => {
      const url = resolveUrl("/a/./b/./c", defaultOptions);
      expect(url.pathname).toBe("/a/b/c");
    });

    it("should handle mixed . and .. segments", () => {
      const url = resolveUrl("/a/./b/../c", defaultOptions);
      expect(url.pathname).toBe("/a/c");
    });

    it("should handle complex path traversal", () => {
      const url = resolveUrl(
        "/dashboard/users/../settings/../profile/",
        defaultOptions
      );
      expect(url.pathname).toBe("/dashboard/profile/");
    });

    it("should preserve trailing slashes when present in original path", () => {
      const url = resolveUrl("/a/b/../", defaultOptions);
      expect(url.pathname).toBe("/a/");
    });

    it("should handle path traversal with query parameters", () => {
      const url = resolveUrl("/a/b/../?id=123", defaultOptions);
      expect(url.pathname).toBe("/a/");
      expect(url.search).toBe("?id=123");
    });
  });

  describe("edge cases", () => {
    it("should handle empty path", () => {
      const url = resolveUrl("", defaultOptions);
      expect(url.pathname).toBe("/");
    });

    it("should handle root path", () => {
      const url = resolveUrl("/", defaultOptions);
      expect(url.pathname).toBe("/");
    });

    it("should handle multiple consecutive slashes", () => {
      const url = resolveUrl("/a//b///c", defaultOptions);
      expect(url.pathname).toBe("/a/b/c");
    });

    it("should handle paths with baseUrl", () => {
      const url = resolveUrl("/api/dashboard/../users", {
        ...defaultOptions,
        baseUrl: "/api",
      });
      expect(url.pathname).toBe("/users");
    });
  });
});
