"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { nanoid } from "nanoid"

// Types
export type Branch = {
  id: string
  name: string
  slug: string
  createdAt: number
}

export type Folder = {
  id: string
  branchId: string
  name: string  // "US" or "CRs/SRs"
  type: "us" | "crs-srs"
  createdAt: number
}

export type SubItem = {
  id: string
  branchId: string
  folderId: string  // Reference to parent folder
  type: "user-story" | "cr"
  name: string
  description?: string
  createdAt: number
}

export type TestStep = {
  id: string
  stepNumber: number
  description: string
  expectedResult: string
}

export type TestCase = {
  id: string
  subItemId: string
  name: string
  steps: TestStep[]
  status: "pending" | "pass" | "fail"
  comment: string
  attachments: { name: string; url: string }[]
  createdAt: number
}

const STORAGE_KEY = "test-cases-data"

interface TestCasesContextType {
  // Branches
  branches: Branch[]
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
  addBranch: (name: string) => void
  editBranch: (id: string, name: string) => void
  deleteBranch: (id: string) => void
  
  // Folders (auto-created with branches)
  folders: Folder[]
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  editFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  
  // Sub Items (User Stories / CRs)
  subItems: SubItem[]
  selectedSubItemId: string | null
  setSelectedSubItemId: (id: string | null) => void
  addSubItem: (folderId: string, type: "user-story" | "cr", name: string, description?: string) => void
  editSubItem: (id: string, name: string, description?: string) => void
  deleteSubItem: (id: string) => void
  
  // Test Cases
  testCases: TestCase[]
  addTestCase: (subItemId: string, name: string) => void
  editTestCase: (id: string, updates: Partial<Omit<TestCase, "id" | "subItemId" | "createdAt">>) => void
  deleteTestCase: (id: string) => void
  
  // Test Steps
  addTestStep: (testCaseId: string, description: string, expectedResult: string) => void
  editTestStep: (testCaseId: string, stepId: string, description: string, expectedResult: string) => void
  deleteTestStep: (testCaseId: string, stepId: string) => void
}

const TestCasesContext = createContext<TestCasesContextType | undefined>(undefined)

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

// Helper function to load initial data from localStorage
function loadInitialData(): { branches: Branch[]; folders: Folder[]; subItems: SubItem[]; testCases: TestCase[] } {
  if (typeof window === "undefined") {
    return { branches: [], folders: [], subItems: [], testCases: [] }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        branches: data.branches || [],
        folders: data.folders || [],
        subItems: data.subItems || [],
        testCases: data.testCases || [],
      }
    }
  } catch {
    // Use defaults
  }
  return { branches: [], folders: [], subItems: [], testCases: [] }
}

