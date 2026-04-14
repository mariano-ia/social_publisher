import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a compact status summary per tenant for the sidebar indicator.
 * Shape: { tenants: [{ slug, activeStatus, recentlyFinished }] }
 *
 * - activeStatus: "generating" | "images_pending" | null
 * - recentlyFinished: true if the latest run finished within the last
 *   90 seconds (so we can flash a check mark as the "just done" signal)
 */
export async function GET() {
  const sb = createServerClient();
  const { data: tenants, error: tErr } = await sb.from("tenants").select("id, slug");
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  if (!tenants) return NextResponse.json({ tenants: [] });

  const results = await Promise.all(
    tenants.map(async (t) => {
      const { data: runs } = await sb
        .from("generation_runs")
        .select("status, started_at, completed_at")
        .eq("tenant_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const latest = runs?.[0];
      let activeStatus: string | null = null;
      let recentlyFinished = false;
      if (latest) {
        if (
          latest.status === "generating" ||
          latest.status === "images_pending" ||
          latest.status === "pending"
        ) {
          activeStatus = latest.status;
        } else if (
          (latest.status === "ready_for_review" ||
            latest.status === "approved" ||
            latest.status === "exported") &&
          latest.completed_at
        ) {
          const finishedMs = Date.now() - new Date(latest.completed_at).getTime();
          if (finishedMs < 90_000) recentlyFinished = true;
        }
      }
      return { slug: t.slug, activeStatus, recentlyFinished };
    }),
  );

  return NextResponse.json({ tenants: results });
}
