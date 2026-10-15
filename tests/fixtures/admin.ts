import { createServerClient } from "@supabase/ssr";
import {
  expect,
  type BrowserContext,
  type Page,
  type Request,
  type Locator,
} from "@playwright/test";
import accounts from "./admin-accounts.json";
import { appOrigin as origin } from "./app-origin";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
if (url !== "http://127.0.0.1:54321")
  throw new Error("Admin tests require the fixed local provider.");
export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: false }).fill(accounts.admin.email);
  await page
    .getByLabel("Password", { exact: false })
    .fill(accounts.admin.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
}
export async function setSession(
  context: BrowserContext,
  role: "admin" | "nonAdmin",
  expired = false,
) {
  const store = new Map<string, string>();
  const client = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => [...store].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) store.set(name, value);
      },
    },
  });
  const { error } = await client.auth.signInWithPassword(accounts[role]);
  if (error) throw new Error("Local test authentication failed.");
  const cookies = [...store];
  if (expired) {
    const auth = cookies
      .filter(([name]) => /-auth-token(?:\.\d+)?$/.test(name))
      .sort(([a], [b]) => a.localeCompare(b));
    const value = auth.map(([, part]) => part).join("");
    const session = JSON.parse(
      Buffer.from(value.slice("base64-".length), "base64url").toString(),
    );
    session.expires_at = 1;
    const modified = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    const authName = auth[0][0].replace(/\.\d+$/, "");
    for (const [name] of auth) store.delete(name);
    for (
      let offset = 0, index = 0;
      offset < modified.length;
      offset += 3000, index++
    )
      store.set(`${authName}.${index}`, modified.slice(offset, offset + 3000));
  }
  await context.addCookies(
    [...store].map(([name, value]) => ({
      name,
      value,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    })),
  );
}
export async function captureSave(
  page: Page,
  button: string,
  target: Page | Locator = page,
) {
  const request = page.waitForRequest(
    (item) => item.method() === "POST" && !!item.headers()["next-action"],
  );
  await target.getByRole("button", { name: button, exact: true }).click();
  const submitted = await request;
  await submitted.response();
  return submitted;
}
export async function assertDenied(
  request: Request,
  anonymous: BrowserContext,
  nonAdmin: BrowserContext,
) {
  const body = request.postDataBuffer();
  if (!body) throw new Error("Missing action payload.");
  const headers = request.headers();
  for (const [context, message] of [
    [anonymous, "Please sign in."],
    [nonAdmin, "Access denied."],
  ] as const) {
    const response = await context.request.post(request.url(), {
      headers: {
        origin,
        "content-type": headers["content-type"],
        "next-action": headers["next-action"],
      },
      data: body,
    });
    expect(await response.text()).toContain(message);
  }
}