export function TestCasesProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [subItems, setSubItems] = useState<SubItem[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null)

  // Load from localStorage on mount (only once)
  useEffect(() => {
    const data = loadInitialData()
    setBranches(data.branches)
    setFolders(data.folders)
    setSubItems(data.subItems)
    setTestCases(data.testCases)
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever data changes (only after initial hydration)
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branches, folders, subItems, testCases }))
    } catch {
      // Ignore
    }
  }, [branches, folders, subItems, testCases, isHydrated])

  // Branch functions
  const addBranch = (name: string) => {
    const branchId = nanoid()
    const newBranch: Branch = {
      id: branchId,
      name,
      slug: slugify(name),
      createdAt: Date.now(),
    }
    // Auto-create US and CRs/SRs folders
    const usFolder: Folder = {
      id: nanoid(),
      branchId,
      name: "US",
      type: "us",
      createdAt: Date.now(),
    }
    const crsFolder: Folder = {
      id: nanoid(),
      branchId,
      name: "CRs/SRs",
      type: "crs-srs",
      createdAt: Date.now(),
    }
    setBranches(prev => [newBranch, ...prev])
    setFolders(prev => [...prev, usFolder, crsFolder])
  }

  const editBranch = (id: string, name: string) => {
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, name, slug: slugify(name) } : b))
    )
  }

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id))
    // Also delete folders, sub-items and test cases for this branch
    const branchFolders = folders.filter(f => f.branchId === id)
    const folderIds = branchFolders.map(f => f.id)
    const branchSubItems = subItems.filter(s => folderIds.includes(s.folderId))
    const subItemIds = branchSubItems.map(s => s.id)
    setFolders(prev => prev.filter(f => f.branchId !== id))
    setSubItems(prev => prev.filter(s => !folderIds.includes(s.folderId)))
    setTestCases(prev => prev.filter(t => !subItemIds.includes(t.subItemId)))
    if (selectedBranchId === id) {
      setSelectedBranchId(null)
      setSelectedFolderId(null)
      setSelectedSubItemId(null)
    }
  }

  // Folder functions
  const editFolder = (id: string, name: string) => {
    setFolders(prev =>
      prev.map(f => (f.id === id ? { ...f, name } : f))
    )
  }

  const deleteFolder = (id: string) => {
    const folder = folders.find(f => f.id === id)
    if (!folder) return
    // Delete folder, its sub-items, and their test cases
    const folderSubItems = subItems.filter(s => s.folderId === id)
    const subItemIds = folderSubItems.map(s => s.id)
    setFolders(prev => prev.filter(f => f.id !== id))
    setSubItems(prev => prev.filter(s => s.folderId !== id))
    setTestCases(prev => prev.filter(t => !subItemIds.includes(t.subItemId)))
    if (selectedFolderId === id) {
      setSelectedFolderId(null)
      setSelectedSubItemId(null)
    }
  }

  // Sub Item functions
  const addSubItem = (folderId: string, type: "user-story" | "cr", name: string, description?: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    const newSubItem: SubItem = {
      id: nanoid(),
      branchId: folder.branchId,
      folderId,
      type,
      name,
      description,
      createdAt: Date.now(),
    }
    setSubItems(prev => [...prev, newSubItem])
  }

  const editSubItem = (id: string, name: string, description?: string) => {
    setSubItems(prev =>
      prev.map(s => (s.id === id ? { ...s, name, description } : s))
    )
  }

  const deleteSubItem = (id: string) => {
    setSubItems(prev => prev.filter(s => s.id !== id))
    setTestCases(prev => prev.filter(t => t.subItemId !== id))
    if (selectedSubItemId === id) {
      setSelectedSubItemId(null)
    }
  }

  // Test Case functions
  const addTestCase = (subItemId: string, name: string) => {
    const newTestCase: TestCase = {
      id: nanoid(),
      subItemId,
      name,
      steps: [],
      status: "pending",
      comment: "",
      attachments: [],
      createdAt: Date.now(),
    }
    setTestCases(prev => [...prev, newTestCase])
  }

  const editTestCase = (id: string, updates: Partial<Omit<TestCase, "id" | "subItemId" | "createdAt">>) => {
    setTestCases(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTestCase = (id: string) => {
    setTestCases(prev => prev.filter(t => t.id !== id))
  }

  // Test Step functions
  const addTestStep = (testCaseId: string, description: string, expectedResult: string) => {
    setTestCases(prev =>
      prev.map(t => {
        if (t.id !== testCaseId) return t
        const newStep: TestStep = {
          id: nanoid(),
          stepNumber: t.steps.length + 1,
          description,
          expectedResult,
        }
        return { ...t, steps: [...t.steps, newStep] }
      })
    )
  }

  const editTestStep = (testCaseId: string, stepId: string, description: string, expectedResult: string) => {
    setTestCases(prev =>
      prev.map(t => {
        if (t.id !== testCaseId) return t
        return {
          ...t,
          steps: t.steps.map(s =>
            s.id === stepId ? { ...s, description, expectedResult } : s
          ),
        }
      })
    )
  }

  const deleteTestStep = (testCaseId: string, stepId: string) => {
    setTestCases(prev =>
      prev.map(t => {
        if (t.id !== testCaseId) return t
        const filteredSteps = t.steps.filter(s => s.id !== stepId)
        // Re-number steps
        const renumberedSteps = filteredSteps.map((s, idx) => ({
          ...s,
          stepNumber: idx + 1,
        }))
        return { ...t, steps: renumberedSteps }
      })
    )
  }

  return (
    <TestCasesContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        addBranch,
        editBranch,
        deleteBranch,
        folders,
        selectedFolderId,
        setSelectedFolderId,
        editFolder,
        deleteFolder,
        subItems,
        selectedSubItemId,
        setSelectedSubItemId,
        addSubItem,
        editSubItem,
        deleteSubItem,
        testCases,
        addTestCase,
        editTestCase,
        deleteTestCase,
        addTestStep,
        editTestStep,
        deleteTestStep,
      }}
    >
      {children}
    </TestCasesContext.Provider>
  )
}

export function useTestCases() {
  const context = useContext(TestCasesContext)
  if (!context) {
    throw new Error("useTestCases must be used within TestCasesProvider")
  }
  return context
}
