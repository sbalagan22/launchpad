"use client";

import { useParams } from "next/navigation";
import { ProfilePage } from "@/components/profile-view";
import { useSession } from "@/hooks/use-query";

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { hydrated } = useSession();
  return <ProfilePage keyArg={{ slug }} editable={false} hydrated={hydrated} />;
}
