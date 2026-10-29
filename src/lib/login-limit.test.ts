import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A fake Supabase query: records the filters and resolves to `result`.
const query = vi.hoisted(() => ({
  result: { data: [] as { failed_at: string }[] | null, error: null as { message: string } | null },
  filters: [] as unknown[][],
}));
vi.mock("./supabase", () => ({
  getSupabaseAdmin: () => {
    const builder: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown) => resolve(query.result),
    };
    for (const method of ["from", "select", "eq", "gte", "lt", "order", "limit", "insert", "delete"]) {
      builder[method] = (...args: unknown[]) => {
        query.filters.push([method, ...args]);
        return builder;
      };
    }
    return builder;
  },
}));

const { loginBlockedMinutes } = await import("./login-limit");

const MINUTE = 60_000;
const NOW = Date.parse("2026-10-29T10:00:00Z");

/** Failed logins this many minutes ago, newest first like the query. */
const failures = (...minutesAgo: number[]) =>
  minutesAgo.map((m) => ({ failed_at: new Date(NOW - m * MINUTE).toISOString() }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  query.result = { data: [], error: null };
  query.filters = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loginBlockedMinutes", () => {
  it("doesn't block with fewer than 5 failures", async () => {
    query.result.data = failures(0, 1, 2, 3);
    expect(await loginBlockedMinutes("bold")).toBe(0);
  });

  it("blocks for 15 minutes after the 5th failure", async () => {
    query.result.data = failures(0, 1, 2, 3, 4);
    expect(await loginBlockedMinutes("bold")).toBe(15);
  });

  it("counts the block from the latest failure, rounding up", async () => {
    query.result.data = failures(10.5, 11, 12, 13, 14);
    expect(await loginBlockedMinutes("bold")).toBe(5);
  });

  it("lifts the block 15 minutes after the latest failure", async () => {
    query.result.data = failures(15, 16, 17, 18, 19);
    expect(await loginBlockedMinutes("bold")).toBe(0);
  });

  it("doesn't block when the 5 failures span more than 15 minutes", async () => {
    query.result.data = failures(0, 5, 10, 14, 16);
    expect(await loginBlockedMinutes("bold")).toBe(0);
  });

  it("matches the username case-insensitively", async () => {
    await loginBlockedMinutes("BoLd");
    expect(query.filters).toContainEqual(["eq", "username_key", "bold"]);
  });

  it("throws when the query fails", async () => {
    query.result = { data: null, error: { message: "offline" } };
    await expect(loginBlockedMinutes("bold")).rejects.toThrow("Could not check failed logins: offline");
  });
});
