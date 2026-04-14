/**
 * Smoke test for the rendering pipeline.
 * - Validates that prewarmBrowser + concurrent renderHtmlToPng calls don't
 *   race (the bug we're trying to fix).
 * - Renders one sample HTML for each Yacaré template via the shared browser.
 * - Tears down at the end.
 *
 * Run: npx tsx scripts/test-render-pipeline.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

// Import AFTER env vars are loaded
async function main() {
  const { prewarmBrowser, renderHtmlToPng, teardownBrowser } = await import(
    "../src/lib/rendering/html-renderer"
  );
  const { ycContrarianTake } = await import(
    "../src/lib/rendering/templates/yacare/yc-contrarian-take"
  );
  const { ycProcessStep } = await import(
    "../src/lib/rendering/templates/yacare/yc-process-step"
  );
  const { ycFaqCard } = await import("../src/lib/rendering/templates/yacare/yc-faq-card");

  console.log("→ Prewarming browser…");
  const t0 = Date.now();
  await prewarmBrowser();
  console.log(`  ✓ prewarmed in ${Date.now() - t0}ms`);

  console.log("→ Launching 3 concurrent renders (simulates the race condition)…");

  const OUT = "/tmp/social-publisher-smoketest";
  mkdirSync(OUT, { recursive: true });

  // We can't upload to storage without a tenant. Monkey-patch the renderer's
  // upload path by using a fake "tenantSlug" and posting to a dummy path.
  // Alternative: intercept the storage upload. Simplest here is to just
  // test the BROWSER side by writing to disk ourselves.
  const { createServerClient, ASSETS_BUCKET } = await import("../src/lib/db/supabase");
  const sb = createServerClient();

  const samples: Array<{ slug: string; html: string }> = [
    {
      slug: "yc-contrarian-take",
      html: ycContrarianTake({
        width: 1080,
        height: 1080,
        title: "Product judgment > shipping velocity",
        body_text: "Smoke test render from local dev.",
      }),
    },
    {
      slug: "yc-process-step",
      html: ycProcessStep({
        width: 1080,
        height: 1080,
        title: "Understand",
        body_text: "Sample body for the process step template.",
      }),
    },
    {
      slug: "yc-faq-card",
      html: ycFaqCard({
        width: 1080,
        height: 1080,
        title: "¿Se puede testear localmente?",
        body_text: "Sí, si el browser singleton funciona.",
      }),
    },
  ];

  const results = await Promise.allSettled(
    samples.map(async (s) => {
      const result = await renderHtmlToPng({
        html: s.html,
        width: 1080,
        height: 1080,
        tenantSlug: "smoketest",
        postId: `local-${s.slug}`,
        filename: `${s.slug}.png`,
      });
      return { slug: s.slug, result };
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      console.log(`  ✓ ${r.value.slug} → ${r.value.result.publicUrl}`);
    } else {
      console.error(`  ✗ FAILED:`, r.reason?.message ?? r.reason);
    }
  }

  console.log("→ Tearing down browser…");
  await teardownBrowser();
  console.log("  ✓ torn down");

  // Clean up storage smoketest files
  try {
    const { data: files } = await sb.storage.from(ASSETS_BUCKET).list("smoketest/local-yc-contrarian-take");
    if (files) {
      for (const f of files) {
        await sb.storage.from(ASSETS_BUCKET).remove([`smoketest/local-yc-contrarian-take/${f.name}`]);
      }
    }
    await sb.storage.from(ASSETS_BUCKET).list("smoketest/local-yc-process-step").then(async ({ data }) => {
      if (data) for (const f of data) await sb.storage.from(ASSETS_BUCKET).remove([`smoketest/local-yc-process-step/${f.name}`]);
    });
    await sb.storage.from(ASSETS_BUCKET).list("smoketest/local-yc-faq-card").then(async ({ data }) => {
      if (data) for (const f of data) await sb.storage.from(ASSETS_BUCKET).remove([`smoketest/local-yc-faq-card/${f.name}`]);
    });
    console.log("  ✓ smoketest storage cleaned up");
  } catch (e) {
    console.warn("  ⚠ cleanup warning:", e);
  }

  const failures = results.filter((r) => r.status === "rejected").length;
  if (failures > 0) {
    console.error(`\n✗ ${failures}/${results.length} renders failed`);
    process.exit(1);
  }
  console.log(`\n✓ All ${results.length} concurrent renders succeeded — singleton browser working correctly.`);
}

main().catch((err) => {
  console.error("✗ Smoketest crashed:", err);
  process.exit(1);
});
