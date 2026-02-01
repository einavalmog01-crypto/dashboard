"use client"

import { useEffect, useState, DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { UserStory, Status, KANBAN_COLUMNS, STATUS_COLORS, StoryModal } from "./modal-helpers"

export default function ProgressCalculationPage() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [search, setSearch] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("")
  const [editingStory, setEditingStory] = useState<UserStory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (saved) setStories(JSON.parse(saved))
  }, [])

  const assignees = Array.from(new Set(stories.map(s => s.assignee).filter(Boolean)))

  function saveStory(story: UserStory) {
    // If status is CANCELLED, it will show in DONE column
    const updated = stories.some(s => s.id === story.id)
      ? stories.map(s => (s.id === story.id ? { ...story, updatedAt: new Date().toISOString() } : s))
      : [{ ...story, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...stories]

    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
    setIsModalOpen(false)
    setEditingStory(null)
  }

  function updateStoryStatus(storyId: string, newStatus: Status) {
    const updated = stories.map(s => 
      s.id === storyId 
        ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } 
        : s
    )
    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
  }

  function openEditModal(story: UserStory) {
    setEditingStory(story)
    setIsModalOpen(true)
  }

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent<HTMLDivElement>, storyId: string) {
    setDraggedStoryId(storyId)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragEnd() {
    setDraggedStoryId(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, column: Status) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(column)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, targetColumn: Status) {
    e.preventDefault()
    if (draggedStoryId) {
      updateStoryStatus(draggedStoryId, targetColumn)
    }
    setDraggedStoryId(null)
    setDragOverColumn(null)
  }

  // Get stories for a column (DONE column includes CANCELLED)
  function getStoriesForColumn(column: Status) {
    return stories
      .filter(s => {
        if (column === "DONE") {
          return s.status === "DONE" || s.status === "CANCELLED"
        }
        return s.status === column
      })
      .filter(s => !filterAssignee || s.assignee === filterAssignee)
      .filter(s => s.summary.toLowerCase().includes(search.toLowerCase()))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Progress Calculation</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-2 py-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <Button onClick={() => { setEditingStory(null); setIsModalOpen(true) }}>Create</Button>

        {filterAssignee && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilterAssignee("")}
          >
            Clear Filter
          </Button>
        )}

        {assignees.map(a => (
          <button
            key={a}
            onClick={() => setFilterAssignee(filterAssignee === a ? "" : a)}
            className={`px-2 py-1 border rounded text-sm ${filterAssignee === a ? "bg-blue-500 text-white" : ""}`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map(column => {
          const columnStories = getStoriesForColumn(column)
          const isDropTarget = dragOverColumn === column

          return (
            <Card 
              key={column}
              className={`min-h-[300px] transition-colors ${isDropTarget ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex justify-between items-center">
                  <span>{column}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {columnStories.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {columnStories.map(story => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, story.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openEditModal(story)}
                    className={`cursor-pointer rounded border p-2 text-sm hover:shadow-md transition-shadow ${
                      STATUS_COLORS[story.status]
                    } ${draggedStoryId === story.id ? "opacity-50" : ""}`}
                  >
                    <div className="font-medium">{story.summary}</div>
                    {story.assignee && (
                      <div className="text-xs mt-1 opacity-70">{story.assignee}</div>
                    )}
                    {story.status === "CANCELLED" && (
                      <div className="text-xs mt-1 font-semibold">CANCELLED</div>
                    )}
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
