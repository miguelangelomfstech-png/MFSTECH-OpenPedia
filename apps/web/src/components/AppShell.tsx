"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface AppShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  initialIsSocial?: boolean;
}

export function AppShell({ header, footer, children, initialIsSocial = false }: AppShellProps) {
  const pathname = usePathname();
  const isSocial = pathname ? pathname.startsWith("/social") : initialIsSocial;

  if (isSocial) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex-1">
        {header}
        <main id="content" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </div>
      {footer}
    </>
  );
}
