import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConversationsStore } from '@/stores/conversations'
import { SettingsIcon, EraserIcon, HelpCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import ChatSettingsDialog from './ChatSettingsDialog'
import type { ChatSettings } from '@/types/chat'
import { defaultChatSettings } from '@/types/chat'

const queryModes = [
  { value: 'naive', label: 'Naive', description: 'chat.modeDesc.naive' },
  { value: 'local', label: 'Local', description: 'chat.modeDesc.local' },
  { value: 'global', label: 'Global', description: 'chat.modeDesc.global' },
  { value: 'hybrid', label: 'Hybrid', description: 'chat.modeDesc.hybrid' },
  { value: 'mix', label: 'Mix', description: 'chat.modeDesc.mix' },
  { value: 'bypass', label: 'Bypass', description: 'chat.modeDesc.bypass' },
] as const

export default function ChatHeader() {
  const { t } = useTranslation()
  const currentConversationId = useConversationsStore.use.currentConversationId()
  const conversations = useConversationsStore.use.conversations()
  const updateConversationSettings = useConversationsStore.use.updateConversationSettings()
  const clearMessages = useConversationsStore.use.clearMessages()

  // 直接从 conversations 数组中获取当前会话，确保响应式更新
  const conversation = conversations.find((c) => c.id === currentConversationId)
  const settings = conversation?.settings || defaultChatSettings

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  const handleModeChange = (mode: string) => {
    if (currentConversationId) {
      updateConversationSettings(currentConversationId, {
        mode: mode as ChatSettings['mode'],
      })
    }
  }

  const handleClearMessages = () => {
    if (currentConversationId) {
      clearMessages(currentConversationId)
    }
  }

  const handleSaveSettings = (newSettings: ChatSettings) => {
    if (currentConversationId) {
      updateConversationSettings(currentConversationId, newSettings)
    }
  }

  return (
    <header className="flex h-12 items-center justify-between border-b px-4 bg-background/95">
      <div className="flex items-center gap-4">
        {/* 查询模式选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('chat.queryMode')}:</span>
          <Select value={settings?.mode || 'hybrid'} onValueChange={handleModeChange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {queryModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1.5 text-xs">
                  {queryModes.map((mode) => (
                    <p key={mode.value}>
                      <strong>{mode.label}:</strong> {t(mode.description)}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 历史轮数显示 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('chat.historyTurns')}:</span>
          <span className="font-medium">{settings?.historyTurns || 3}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 清空消息 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearMessages}
          className="gap-1"
        >
          <EraserIcon className="size-4" />
          {t('chat.clear')}
        </Button>

        {/* 设置按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setSettingsDialogOpen(true)}
        >
          <SettingsIcon className="size-4" />
        </Button>
      </div>

      {/* 设置对话框 */}
      <ChatSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </header>
  )
}

