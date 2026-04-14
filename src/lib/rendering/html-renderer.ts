import { createServerClient, ASSETS_BUCKET } from "@/lib/db/supabase";

interface RenderHtmlInput {
  html: string;
  width: number;
  height: number;
  tenantSlug: string;
  postId: string;
  filename: string; // e.g. "single.png" or "slide-01.png"
}

// Pinned chromium tarball — must match @sparticuz/chromium-min version in package.json.
const CHROMIUM_TARBALL_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar";

// ─────────────────────────────────────────────────────────────────────────────
// Singleton browser per Vercel function invocation.
//
// Why: launching chromium is slow (~2s) and racy — concurrent launches on the
// same serverless container cause "spawn ETXTBSY" because workers try to exec
// the chromium binary while another is still extracting it from the tarball.
//
// A single shared browser instance avoids both problems:
//  - Workers share the already-launched browser (cheaper)
//  - Each worker opens a fresh page, does its work, closes the page
//  - The browser stays alive for the entire invocation (Vercel will reap the
//    container when the function exits)
//
// The FIRST caller triggers the launch; all concurrent callers await the
// same promise. Subsequent calls reuse the already-resolved browser.
// ─────────────────────────────────────────────────────────────────────────────

interface MinimalPage {
  setViewport(opts: { width: number; height: number; deviceScaleFactor: number }): Promise<void>;
  setContent(html: string, opts: { waitUntil: string; timeout: number }): Promise<void>;
  screenshot(opts: { type: string; omitBackground: boolean }): Promise<Buffer>;
  close(): Promise<void>;
}
interface MinimalBrowser {
  newPage(): Promise<MinimalPage>;
  close(): Promise<void>;
}

let _browserPromise: Promise<MinimalBrowser> | null = null;

async function launchBrowser(): Promise<MinimalBrowser> {
  const [chromium, puppeteer] = await Promise.all([
    import("@sparticuz/chromium-min"),
    import("puppeteer-core"),
  ]);

  const chromiumModule = (chromium as { default?: unknown }).default ?? chromium;
  const puppeteerModule = (puppeteer as { default?: unknown }).default ?? puppeteer;
  const cm = chromiumModule as {
    executablePath: (url?: string) => Promise<string>;
    args: string[];
  };
  const pm = puppeteerModule as {
    launch: (opts: Record<string, unknown>) => Promise<MinimalBrowser>;
  };

  const isVercel = !!process.env.VERCEL;
  const executablePath = isVercel
    ? await cm.executablePath(CHROMIUM_TARBALL_URL)
    : process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  const browser = await pm.launch({
    args: isVercel
      ? [
          ...cm.args,
          // Reduce shared-memory requirements for Vercel's constrained env
          "--disable-dev-shm-usage",
        ]
      : ["--no-sandbox", "--disable-gpu"],
    defaultViewport: null,
    executablePath,
    headless: true,
  });
  return browser;
}

async function getBrowser(): Promise<MinimalBrowser> {
  if (!_browserPromise) {
    _browserPromise = launchBrowser().catch((err) => {
      // On failure, reset so the next call retries the launch instead of
      // permanently caching a rejected promise.
      _browserPromise = null;
      throw err;
    });
  }
  return _browserPromise;
}

/**
 * Warm the browser BEFORE any concurrent renders start. Call this once at the
 * top of a batch render loop so subsequent concurrent renders all hit the
 * cached browser instead of trying to launch chromium in parallel (which is
 * what caused spawn ETXTBSY in production).
 */
export async function prewarmBrowser(): Promise<void> {
  try {
    await getBrowser();
  } catch (err) {
    // Don't crash the whole batch if prewarm fails — individual renders will
    // retry and surface their own errors with per-post context.
    console.error("[html-renderer] prewarm failed:", err);
  }
}

/**
 * Explicitly tear down the shared browser. Call this at the end of a batch
 * if you want to be polite to the platform; otherwise the container reaper
 * handles it. Safe to call multiple times.
 */
export async function teardownBrowser(): Promise<void> {
  if (!_browserPromise) return;
  try {
    const browser = await _browserPromise;
    await browser.close().catch(() => {});
  } catch {
    /* ignore */
  } finally {
    _browserPromise = null;
  }
}

export async function renderHtmlToPng(
  input: RenderHtmlInput,
): Promise<{ publicUrl: string; storagePath: string; width: number; height: number }> {
  const browser = await getBrowser();
  let page: MinimalPage | null = null;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: input.width, height: input.height, deviceScaleFactor: 1 });
    // waitUntil "load" fires when the initial document + subresources in the
    // HTML are loaded. We don't use "networkidle0" because Google Fonts
    // requests can stall idle detection.
    await page.setContent(input.html, { waitUntil: "load", timeout: 15000 });
    // Give fonts + logo data URLs an extra beat to paint
    await new Promise((r) => setTimeout(r, 1500));
    const screenshot: Buffer = await page.screenshot({ type: "png", omitBackground: false });

    const filepath = `${input.tenantSlug}/${input.postId}/${input.filename}`;
    const sb = createServerClient();
    const { error: upErr } = await sb.storage
      .from(ASSETS_BUCKET)
      .upload(filepath, screenshot, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
    const { data: urlData } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(filepath);

    return {
      publicUrl: urlData.publicUrl,
      storagePath: filepath,
      width: input.width,
      height: input.height,
    };
  } finally {
    // Close the PAGE but NEVER close the browser — it's shared across renders
    // within this Vercel function invocation. The container reaper handles
    // cleanup when the function exits.
    if (page) await page.close().catch(() => {});
  }
}

export const FORMAT_DIMENSIONS: Record<"ig_feed" | "li_single" | "li_carousel_slide", { width: number; height: number }> = {
  ig_feed: { width: 1080, height: 1080 },
  li_single: { width: 1200, height: 800 },
  li_carousel_slide: { width: 1080, height: 1350 },
};
