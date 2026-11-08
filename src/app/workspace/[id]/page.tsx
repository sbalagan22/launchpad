"use client";

import { use } from "react";
import { WorkspaceShell } from "@/components/workspace-view";

export default function WorkspaceProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <WorkspaceShell selectedId={id} />;
}
