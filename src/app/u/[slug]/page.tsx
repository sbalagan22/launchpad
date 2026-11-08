"use client";

import { use } from "react";
import { PublicProfile } from "@/components/profile-view";

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <PublicProfile slug={slug} />;
}
