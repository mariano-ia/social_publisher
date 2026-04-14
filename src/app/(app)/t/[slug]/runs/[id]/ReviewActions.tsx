"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAllInRun } from "./actions";

interface Props {
  runId: string;
  tenantSlug: string;
  status: string;
  postCount: number;
}

export function ReviewActions({ runId, tenantSlug, status, postCount }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (status !== "ready_for_review" && status !== "approved" && status !== "exported") return null;
  if (postCount === 0) return null;

  const handleApproveAll = () => {
    startTransition(async () => {
      await approveAllInRun(runId);
      router.refresh();
    });
  };

  const handleApproveAndDownload = () => {
    startTransition(async () => {
      await approveAllInRun(runId);
      window.location.href = `/api/runs/${runId}/export`;
    });
  };

  const handleDownload = () => {
    window.location.href = `/api/runs/${runId}/export`;
  };

  return (
    <div className="flex gap-2">
      {status === "ready_for_review" && (
        <>
          <button onClick={handleApproveAll} className="btn btn-secondary" disabled={pending}>
            Aprobar todo
          </button>
          <button onClick={handleApproveAndDownload} className="btn btn-primary" disabled={pending}>
            Aprobar y descargar
          </button>
        </>
      )}
      {(status === "approved" || status === "exported") && (
        <button onClick={handleDownload} className="btn btn-primary">
          Descargar ZIP
        </button>
      )}
    </div>
  );
}
