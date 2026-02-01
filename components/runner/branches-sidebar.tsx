"use client"

import { useState, useMemo } from "react"
import { useRunnerBranches, type RunnerBranch, type RunnerFolder, type RunnerItem, type RunnerTestCase } from "@/lib/runner-branches-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MoreVertical, 
  Search, 
  ChevronRight, 
  ChevronDown,
  FileText,
  GitBranch,
  FolderOpen,
  Trash2,
  Pencil,
  X,
  Paperclip,
  Folder
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export function RunnerBranchesSidebar() {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    addBranch,
    editBranch,
    deleteBranch,
    folders,
    selectedFolderId,
    setSelectedFolderId,
    items,
    selectedItemId,
    setSelectedItemId,
    addItem,
    editItem,
    deleteItem,
    testCases,
    addTestCase,
    editTestCase,
    deleteTestCase,
    addTestStep,
    editTestStep,
    deleteTestStep,
  } = useRunnerBranches()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Expanded state
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Dialog states
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<RunnerBranch | null>(null)
  const [branchName, setBranchName] = useState("")

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RunnerItem | null>(null)
  const [addingItemToFolderId, setAddingItemToFolderId] = useState<string | null>(null)
  const [addingItemToBranchId, setAddingItemToBranchId] = useState<string | null>(null)
  const [itemName, setItemName] = useState("")
  const [itemDescription, setItemDescription] = useState("")

  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<RunnerTestCase | null>(null)
  const [testCaseName, setTestCaseName] = useState("")

  const [stepDialogOpen, setStepDialogOpen] = useState(false)
  const [editingStepTestCaseId, setEditingStepTestCaseId] = useState<string | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [stepDescription, setStepDescription] = useState("")
  const [stepExpectedResult, setStepExpectedResult] = useState("")

  // Delete confirmation states
  const [deletingBranch, setDeletingBranch] = useState<RunnerBranch | null>(null)
  const [deletingItem, setDeletingItem] = useState<RunnerItem | null>(null)
  const [deletingTestCase, setDeletingTestCase] = useState<RunnerTestCase | null>(null)

  // Selected data
  const selectedItem = items.find(i => i.id === selectedItemId)
  const selectedFolder = folders.find(f => f.id === selectedFolderId)
  const itemTestCases = useMemo(() =>
    testCases.filter(t => t.itemId === selectedItemId),
    [testCases, selectedItemId]
  )

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery || !selectedFolderId) return items.filter(i => i.folderId === selectedFolderId)
    return items.filter(i => 
      i.folderId === selectedFolderId &&
      (i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [items, selectedFolderId, searchQuery])

  // Toggle functions
  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branchId)) {
        next.delete(branchId)
      } else {
        next.add(branchId)
      }
      return next
    })
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Branch handlers
  const openAddBranchDialog = () => {
    setEditingBranch(null)
    setBranchName("")
    setBranchDialogOpen(true)
  }

  const openEditBranchDialog = (branch: RunnerBranch) => {
    setEditingBranch(branch)
    setBranchName(branch.name)
    setBranchDialogOpen(true)
  }

  const saveBranch = () => {
    if (!branchName.trim()) return
    if (editingBranch) {
      editBranch(editingBranch.id, branchName.trim())
    } else {
      addBranch(branchName.trim())
    }
    setBranchDialogOpen(false)
  }

  // Item handlers
  const openAddItemDialog = (folderId: string, branchId: string) => {
    setEditingItem(null)
    setAddingItemToFolderId(folderId)
    setAddingItemToBranchId(branchId)
    setItemName("")
    setItemDescription("")
    setItemDialogOpen(true)
  }

  const openEditItemDialog = (item: RunnerItem) => {
    setEditingItem(item)
    setAddingItemToFolderId(null)
    setAddingItemToBranchId(null)
    setItemName(item.name)
    setItemDescription(item.description || "")
    setItemDialogOpen(true)
  }

  const saveItem = () => {
    if (!itemName.trim()) return
    if (editingItem) {
      editItem(editingItem.id, itemName.trim(), itemDescription.trim() || undefined)
    } else if (addingItemToFolderId && addingItemToBranchId) {
      addItem(addingItemToFolderId, addingItemToBranchId, itemName.trim(), itemDescription.trim() || undefined)
    }
    setItemDialogOpen(false)
  }

  // Test case handlers
  const openAddTestCaseDialog = () => {
    setEditingTestCase(null)
    setTestCaseName("")
    setTestCaseDialogOpen(true)
  }

  const openEditTestCaseDialog = (tc: RunnerTestCase) => {
    setEditingTestCase(tc)
    setTestCaseName(tc.name)
    setTestCaseDialogOpen(true)
  }

  const saveTestCase = () => {
    if (!testCaseName.trim() || !selectedItemId) return
    if (editingTestCase) {
      editTestCase(editingTestCase.id, { name: testCaseName.trim() })
    } else {
      addTestCase(selectedItemId, testCaseName.trim())
    }
    setTestCaseDialogOpen(false)
  }

  // Step handlers
  const openAddStepDialog = (testCaseId: string) => {
    setEditingStepTestCaseId(testCaseId)
    setEditingStepId(null)
    setStepDescription("")
    setStepExpectedResult("")
    setStepDialogOpen(true)
  }

  const openEditStepDialog = (testCaseId: string, stepId: string, description: string, expectedResult: string) => {
    setEditingStepTestCaseId(testCaseId)
    setEditingStepId(stepId)
    setStepDescription(description)
    setStepExpectedResult(expectedResult)
    setStepDialogOpen(true)
  }

  const saveStep = () => {
    if (!stepDescription.trim() || !editingStepTestCaseId) return
    if (editingStepId) {
      editTestStep(editingStepTestCaseId, editingStepId, stepDescription.trim(), stepExpectedResult.trim())
    } else {
      addTestStep(editingStepTestCaseId, stepDescription.trim(), stepExpectedResult.trim())
    }
    setStepDialogOpen(false)
  }

  // Attachment handlers
  const handleAttachment = (testCaseId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const tc = testCases.find(t => t.id === testCaseId)
      if (tc) {
        editTestCase(testCaseId, {
          attachments: [...tc.attachments, { name: file.name, url: dataUrl }]
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const removeAttachment = (testCaseId: string, idx: number) => {
    const tc = testCases.find(t => t.id === testCaseId)
    if (tc) {
      editTestCase(testCaseId, {
        attachments: tc.attachments.filter((_, i) => i !== idx)
      })
    }
  }

  return (
    <>
      <div className="flex h-full">
        {/* Left Sidebar - Branches Bar */}
        <aside className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Branches</h2>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={openAddBranchDialog}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {branches.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No branches yet. Add one to get started.</p>
            ) : (
              <div className="space-y-1">
                {branches.sort((a, b) => b.createdAt - a.createdAt).map(branch => {
                  const isExpanded = expandedBranches.has(branch.id)
                  const isSelected = selectedBranchId === branch.id
                  const branchFolders = folders.filter(f => f.branchId === branch.id)

                  return (
                    <div key={branch.id}>
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                          isSelected && !selectedFolderId ? "bg-primary/10" : "hover:bg-accent"
                        )}
                      >
                        <button
                          onClick={() => toggleBranch(branch.id)}
                          className="p-0.5 hover:bg-accent rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className="flex-1 text-sm truncate"
                          onClick={() => {
                            setSelectedBranchId(branch.id)
                            setSelectedFolderId(null)
                            setSelectedItemId(null)
                            if (!isExpanded) toggleBranch(branch.id)
                          }}
                        >
                          {branch.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditBranchDialog(branch)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingBranch(branch)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Folders under branch */}
                      {isExpanded && (
                        <div className="ml-5 mt-1 space-y-0.5">
                          {branchFolders.map(folder => {
                            const isFolderExpanded = expandedFolders.has(folder.id)
                            const isFolderSelected = selectedFolderId === folder.id
                            const folderItems = items.filter(i => i.folderId === folder.id)

                            return (
                              <div key={folder.id}>
                                <div
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer group",
                                    isFolderSelected && !selectedItemId ? "bg-primary/10" : "hover:bg-accent"
                                  )}
                                >
                                  <button
                                    onClick={() => toggleFolder(folder.id)}
                                    className="p-0.5 hover:bg-accent rounded"
                                  >
                                    {isFolderExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </button>
                                  <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span
                                    className="flex-1 text-xs truncate"
                                    onClick={() => {
                                      setSelectedBranchId(branch.id)
                                      setSelectedFolderId(folder.id)
                                      setSelectedItemId(null)
                                      if (!isFolderExpanded) toggleFolder(folder.id)
                                    }}
                                  >
                                    {folder.name}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {folderItems.length}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openAddItemDialog(folder.id, branch.id)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add {folder.type === "cr-sr" ? "CR/SR" : "User Story"}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Items under folder */}
                                {isFolderExpanded && (
                                  <div className="ml-5 mt-0.5 space-y-0.5">
                                    {folderItems.length === 0 ? (
                                      <p className="text-[10px] text-muted-foreground pl-2 py-1">No items</p>
                                    ) : (
                                      folderItems.map(item => (
                                        <div
                                          key={item.id}
                                          className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer group",
                                            selectedItemId === item.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                          )}
                                          onClick={() => {
                                            setSelectedBranchId(branch.id)
                                            setSelectedFolderId(folder.id)
                                            setSelectedItemId(item.id)
                                          }}
                                        >
                                          <FileText className="h-3 w-3" />
                                          <span className="flex-1 text-xs truncate">{item.name}</span>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                  "h-4 w-4 opacity-0 group-hover:opacity-100",
                                                  selectedItemId === item.id && "text-primary-foreground"
                                                )}
                                              >
                                                <MoreVertical className="h-2.5 w-2.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => openEditItemDialog(item)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeletingItem(item)}
                                              >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area - Test Cases View */}
        {selectedItemId && (
          <div className="flex-1 flex flex-col overflow-hidden border-l">
            <div className="p-3 border-b flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItemId(null)}>
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{selectedItem?.name}</span>
                </div>
                {selectedItem?.description && (
                  <p className="text-xs text-muted-foreground">{selectedItem.description}</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Test Cases</h3>
                <Button size="sm" onClick={openAddTestCaseDialog}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Test Case
                </Button>
              </div>

              {itemTestCases.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No test cases yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemTestCases.map(tc => (
                    <div key={tc.id} className="border rounded-lg">
                      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{tc.name}</span>
                          <Badge
                            variant={
                              tc.status === "pass" ? "default" :
                              tc.status === "fail" ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {tc.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => openEditTestCaseDialog(tc)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive"
                            onClick={() => setDeletingTestCase(tc)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 space-y-3">
                        {/* Steps */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Steps</span>
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => openAddStepDialog(tc.id)}>
                              <Plus className="mr-1 h-2.5 w-2.5" />
                              Add Step
                            </Button>
                          </div>
                          {tc.steps.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No steps defined</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-10 text-xs">#</TableHead>
                                  <TableHead className="text-xs">Description</TableHead>
                                  <TableHead className="text-xs">Expected</TableHead>
                                  <TableHead className="w-16 text-xs">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tc.steps.map(step => (
                                  <TableRow key={step.id}>
                                    <TableCell className="text-xs">{step.stepNumber}</TableCell>
                                    <TableCell className="text-xs">{step.description}</TableCell>
                                    <TableCell className="text-xs">{step.expectedResult}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => openEditStepDialog(tc.id, step.id, step.description, step.expectedResult)}
                                        >
                                          <Pencil className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={() => deleteTestStep(tc.id, step.id)}
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span className="text-xs font-medium">Status</span>
                          <Select
                            value={tc.status}
                            onValueChange={(value: "pending" | "pass" | "fail") => 
                              editTestCase(tc.id, { status: value })
                            }
                          >
                            <SelectTrigger className="w-32 h-7 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="pass">Pass</SelectItem>
                              <SelectItem value="fail">Fail</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Attachments */}
                        <div>
                          <span className="text-xs font-medium">Evidence Attachments</span>
                          <div className="flex flex-wrap gap-1 mt-1 mb-2">
                            {tc.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                                <Paperclip className="h-2.5 w-2.5" />
                                <a href={att.url} download={att.name} className="text-blue-600 hover:underline">
                                  {att.name}
                                </a>
                                <button onClick={() => removeAttachment(tc.id, idx)} className="text-muted-foreground hover:text-destructive">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <Input
                            type="file"
                            className="h-7 text-xs"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleAttachment(tc.id, file)
                                e.target.value = ""
                              }
                            }}
                          />
                        </div>

                        {/* Comment */}
                        <div>
                          <span className="text-xs font-medium">Comment</span>
                          <Textarea
                            placeholder="Add a comment..."
                            value={tc.comment}
                            onChange={e => editTestCase(tc.id, { comment: e.target.value })}
                            rows={2}
                            className="mt-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Branch name (e.g. Wave 12)"
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveBranch} disabled={!branchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : `Add ${addingItemToFolderId && folders.find(f => f.id === addingItemToFolderId)?.type === "cr-sr" ? "CR/SR" : "User Story"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name (e.g. US-12345 or CR-67890)"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button onClick={saveItem} disabled={!itemName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Case Dialog */}
      <Dialog open={testCaseDialogOpen} onOpenChange={setTestCaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTestCase ? "Edit Test Case" : "Add Test Case"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Test case name"
            value={testCaseName}
            onChange={e => setTestCaseName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveTestCase} disabled={!testCaseName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStepId ? "Edit Step" : "Add Step"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Step description"
                value={stepDescription}
                onChange={e => setStepDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expected Result</label>
              <Textarea
                placeholder="Expected result"
                value={stepExpectedResult}
                onChange={e => setStepExpectedResult(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveStep} disabled={!stepDescription.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation */}
      <AlertDialog open={!!deletingBranch} onOpenChange={() => setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBranch?.name}"? This will also delete all folders, items, and test cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBranch) deleteBranch(deletingBranch.id)
                setDeletingBranch(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This will also delete all test cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingItem) deleteItem(deletingItem.id)
                setDeletingItem(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Test Case Confirmation */}
      <AlertDialog open={!!deletingTestCase} onOpenChange={() => setDeletingTestCase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTestCase?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTestCase) deleteTestCase(deletingTestCase.id)
                setDeletingTestCase(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
