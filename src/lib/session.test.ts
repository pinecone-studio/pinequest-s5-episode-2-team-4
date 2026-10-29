import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory cookie jar standing in for next/headers.
const jar = vi.hoisted(() => new Map<string, { value: string; options?: object }>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: object) => jar.set(name, { value, options }),
    delete: (name: string) => jar.delete(name),
  }),
}));

const findAccountById = vi.hoisted(() => vi.fn());
vi.mock("./accounts", () => ({ findAccountById, saveAccount: vi.fn() }));

const { SESSION_COOKIE, clearSession, readSession, startSession } = await import("./session");

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "Болд",
  role: "student",
  progress: { mastered: ["same-denominator"] },
};

const cookie = () => jar.get(SESSION_COOKIE)?.value;
const setCookie = (value: string) => jar.set(SESSION_COOKIE, { value });
const base64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

beforeEach(() => {
  jar.clear();
  findAccountById.mockReset();
  findAccountById.mockImplementation(async (id: string) => (id === account.id ? account : undefined));
  vi.stubEnv("SESSION_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session cookie", () => {
  it("logs in and reads the account back", async () => {
    await startSession(account.id);
    expect(jar.get(SESSION_COOKIE)?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await readSession()).toMatchObject({ id: account.id, username: "Болд", mastered: ["same-denominator"] });
  });

  it("only stores the signed id, not the account", async () => {
    await startSession(account.id);
    const [payload] = cookie()!.split(".");
    expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))).toEqual({ id: account.id });
  });

  it("is logged out without a cookie or after clearSession", async () => {
    expect(await readSession()).toBeUndefined();
    await startSession(account.id);
    await clearSession();
    expect(cookie()).toBeUndefined();
    expect(await readSession()).toBeUndefined();
  });

  it("rejects a cookie whose payload was edited", async () => {
    await startSession(account.id);
    const [, signature] = cookie()!.split(".");
    setCookie(`${base64url({ id: "22222222-2222-4222-8222-222222222222" })}.${signature}`);
    expect(await readSession()).toBeUndefined();
    expect(findAccountById).not.toHaveBeenCalled();
  });

  it("rejects a cookie signed with another secret", async () => {
    vi.stubEnv("SESSION_SECRET", "other-secret");
    await startSession(account.id);
    vi.stubEnv("SESSION_SECRET", "test-secret");
    expect(await readSession()).toBeUndefined();
  });

  it.each([
    ["no signature", () => base64url({ id: account.id })],
    ["an extra part", () => `${cookie()}.extra`],
    ["an empty value", () => ""],
  ])("rejects a cookie with %s", async (_, value) => {
    await startSession(account.id);
    setCookie(value());
    expect(await readSession()).toBeUndefined();
  });

  it("is logged out when the account no longer exists", async () => {
    findAccountById.mockResolvedValue(undefined);
    await startSession(account.id);
    expect(await readSession()).toBeUndefined();
  });

  it("needs SESSION_SECRET in production", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(startSession(account.id)).rejects.toThrow("SESSION_SECRET is not set");
  });
});
