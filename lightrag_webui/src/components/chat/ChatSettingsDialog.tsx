import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import type { ChatSettings } from '@/types/chat'

interface ChatSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ChatSettings
  onSave: (settings: ChatSettings) => void
}

export default function ChatSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: ChatSettingsDialogProps) {
  const { t } = useTranslation()
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings)

  const handleSave = () => {
    onSave(localSettings)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalSettings(settings) // 恢复原始设置
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('chat.settingsDialog.title')}</DialogTitle>
          <DialogDescription>{t('chat.settingsDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 提示：共享参数 */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {t('chat.settingsDialog.sharedSettingsHint')}
            </p>
          </div>

          {/* 联网搜索 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="webSearch">{t('chat.settingsDialog.webSearch')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('chat.settingsDialog.webSearchHint')}
              </p>
            </div>
            <Switch
              id="webSearch"
              checked={localSettings.webSearchEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, webSearchEnabled: checked })
              }
            />
          </div>

          {/* 系统提示词 */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">{t('chat.settingsDialog.systemPrompt')}</Label>
            <Textarea
              id="systemPrompt"
              placeholder={t('chat.settingsDialog.systemPromptPlaceholder')}
              value={localSettings.systemPrompt || ''}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, systemPrompt: e.target.value })
              }
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              {t('chat.settingsDialog.systemPromptHint')}
            </p>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

