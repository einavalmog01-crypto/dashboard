"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { nanoid } from "nanoid"

// Types
export type RunnerBranch = {
  id: string
  name: string
  createdAt: number
}

// A folder is always either "CRs/SRs" or "US" - automatically created with each branch
export type RunnerFolder = {
  id: string
  branchId: string
  type: "cr-sr" | "us"
  name: string // "CRs/SRs" or "US"
}

// Items within folders (the actual CR/SR or US entries)
export type RunnerItem = {
  id: string
  folderId: string
  branchId: string
  name: string
  description?: string
  createdAt: number
}

export type RunnerTestStep = {
  id: string
  stepNumber: number
  description: string
  expectedResult: string
}

export type RunnerTestCase = {
  id: string
  itemId: string
  name: string
  steps: RunnerTestStep[]
  status: "pending" | "pass" | "fail"
  comment: string
  attachments: { name: string; url: string }[]
  createdAt: number
}

const STORAGE_KEY = "runner-branches-data"

interface RunnerBranchesContextType {
  // Branches
  branches: RunnerBranch[]
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
  addBranch: (name: string) => void
  editBranch: (id: string, name: string) => void
  deleteBranch: (id: string) => void
  
  // Folders (auto-created with branches)
  folders: RunnerFolder[]
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  
  // Items (within folders)
  items: RunnerItem[]
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
  addItem: (folderId: string, branchId: string, name: string, description?: string) => void
  editItem: (id: string, name: string, description?: string) => void
  deleteItem: (id: string) => void
  
  // Test Cases
  testCases: RunnerTestCase[]
  addTestCase: (itemId: string, name: string) => void
  editTestCase: (id: string, updates: Partial<Omit<RunnerTestCase, "id" | "itemId" | "createdAt">>) => void
  deleteTestCase: (id: string) => void
  
  // Test Steps
  addTestStep: (testCaseId: string, description: string, expectedResult: string) => void
  editTestStep: (testCaseId: string, stepId: string, description: string, expectedResult: string) => void
  deleteTestStep: (testCaseId: string, stepId: string) => void
}

const RunnerBranchesContext = createContext<RunnerBranchesContextType | undefined>(undefined)

function loadInitialData(): { 
  branches: RunnerBranch[]
  folders: RunnerFolder[]
  items: RunnerItem[]
  testCases: RunnerTestCase[] 
} {
  if (typeof window === "undefined") {
    return { branches: [], folders: [], items: [], testCases: [] }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        branches: data.branches || [],
        folders: data.folders || [],
        items: data.items || [],
        testCases: data.testCases || [],
      }
    }
  } catch {
    // Use defaults
  }
  return { branches: [], folders: [], items: [], testCases: [] }
}

export function RunnerBranchesProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [branches, setBranches] = useState<RunnerBranch[]>([])
  const [folders, setFolders] = useState<RunnerFolder[]>([])
  const [items, setItems] = useState<RunnerItem[]>([])
  const [testCases, setTestCases] = useState<RunnerTestCase[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadInitialData()
    setBranches(data.branches)
    setFolders(data.folders)
    setItems(data.items)
    setTestCases(data.testCases)
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branches, folders, items, testCases }))
    } catch {
      // Ignore
    }
  }, [branches, folders, items, testCases, isHydrated])

  // Branch functions
  const addBranch = (name: string) => {
    const branchId = nanoid()
    const newBranch: RunnerBranch = {
      id: branchId,
      name,
      createdAt: Date.now(),
    }
    
    // Auto-create the two folders
    const crSrFolder: RunnerFolder = {
      id: nanoid(),
      branchId,
      type: "cr-sr",
      name: "CRs/SRs",
    }
    const usFolder: RunnerFolder = {
      id: nanoid(),
      branchId,
      type: "us",
      name: "US",
    }
    
    setBranches(prev => [newBranch, ...prev])
    setFolders(prev => [...prev, crSrFolder, usFolder])
  }

  const editBranch = (id: string, name: string) => {
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, name } : b))
    )
  }

  const deleteBranch = (id: string) => {
    // Get folders for this branch
    const branchFolders = folders.filter(f => f.branchId === id)
    const folderIds = branchFolders.map(f => f.id)
    
    // Get items for these folders
    const folderItems = items.filter(i => folderIds.includes(i.folderId))
    const itemIds = folderItems.map(i => i.id)
    
    setBranches(prev => prev.filter(b => b.id !== id))
    setFolders(prev => prev.filter(f => f.branchId !== id))
    setItems(prev => prev.filter(i => !folderIds.includes(i.folderId)))
    setTestCases(prev => prev.filter(t => !itemIds.includes(t.itemId)))
    
    if (selectedBranchId === id) {
      setSelectedBranchId(null)
      setSelectedFolderId(null)
      setSelectedItemId(null)
    }
  }

  // Item functions
  const addItem = (folderId: string, branchId: string, name: string, description?: string) => {
    const newItem: RunnerItem = {
      id: nanoid(),
      folderId,
      branchId,
      name,
      description,
      createdAt: Date.now(),
    }
    setItems(prev => [...prev, newItem])
  }

  const editItem = (id: string, name: string, description?: string) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, name, description } : i))
    )
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setTestCases(prev => prev.filter(t => t.itemId !== id))
    if (selectedItemId === id) {
      setSelectedItemId(null)
    }
  }

  // Test Case functions
  const addTestCase = (itemId: string, name: string) => {
    const newTestCase: RunnerTestCase = {
      id: nanoid(),
      itemId,
      name,
      steps: [],
      status: "pending",
      comment: "",
      attachments: [],
      createdAt: Date.now(),
    }
    setTestCases(prev => [...prev, newTestCase])
  }

  const editTestCase = (id: string, updates: Partial<Omit<RunnerTestCase, "id" | "itemId" | "createdAt">>) => {
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
        const newStep: RunnerTestStep = {
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
        const renumberedSteps = filteredSteps.map((s, idx) => ({
          ...s,
          stepNumber: idx + 1,
        }))
        return { ...t, steps: renumberedSteps }
      })
    )
  }

  return (
    <RunnerBranchesContext.Provider
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
      }}
    >
      {children}
    </RunnerBranchesContext.Provider>
  )
}

export function useRunnerBranches() {
  const context = useContext(RunnerBranchesContext)
  if (!context) {
    throw new Error("useRunnerBranches must be used within RunnerBranchesProvider")
  }
  return context
}
