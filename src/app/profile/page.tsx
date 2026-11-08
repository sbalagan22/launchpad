"use client";

import { PageContainer } from "@/components/nav";
import { PublicProfile } from "@/components/profile-view";
import { Button, EmptyState } from "@/components/ui";
import { useMe } from "@/components/use-me";

export default function MyProfile() {
  const { user, hydrated } = useMe();
  if (user?.student) return <PublicProfile slug={user.student.slug} own />;
  if (hydrated) return <PageContainer><EmptyState title="Profiles belong to students" body="Switch to a student account to see a profile." action={<Button href="/login">Switch demo account</Button>} /></PageContainer>;
  return null;
}
