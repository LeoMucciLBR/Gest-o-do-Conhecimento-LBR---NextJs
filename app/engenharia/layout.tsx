"use client";

import AppLayout from "@/components/layout/AppLayout";
import { MENUS } from "@/menus/menus";

export default function EngenhariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout sectionTitle="ENGENHARIA" items={MENUS.engenharia}>
      {children}
    </AppLayout>
  );
}
