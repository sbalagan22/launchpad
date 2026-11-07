"use client";

import { ProfilePage } from "@/components/profile-view";
import { PageContainer } from "@/components/nav";
import { EmptyState } from "@/components/ui";
import { useSession } from "@/hooks/use-query";

export default function MyProfile() {
  const { role, userId, hydrated } = useSession();
  if (role === "business") return <PageContainer><EmptyState title="Profiles belong to students" body="Switch to Student view to see and edit a student profile." /></PageContainer>;
  return <ProfilePage keyArg={{ id: userId }} editable hydrated={hydrated} />;
}
