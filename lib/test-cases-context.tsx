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

export type SubItem = {
  id: string
  branchId: string
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
  
  // Sub Items (User Stories / CRs)
  subItems: SubItem[]
  selectedSubItemId: string | null
  setSelectedSubItemId: (id: string | null) => void
  addSubItem: (branchId: string, type: "user-story" | "cr", name: string, description?: string) => void
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

export function TestCasesProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [subItems, setSubItems] = useState<SubItem[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        setBranches(data.branches || [])
        setSubItems(data.subItems || [])
        setTestCases(data.testCases || [])
      }
    } catch {
      // Use defaults
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branches, subItems, testCases }))
    } catch {
      // Ignore
    }
  }, [branches, subItems, testCases])

  // Branch functions
  const addBranch = (name: string) => {
    const newBranch: Branch = {
      id: nanoid(),
      name,
      slug: slugify(name),
      createdAt: Date.now(),
    }
    setBranches(prev => [newBranch, ...prev])
  }

  const editBranch = (id: string, name: string) => {
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, name, slug: slugify(name) } : b))
    )
  }

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id))
    // Also delete sub-items and test cases for this branch
    const branchSubItems = subItems.filter(s => s.branchId === id)
    const subItemIds = branchSubItems.map(s => s.id)
    setSubItems(prev => prev.filter(s => s.branchId !== id))
    setTestCases(prev => prev.filter(t => !subItemIds.includes(t.subItemId)))
    if (selectedBranchId === id) {
      setSelectedBranchId(null)
      setSelectedSubItemId(null)
    }
  }

  // Sub Item functions
  const addSubItem = (branchId: string, type: "user-story" | "cr", name: string, description?: string) => {
    const newSubItem: SubItem = {
      id: nanoid(),
      branchId,
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
