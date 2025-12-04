"use client";

import AppLayout from "@/components/layout/AppLayout";
import { MENUS } from "@/menus/menus";

export default function ComercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout sectionTitle="COMERCIAL" items={MENUS.comercial}>
      {children}
    </AppLayout>
  );
}
