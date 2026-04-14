import { createServerClient, ASSETS_BUCKET } from "@/lib/db/supabase";

interface RenderHtmlInput {
  html: string;
  width: number;
  height: number;
  tenantSlug: string;
  postId: string;
  filename: string; // e.g. "single.png" or "slide-01.png"
}

let chromiumPromise: Promise<unknown> | null = null;
let puppeteerPromise: Promise<unknown> | null = null;

// Minimal interface we need from a puppeteer Browser/Page so this file
// doesn't depend on the full puppeteer types (they pull in heavy deps).
interface MinimalPage {
  setViewport(opts: { width: number; height: number; deviceScaleFactor: number }): Promise<void>;
  setContent(html: string, opts: { waitUntil: string; timeout: number }): Promise<void>;
  screenshot(opts: { type: string; omitBackground: boolean }): Promise<Buffer>;
}
interface MinimalBrowser {
  newPage(): Promise<MinimalPage>;
  close(): Promise<void>;
}

async function getBrowser(): Promise<MinimalBrowser> {
  if (!chromiumPromise) chromiumPromise = import("@sparticuz/chromium");
  if (!puppeteerPromise) puppeteerPromise = import("puppeteer-core");
  const [chromium, puppeteer] = await Promise.all([chromiumPromise, puppeteerPromise]);

  const chromiumModule = (chromium as { default?: unknown }).default ?? chromium;
  const puppeteerModule = (puppeteer as { default?: unknown }).default ?? puppeteer;
  const cm = chromiumModule as { executablePath: () => Promise<string>; args: string[] };
  const pm = puppeteerModule as {
    launch: (opts: Record<string, unknown>) => Promise<MinimalBrowser>;
  };

  const isVercel = !!process.env.VERCEL;
  const executablePath = isVercel
    ? await cm.executablePath()
    : process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  const browser = await pm.launch({
    args: isVercel ? cm.args : ["--no-sandbox", "--disable-gpu"],
    defaultViewport: null,
    executablePath,
    headless: true,
  });
  return browser;
}

export async function renderHtmlToPng(
  input: RenderHtmlInput,
): Promise<{ publicUrl: string; storagePath: string; width: number; height: number }> {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: input.width, height: input.height, deviceScaleFactor: 1 });
    await page.setContent(input.html, { waitUntil: "networkidle0", timeout: 30000 });
    // Give fonts an extra beat
    await new Promise((r) => setTimeout(r, 800));
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
    await browser.close().catch(() => {});
  }
}

export const FORMAT_DIMENSIONS: Record<"ig_feed" | "li_single" | "li_carousel_slide", { width: number; height: number }> = {
  ig_feed: { width: 1080, height: 1080 },
  li_single: { width: 1200, height: 800 },
  li_carousel_slide: { width: 1080, height: 1350 },
};
