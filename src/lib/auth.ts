import { cookies } from "next/headers";

const COOKIE_NAME = "sp_auth";
const ONE_WEEK = 7 * 24 * 60 * 60;

export function buildToken(): string {
  const pwd = process.env.APP_PASSWORD ?? "";
  return Buffer.from(`sp:${pwd}`).toString("base64");
}

export async function setAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, buildToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_WEEK,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function checkPassword(input: string): boolean {
  const pwd = process.env.APP_PASSWORD ?? "";
  return input === pwd && pwd.length > 0;
}
