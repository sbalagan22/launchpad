"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { useApp } from "@/store";
import { useQuery, useSession } from "@/hooks/use-query";
import { misc } from "@/services";
import { Button, cx } from "@/components/ui";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 flex-none" aria-label="Launchpad home">
      <Image src="/logo.png" alt="" width={43} height={40} priority className="h-10 w-auto" />
      <span className="text-xl font-semibold tracking-[-0.02em] text-ink">Launchpad</span>
    </Link>
  );
}

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-line">
      <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden sm:flex gap-8 text-sm font-medium">
          <Link href="/onboarding/student" className="text-body! hover:text-ink!">For students</Link>
          <Link href="/business/new" className="text-body! hover:text-ink!">For businesses</Link>
          <a href="#how" className="text-body! hover:text-ink!">How it works</a>
          <Link href="/impact" className="text-body! hover:text-ink!">Impact</Link>
        </nav>
        <div className="flex items-center gap-6 flex-none">
          <Link href="/login" className="text-sm font-medium text-body! hover:text-ink!">Log in</Link>
          <Button href="/onboarding/student">Get started</Button>
        </div>
      </div>
    </header>
  );
}

const STUDENT_NAV = [
  { label: "Projects", href: "/projects" },
  { label: "Workspace", href: "/workspace" },
  { label: "Skills", href: "/skills" },
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/profile" },
  { label: "Impact", href: "/impact" },
];
const BUSINESS_NAV = [
  { label: "Dashboard", href: "/business" },
  { label: "New project", href: "/business/new" },
  { label: "Messages", href: "/messages" },
  { label: "Impact", href: "/impact" },
];

function BellLink({ userId }: { userId: string }) {
  const { data } = useQuery(`bell:${userId}`, () => misc.listNotifications(userId));
  const unread = data?.filter((n) => !n.read).length ?? 0;
  return (
    <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative w-8 h-8 grid place-items-center rounded-control border border-line text-ink! hover:bg-surface">
      <Bell size={16} aria-hidden />
      {unread > 0 && (
        <span data-testid="unread-count" className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-brand text-white text-[10px] font-semibold grid place-items-center">
          {unread}
        </span>
      )}
    </Link>
  );
}

export function AppNav() {
  const path = usePathname();
  const router = useRouter();
  const { role, userId, hydrated } = useSession();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = role === "business" ? BUSINESS_NAV : STUDENT_NAV;
  const { data: me } = useQuery(hydrated ? `me:${role}:${userId}` : null, () => misc.whoAmI(role, userId));
  const initials = (me?.name ?? "").split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => (document.removeEventListener("mousedown", close), document.removeEventListener("keydown", esc));
  }, [menu]);

  const active = (href: string) => (href === "/business" ? path === "/business" || path.startsWith("/business/projects") : path === href || path.startsWith(`${href}/`) || (href === "/projects" && false));
  const switchTo = (r: "student" | "business") => {
    misc.switchDemoMode(r);
    router.push(r === "student" ? "/projects" : "/business");
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-line">
      <div className="max-w-[1200px] mx-auto px-8 min-h-16 flex items-center justify-between gap-4 flex-wrap py-2">
        <div className="flex items-center gap-8 flex-wrap">
          <Logo href={role === "business" ? "/business" : "/projects"} />
          <nav aria-label="Primary" className="flex gap-2 flex-wrap">
            {items.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cx("text-sm font-medium px-2 py-1 rounded-control whitespace-nowrap", active(n.href) ? "text-ink! bg-surface" : "text-body! hover:text-ink!")}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div role="group" aria-label="Demo mode" className="flex border border-line rounded-control p-0.5 text-xs font-semibold">
            {(["student", "business"] as const).map((r) => (
              <button key={r} type="button" aria-pressed={role === r} onClick={() => switchTo(r)} className={cx("cursor-pointer px-2 py-1 rounded-md transition-colors", role === r ? "bg-surface text-ink" : "text-body hover:text-ink")}>
                {r === "student" ? "Student view" : "Business view"}
              </button>
            ))}
          </div>
          {hydrated && <BellLink userId={userId} />}
          <div className="relative" ref={menuRef}>
            <button type="button" aria-haspopup="menu" aria-expanded={menu} aria-label={`Account menu for ${me?.name ?? "current user"}`} onClick={() => setMenu((m) => !m)} className="w-8 h-8 rounded-control border border-line bg-surface text-ink grid place-items-center font-semibold text-xs cursor-pointer" data-testid="avatar">
              {initials || " "}
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-line rounded-card shadow-float p-2 text-sm z-30">
                <div className="px-3 py-2 text-xs">Signed in as<div className="text-ink font-semibold text-sm">{me?.name}</div></div>
                {role === "student" && me?.slug && <Link role="menuitem" href={`/u/${me.slug}`} onClick={() => setMenu(false)} className="block px-3 py-2 rounded-control text-ink! hover:bg-surface">Public profile</Link>}
                <button role="menuitem" type="button" onClick={() => { useApp.getState().signOut(); setMenu(false); router.push("/"); }} className="w-full text-left px-3 py-2 rounded-control text-ink hover:bg-surface cursor-pointer">Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const bare = path === "/login" || path.startsWith("/onboarding");
  return (
    <>
      {path === "/" ? <LandingNav /> : bare ? null : <AppNav />}
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("max-w-[1200px] mx-auto px-8 pt-8 pb-24", className)}>{children}</div>;
}
