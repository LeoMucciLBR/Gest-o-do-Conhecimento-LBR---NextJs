"use client";

import AppLayout from "@/components/layout/AppLayout";
import { MENUS } from "@/menus/menus";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout sectionTitle="FINANCEIRO" items={MENUS.financeiro}>
      {children}
    </AppLayout>
  );
}
