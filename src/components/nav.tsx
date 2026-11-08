"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/store";
import { useQuery } from "@/hooks/use-query";
import { messages, notifications } from "@/services";
import { Avatar, Button, cx } from "@/components/ui";
import { PageTransition, SharedNavIndicator } from "@/components/motion";
import { HOME, useMe, type Kind } from "@/components/use-me";
import { t } from "@/lib/motion";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 flex-none" aria-label="Launchpad home">
      <Image src="/Launchpad_logo.png" alt="" width={40} height={37} priority className="h-9 w-auto" />
      <span className="text-xl font-semibold tracking-[-0.02em] text-ink">Launchpad</span>
    </Link>
  );
}

const LINK = "text-sm font-medium text-body! hover:text-ink! min-h-10 inline-flex items-center px-3";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-line">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden md:flex gap-2">
          <Link href="/projects" className={LINK}>Projects</Link>
          <Link href="/certifications" className={LINK}>Certifications</Link>
          <Link href="/impact" className={LINK}>Impact</Link>
        </nav>
        <div className="flex items-center gap-2 flex-none">
          <Link href="/login" className={LINK}>Sign in</Link>
          <Button href="/onboarding/student">Get started</Button>
        </div>
      </div>
    </header>
  );
}

const NAV: Record<Kind, { label: string; href: string }[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/projects" },
    { label: "Workspace", href: "/workspace" },
    { label: "Certifications", href: "/certifications" },
    { label: "Messages", href: "/messages" },
  ],
  founder: [
    { label: "Dashboard", href: "/founder" },
    { label: "Projects", href: "/business" },
    { label: "Approvals", href: "/business/approvals" },
    { label: "Messages", href: "/messages" },
    { label: "Impact", href: "/impact" },
  ],
};

function BellLink({ userId }: { userId: string }) {
  const { data } = useQuery(`bell:${userId}`, () => notifications.list());
  const unread = data?.filter((n) => !n.read).length ?? 0;
  return (
    <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative w-10 h-10 grid place-items-center rounded-control border border-line text-ink! hover:bg-surface transition-colors">
      <Bell size={16} aria-hidden />
      {unread > 0 && (
        <motion.span key={unread} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={t.ui} data-testid="unread-count" className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-brand text-white text-[10px] font-semibold grid place-items-center">
          {unread}
        </motion.span>
      )}
    </Link>
  );
}


export function AppNav() {
  const path = usePathname();
  const router = useRouter();
  const { user, kind } = useMe();
  const { data: unreadMsgs } = useQuery(user ? `msgs:${user.session.userId}` : null, () => messages.unreadCount());
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = NAV[kind ?? "student"];

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => (document.removeEventListener("mousedown", close), document.removeEventListener("keydown", esc));
  }, [menu]);

  const active = (href: string) => path === href || (href !== "/business" && href !== "/founder" && path.startsWith(`${href}/`)) || (href === "/business" && (path.startsWith("/business/projects") || path === "/business/new"));

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-line">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 min-h-16 flex items-center justify-between gap-4 flex-wrap py-2">
        <div className="flex items-center gap-6 flex-wrap">
          <Logo href={HOME[kind ?? "student"]} />
          <nav aria-label="Primary" className="flex gap-1 flex-wrap">
            {items.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cx("relative isolate text-sm font-medium px-3 min-h-10 inline-flex items-center rounded-control whitespace-nowrap", active(n.href) ? "text-ink!" : "text-body! hover:text-ink!")}>
                {active(n.href) && <SharedNavIndicator />}
                {n.label}
                {n.label === "Messages" && (unreadMsgs ?? 0) > 0 && <span className="ml-1.5 min-w-4 h-4 px-1 rounded-full bg-brand text-white text-[10px] font-bold inline-grid place-items-center">{unreadMsgs}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && <BellLink userId={user.session.userId} />}
          <div className="relative" ref={menuRef}>
            <button type="button" aria-haspopup="menu" aria-expanded={menu} aria-label={`Account menu for ${user?.displayName ?? "current user"}`} onClick={() => setMenu((m) => !m)} className="cursor-pointer rounded-control" data-testid="avatar">
              <Avatar name={user?.displayName ?? ""} size={40} />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: t.hover }} exit={{ opacity: 0, transition: t.hover }} className="absolute right-0 mt-2 w-60 bg-white border border-line rounded-card shadow-float p-2 text-sm z-30">
                  <div className="px-3 py-2 text-xs">
                    Signed in as<div className="text-ink font-semibold text-sm">{user?.displayName}</div>
                  </div>
                  {user?.student && <Link role="menuitem" href={`/u/${user.student.slug}`} onClick={() => setMenu(false)} className="flex items-center min-h-10 px-3 rounded-control text-ink! hover:bg-surface">Public profile</Link>}
                  <Link role="menuitem" href="/login" onClick={() => setMenu(false)} className="flex items-center min-h-10 px-3 rounded-control text-ink! hover:bg-surface">Switch demo role</Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      useApp.getState().signOut();
                      setMenu(false);
                      router.push("/");
                    }}
                    className="w-full text-left flex items-center min-h-10 px-3 rounded-control text-ink hover:bg-surface cursor-pointer"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
      <main id="main" tabIndex={-1} className="outline-none min-h-[60vh]">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("max-w-[1200px] mx-auto px-6 md:px-8 pt-8 pb-16", className)}>{children}</div>;
}
