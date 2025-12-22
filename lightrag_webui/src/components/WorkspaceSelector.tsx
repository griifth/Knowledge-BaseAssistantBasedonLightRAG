import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Plus, Trash2, RefreshCw, FolderOpen } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/Dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/AlertDialog'
import Input from '@/components/ui/Input'
import { useSettingsStore } from '@/stores/settings'
import {
  listWorkspaces,
  createWorkspace,
  deleteWorkspace,
  WorkspaceInfo
} from '@/api/lightrag'
import { toast } from 'sonner'
import { controlButtonVariant } from '@/lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/Tooltip'

export default function WorkspaceSelector() {
  const { t } = useTranslation()
  const currentWorkspace = useSettingsStore.use.currentWorkspace()
  const setCurrentWorkspace = useSettingsStore.use.setCurrentWorkspace()
  const setAvailableWorkspaces = useSettingsStore.use.setAvailableWorkspaces()

  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch workspaces on mount
  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listWorkspaces()
      setWorkspaces(response.workspaces)
      setAvailableWorkspaces(response.workspaces.map((w) => w.name))
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
      toast.error(t('workspace.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [setAvailableWorkspaces, t])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  // Handle workspace change
  const handleWorkspaceChange = (value: string) => {
    if (value === '__create__') {
      setIsCreateDialogOpen(true)
      return
    }

    // Convert "(default)" back to empty string for API
    const workspaceValue = value === '(default)' ? '' : value
    if (workspaceValue !== currentWorkspace) {
      setCurrentWorkspace(workspaceValue)
    }
  }

  // Create new workspace
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error(t('workspace.nameRequired'))
      return
    }

    // Validate workspace name
    const validPattern = /^[a-zA-Z0-9_]+$/
    if (!validPattern.test(newWorkspaceName)) {
      toast.error(t('workspace.invalidName'))
      return
    }

    setIsCreating(true)
    try {
      const response = await createWorkspace(newWorkspaceName)
      if (response.status === 'success') {
        toast.success(t('workspace.createSuccess', { name: newWorkspaceName }))
        setIsCreateDialogOpen(false)
        setNewWorkspaceName('')
        await fetchWorkspaces()
        // Switch to the new workspace
        setCurrentWorkspace(newWorkspaceName)
      } else {
        toast.error(response.message)
      }
    } catch (error: any) {
      console.error('Failed to create workspace:', error)
      toast.error(error.message || t('workspace.createError'))
    } finally {
      setIsCreating(false)
    }
  }

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return

    setIsDeleting(true)
    try {
      const response = await deleteWorkspace(workspaceToDelete)
      if (response.status === 'success') {
        toast.success(t('workspace.deleteSuccess', { name: workspaceToDelete }))
        setIsDeleteDialogOpen(false)
        setWorkspaceToDelete(null)
        await fetchWorkspaces()
        // If we deleted the current workspace, switch to default
        if (currentWorkspace === workspaceToDelete) {
          setCurrentWorkspace('')
        }
      } else {
        toast.error(response.message)
      }
    } catch (error: any) {
      console.error('Failed to delete workspace:', error)
      toast.error(error.message || t('workspace.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Get display value for current workspace
  const displayValue = currentWorkspace || '(default)'

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Database className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('workspace.tooltip')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select value={displayValue} onValueChange={handleWorkspaceChange}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder={t('workspace.select')} />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <div key={workspace.name} className="flex items-center justify-between group">
              <SelectItem value={workspace.name} className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3 w-3" />
                  <span>{workspace.name}</span>
                  {workspace.document_count > 0 && (
                    <span className="text-muted-foreground text-[10px]">
                      ({workspace.document_count})
                    </span>
                  )}
                </div>
              </SelectItem>
              {!workspace.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setWorkspaceToDelete(workspace.name)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {workspaces.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {t('workspace.empty')}
            </div>
          )}
          <SelectSeparator />
          <SelectItem value="__create__" className="text-xs">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-3 w-3" />
              <span>{t('workspace.create')}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={controlButtonVariant}
        size="icon"
        className="h-8 w-8"
        onClick={fetchWorkspaces}
        disabled={loading}
        tooltip={t('workspace.refresh')}
        side="bottom"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
            <DialogDescription>{t('workspace.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('workspace.namePlaceholder')}
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateWorkspace()
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('workspace.nameHint')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isCreating}>
              {isCreating ? t('workspace.creating') : t('workspace.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workspace.deleteDescription', { name: workspaceToDelete })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('workspace.deleting') : t('workspace.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

