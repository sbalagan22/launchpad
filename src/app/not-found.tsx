import { EmptyState, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="max-w-[720px] mx-auto px-8 py-24">
      <EmptyState title="We could not find that page" body="The link may be old, or the item was removed." action={<Button href="/projects">Back to projects</Button>} />
    </div>
  );
}
