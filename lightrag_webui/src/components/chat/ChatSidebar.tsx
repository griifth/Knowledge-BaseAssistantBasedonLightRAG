import { useConversationsStore } from '@/stores/conversations'
import { PlusIcon, TrashIcon, MessageSquareIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/ScrollArea'

export default function ChatSidebar() {
  const { t } = useTranslation()
  const conversations = useConversationsStore.use.conversations()
  const currentConversationId = useConversationsStore.use.currentConversationId()
  const createConversation = useConversationsStore.use.createConversation()
  const deleteConversation = useConversationsStore.use.deleteConversation()
  const switchConversation = useConversationsStore.use.switchConversation()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      {/* 新建会话按钮 */}
      <div className="p-3 border-b">
        <Button
          onClick={() => createConversation()}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <PlusIcon className="size-4" />
          {t('chat.newConversation')}
        </Button>
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">
              {t('chat.noConversations')}
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors',
                    conv.id === currentConversationId
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => switchConversation(conv.id)}
                >
                  <MessageSquareIcon className="size-4 shrink-0" />
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

