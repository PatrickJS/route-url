import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRouter, makeLinkHandler } from "../src/router";

// Minimal window mocks for history/hash
const mockLocation = {
  pathname: "/",
  search: "",
  hash: "",
  origin: "http://localhost",
} as unknown as Location;

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
} as unknown as History;

describe("Router", () => {
  beforeEach(() => {
    (globalThis as any).window = {
      location: mockLocation,
      history: mockHistory,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    mockLocation.pathname = "/";
    mockLocation.search = "";
    mockLocation.hash = "";
    vi.clearAllMocks();
  });

  it("app-relative by default and mount join", async () => {
    const r = createRouter({ mode: "memory", mount: "/portal/apps/billing", trailingSlash: "require", initial: "/" });
    await r.navigate("/invoice/123");
    expect(r.url.pathname).toBe("/portal/apps/billing/invoice/123/");
    expect(r.appPath).toBe("/invoice/123/");
    const href = r.link("/invoices");
    expect(href).toBe("/portal/apps/billing/invoices/");
  });

  it("changing mount at runtime", async () => {
    const r = createRouter({ mode: "memory", mount: "/a", initial: "/a/x" });
    expect(r.appPath).toBe("/x");
    r.setMount("/b");
    // host path stays same, appPath recalculated against new mount
    expect(r.appPath).toBe("/");
    await r.navigate("/y");
    expect(r.url.pathname).toBe("/b/y");
  });

  it("guards block and redirect in app space", async () => {
    const r = createRouter({ mode: "memory", mount: "/m" });
    const off = r.guard((next) => {
      const isForbidden = next.pathname.endsWith("/secret");
      if (isForbidden) return "/login"; // redirect
      return true;
    });
    await r.navigate("/secret");
    expect(r.url.pathname).toBe("/m/login");
    off();
  });

  it("scoped routers preserve app-relative logic", async () => {
    const r = createRouter({ mode: "memory", mount: "/m" });
    const settings = r.scope("/settings");
    await settings.navigate("/profile");
    expect(r.url.pathname).toBe("/m/settings/profile");
    expect(settings.appPath).toMatch(/^\/?settings\//);
  });

  it("hash-only navigations (history adapter in hash mode)", async () => {
    const r = createRouter({ mode: "hash", mount: "/app" });
    await r.navigate("/d");
    // We can't assert window.history calls in memory-less env, but link building should work
    expect(r.link("/d")).toBe("/app/d");
  });

  it("unicode and special chars", async () => {
    const r = createRouter({ mode: "memory", mount: "/m" });
    await r.navigate("/test/你好?param=hello%20world&special=%21%40");
    expect(r.appPath).toBe("/test/你好");
    expect(r.query.get("param")).toBe("hello world");
    expect(r.query.get("special")).toBe("!@");
  });

  it("traversal attempts are clamped", async () => {
    const r = createRouter({ mode: "memory", mount: "/m" });
    await r.navigate("/a/../b");
    expect(r.url.pathname).toBe("/m/b");
  });

  it("makeLinkHandler prevents default for app links", async () => {
    const r = createRouter({ mode: "memory", mount: "/m" });
    const handler = makeLinkHandler(r);
    const prevent = vi.fn();
    const anchor = { getAttribute: (k: string) => (k === "href" ? "/x" : null) } as any;
    const ev = { currentTarget: anchor, metaKey: false, ctrlKey: false, shiftKey: false, button: 0, preventDefault: prevent } as any as MouseEvent;
    handler(ev);
    expect(prevent).toHaveBeenCalled();
    expect(r.url.pathname).toBe("/m/x");
  });
});


