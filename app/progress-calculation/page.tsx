"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { UserStory, STATUSES, StoryModal } from "./modal-helpers"
import { useEnvironment } from "@/lib/environment-context" // <-- NEW

export default function ProgressCalculationPage() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [search, setSearch] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("")
  const [editingStory, setEditingStory] = useState<UserStory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [backendOutput, setBackendOutput] = useState<string | null>(null) // NEW

  const { selectedEnv } = useEnvironment() // <-- NEW

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (saved) setStories(JSON.parse(saved))
  }, [])

  const assignees = Array.from(new Set(stories.map(s => s.assignee).filter(Boolean)))

  function saveStory(story: UserStory) {
    const updated = stories.some(s => s.id === story.id)
      ? stories.map(s => (s.id === story.id ? story : s))
      : [story, ...stories]

    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
    setIsModalOpen(false)
    setEditingStory(null)
  }

  // NEW: Function to run backend test with selected env
  async function runTest() {
    try {
      const res = await fetch("/api/run/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-env": selectedEnv, // send current environment
        },
      })
      const data = await res.json()
      console.log("Backend response:", data)
      setBackendOutput(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error("Backend test failed", err)
      setBackendOutput("Error calling backend")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Progress Calculation</h1>
        {/* NEW: Run test button */}
        <Button onClick={runTest}>Run Test on Backend</Button>
      </div>

      {/* Show backend output */}
      {backendOutput && (
        <pre className="bg-gray-100 p-2 rounded text-sm">{backendOutput}</pre>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-2 py-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <Button onClick={() => setIsModalOpen(true)}>Create</Button>

        {assignees.map(a => (
          <button
            key={a}
            onClick={() => setFilterAssignee(a)}
            className="px-2 py-1 border rounded text-sm"
          >
            {a}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4">
        {STATUSES.map(status => {
          const filteredStories = stories
            .filter(s => s.status === status)
            .filter(s => !filterAssignee || s.assignee === filterAssignee)
            .filter(s => s.summary.toLowerCase().includes(search.toLowerCase()))

          return (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-sm">{status}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredStories.map(story => (
                  <div
                    key={story.id}
                    className="cursor-pointer rounded border bg-white p-2 text-sm text-black hover:bg-gray-100"
                  >
                    {story.summary}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isModalOpen && (
        <StoryModal
          story={editingStory}
          onClose={() => {
            setIsModalOpen(false)
            setEditingStory(null)
          }}
          onSave={saveStory}
        />
      )}
    </div>
  )
}
