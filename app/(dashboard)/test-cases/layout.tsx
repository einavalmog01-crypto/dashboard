"use client";

import { useState } from "react";
import { Branch } from "./page";
import BranchSidebar from "@/components/test-cases/branch-sidebar";

export default function TestCasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [branches, setBranches] = useState<Branch[]>([
    { id: "1", name: "Wave 11", slug: "wave-11", createdAt: Date.now() - 1000 },
    { id: "2", name: "Wave 10.2", slug: "wave-10-2", createdAt: Date.now() - 2000 },
  ]);

  return (
    <div className="flex h-full">
      <BranchSidebar branches={branches} />
      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  );
}
