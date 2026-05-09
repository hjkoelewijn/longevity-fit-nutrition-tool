"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/weekplan", label: "Weekmenu" },
  { href: "/inspiratie", label: "Inspiratie" },
  { href: "/richtlijnen", label: "Richtlijnen" },
  { href: "/kennisbank", label: "Kennisbank" },
  { href: "/over#visie", label: "Over" },
  { href: "/profile", label: "Profiel" },
];

export function AppTopNav() {
  const pathname = usePathname();
  const hideOnAuthOrOnboarding =
    pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  if (hideOnAuthOrOnboarding) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#FAF7F2]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="inline-flex w-fit">
          <Image
            src="/branding/longevity-fit-zwart-goud.png"
            alt="Longevity Fit"
            width={280}
            height={33}
            priority
          />
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-800 underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

