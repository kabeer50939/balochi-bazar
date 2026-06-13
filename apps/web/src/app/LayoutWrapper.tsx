'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({
  children,
  header,
  footer
}: {
  children: any;
  header: any;
  footer: any;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main style={{ minHeight: 'calc(100vh - 400px)' }}>
        {children}
      </main>
      {footer}
    </>
  );
}
