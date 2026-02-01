"use client";

import { useState } from "react"; // ✅ only one useState import
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BranchDialog from "@/components/test-cases/branch-dialog";
import DeleteBranchDialog from "@/components/test-cases/delete-branch-dialog";

// ✅ Updated Branch type with createdAt
export type Branch = {
  id: string;
  name: string;
  slug: string;
  createdAt: number; // for newest-first sorting
};

// ✅ Initial branches include createdAt
const initialBranches: Branch[] = [
  { id: "1", name: "Wave 11", slug: "wave-11", createdAt: Date.now() - 1000 },
  { id: "2", name: "Wave 10.2", slug: "wave-10-2", createdAt: Date.now() - 2000 },
];

export default function TestCasesPage() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ✅ Add or edit a branch
  function upsertBranch(branch: Branch) {
    setBranches((prev) => {
      const exists = prev.find((b) => b.id === branch.id);
      if (exists) {
        return prev.map((b) => (b.id === branch.id ? branch : b));
      }
      return [...prev, branch];
    });
  }

  // ✅ Delete a branch
  function deleteBranch(id: string) {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  }

  // ✅ Sort branches newest first before rendering
  const sortedBranches = [...branches].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      <div className="space-y-2">
        {sortedBranches.map((branch) => (
          <div
            key={branch.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <Link
              href={`/test-cases/${branch.slug}`}
              className="font-medium hover:underline"
            >
              {branch.name}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingBranch(branch);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeletingBranch(branch)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <BranchDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBranch(null);
        }}
        branch={editingBranch}
        onSave={(branch) =>
          upsertBranch({ ...branch, createdAt: branch.createdAt ?? Date.now() })
        }
      />

      <DeleteBranchDialog
        branch={deletingBranch}
        onCancel={() => setDeletingBranch(null)}
        onConfirm={() => {
          if (deletingBranch) deleteBranch(deletingBranch.id);
          setDeletingBranch(null);
        }}
      />
    </div>
  );
}
