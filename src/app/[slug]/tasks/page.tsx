'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import { gooeyToast } from 'goey-toast'

interface UserOption {
  id: string
  full_name: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  due_date: string | null
  assignee_id: string | null
  creator_id: string | null
  assignee?: {
    full_name: string
  }
  creator?: {
    full_name: string
  }
}

export default function TasksPage() {
  const supabase = createClient()
  const { isOffline, addToQueue } = useAppStore()
  const [isPending, startTransition] = useTransition()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)

  // Drawer & Form State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasksData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: uProfile } = await supabase
        .from('users')
        .select('*, roles(*)')
        .eq('auth_id', user.id)
        .single()

      if (uProfile) {
        setCurrentUser(uProfile)

        // Fetch team members
        const { data: usersList } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('company_id', uProfile.company_id)
        if (usersList) setTeam(usersList as UserOption[])

        // Fetch tasks
        const { data: taskList } = await supabase
          .from('tasks')
          .select('*, assignee:users!assignee_id(full_name), creator:users!creator_id(full_name)')
          .eq('company_id', uProfile.company_id)
          .order('created_at', { ascending: false })

        if (taskList) setTasks(taskList as any[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Deferred so the synchronous setLoading(true) inside the fetcher does
    // not fire as a synchronous setState within this effect.
    queueMicrotask(() => fetchTasksData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update Status Action
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Permission check
    const isOwner = task.assignee_id === currentUser?.id
    const isAdminOrManager = currentUser?.roles?.is_admin || currentUser?.roles?.name === 'Manager'

    if (!isOwner && !isAdminOrManager) {
      gooeyToast.warning('You can only modify the status of tasks assigned to you.')
      return
    }

    // Update locally first for optimistic UX
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      if (isOffline) {
        addToQueue({
          type: 'update_task_status',
          payload: { id: taskId, status: newStatus },
        })
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', taskId)
        if (error) throw error
      }
    } catch (err: any) {
      gooeyToast.error(`Failed to update status: ${err.message}`)
      fetchTasksData() // Revert
    }
  }

  // Create Task Action
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const assigneeId = formData.get('assigneeId') as string
    const dueDate = formData.get('dueDate') as string

    if (!title) {
      setError('Task title is required.')
      return
    }

    const payload = {
      company_id: currentUser.company_id,
      creator_id: currentUser.id,
      assignee_id: assigneeId || null,
      title,
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: 'todo' as const,
    }

    startTransition(async () => {
      try {
        if (isOffline) {
          addToQueue({ type: 'create_task', payload })
          gooeyToast.info('Task added to offline sync queue!')
        } else {
          const { error } = await supabase.from('tasks').insert(payload)
          if (error) throw error
        }

        setIsCreateOpen(false)
        fetchTasksData()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ]

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const getOverdueStyle = (dateStr: string | null) => {
    if (isOverdue(dateStr)) {
      return 'border-red-200 bg-red-50/70 shadow-sm text-red-700'
    }
    return 'border-border hover:border-gray-300 shadow-sm hover:shadow-md'
  }

  const isAllowedToCreate = currentUser?.roles?.is_admin || currentUser?.roles?.name === 'Manager'

  if (loading && tasks.length === 0) {
    return <SkeletonLoader type="kanban" />
  }

  const todoCount = tasks.filter(t => t.status === 'todo').length
  const progressCount = tasks.filter(t => t.status === 'in_progress').length
  const reviewCount = tasks.filter(t => t.status === 'review').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const totalCount = tasks.length || 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Task Board</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">COORDINATION AND MONITORING OF DIVISION WORK ITEMS</p>
        </div>
        {isAllowedToCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-mono uppercase text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            Add Task
          </button>
        )}
      </div>

      {/* Progress Chart Summary */}
      <div className="bg-white border border-border p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono uppercase text-gray-500 font-bold">Task Completion Progress</span>
          <span className="text-[11px] font-mono text-gray-500">
            Completed: {doneCount} of {tasks.length} ({Math.round((doneCount / totalCount) * 100)}%)
          </span>
        </div>
        
        {/* Continuous Multi-color Bar */}
        <div className="w-full h-3 bg-gray-155 bg-gray-100 rounded-full flex overflow-hidden">
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(todoCount / totalCount) * 100}%` }} title={`To Do: ${todoCount}`} />
          <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(progressCount / totalCount) * 100}%` }} title={`In Progress: ${progressCount}`} />
          <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(reviewCount / totalCount) * 100}%` }} title={`Review: ${reviewCount}`} />
          <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${(doneCount / totalCount) * 100}%` }} title={`Done: ${doneCount}`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] font-mono mt-3 text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> To Do ({todoCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> In Progress ({progressCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Review ({reviewCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500" /> Done ({doneCount})</div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          return (
            <div
              key={col.id}
              className="bg-surface p-4 rounded-md border border-border flex flex-col min-h-[400px] max-h-[600px] overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData('text/plain')
                updateTaskStatus(taskId, col.id)
              }}
            >
              <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
                <span className="text-xs font-mono uppercase text-gray-500 font-semibold">{col.title}</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', task.id)
                    }}
                    onClick={() => setSelectedTask(task)}
                    className={`p-3 bg-white border rounded-md transition-all cursor-grab active:cursor-grabbing ${getOverdueStyle(
                      task.due_date
                    )}`}
                  >
                    <h3 className="text-xs font-bold text-foreground leading-normal truncate">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{task.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border">
                      <span className="text-[11px] font-mono text-gray-500 truncate max-w-[120px]">
                        @{task.assignee?.full_name || 'Unassigned'}
                      </span>
                      {task.due_date && (
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded-md border ${
                            isOverdue(task.due_date)
                              ? 'text-red-600 border-red-200 bg-red-100'
                              : 'text-gray-500 border-border'
                          }`}
                        >
                          {new Date(task.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-md p-6 text-center text-gray-400 text-xs font-mono uppercase">
                    EMPTY
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Modal / Sheet Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">Create New Task</h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">WORK ITEM REGISTRATION</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-500 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  [Close]
                </button>
              </div>

              <form id="create-task-form" onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Task Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans"
                    placeholder="Example: Warehouse A Stock Audit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans resize-none"
                    placeholder="Detailed task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Assignee</label>
                    <select
                      name="assigneeId"
                      disabled={isPending}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                    >
                      <option value="">Unassigned</option>
                      {team.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      disabled={isPending}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-mono"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded-md">
                    {error}
                  </div>
                )}
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-1/2 py-2.5 bg-surface hover:bg-gray-50 text-gray-700 font-mono text-xs uppercase rounded-md border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-task-form"
                disabled={isPending}
                className="w-1/2 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
              >
                {isPending ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Sheet Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">{selectedTask.title}</h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">TASK ID: {selectedTask.id.substring(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  [Close]
                </button>
              </div>

              <div className="space-y-6">
                {selectedTask.description && (
                  <div>
                    <h4 className="text-xs font-mono text-gray-500 uppercase mb-2">Detailed Description</h4>
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 border border-border rounded-md font-sans">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-gray-500 uppercase">Current Status</span>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => {
                        updateTaskStatus(selectedTask.id, e.target.value as Task['status'])
                        setSelectedTask({ ...selectedTask, status: e.target.value as Task['status'] })
                      }}
                      className="w-full px-2 py-1.5 bg-surface border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-gray-500 uppercase">Due Date</span>
                    <div className="px-3 py-1.5 bg-gray-50 border border-border rounded-md text-xs font-mono text-gray-700">
                      {selectedTask.due_date
                        ? new Date(selectedTask.due_date).toLocaleDateString()
                        : 'No Limit'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Assigned To</span>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      @{selectedTask.assignee?.full_name || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Created By</span>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      @{selectedTask.creator?.full_name || 'System'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <button
                onClick={() => setSelectedTask(null)}
                className="w-full py-2 bg-surface hover:bg-surface-hover text-gray-700 font-mono text-xs uppercase rounded-md border border-border transition-colors cursor-pointer"
              >
                Back to Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
