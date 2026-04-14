"use server";

import { revalidatePath } from "next/cache";
import {
  updatePost,
  bulkUpdatePostsStatus,
  getPostsByRun,
  updateRun,
  getPost,
} from "@/lib/db/queries";
import { rerenderPost } from "@/lib/rendering/orchestrate";

export async function approvePost(postId: string): Promise<void> {
  await updatePost(postId, { status: "approved" });
  revalidatePath("/t");
}

export async function rejectPost(postId: string): Promise<void> {
  await updatePost(postId, { status: "rejected" });
  revalidatePath("/t");
}

export async function changeTemplate(postId: string, newSlug: string): Promise<void> {
  const post = await getPost(postId);
  if (!post) throw new Error("post not found");
  await updatePost(postId, { visual_template_slug: newSlug });
  // Re-render with the new template
  await rerenderPost(postId);
  revalidatePath("/t");
}

export async function approveAllInRun(runId: string): Promise<void> {
  const posts = await getPostsByRun(runId);
  const ids = posts.filter((p) => p.status === "draft").map((p) => p.id);
  await bulkUpdatePostsStatus(ids, "approved");
  await updateRun(runId, { status: "approved" });
  revalidatePath("/t");
}
