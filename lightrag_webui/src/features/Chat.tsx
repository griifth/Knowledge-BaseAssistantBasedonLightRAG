import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversationsStore } from '@/stores/conversations'
import { useSettingsStore } from '@/stores/settings'
import { queryTextStream } from '@/api/lightrag'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatHeader from '@/components/chat/ChatHeader'
import FileUploadButton from '@/components/chat/FileUploadButton'
import WebSearchToggle from '@/components/chat/WebSearchToggle'
import { ChatMessage } from '@/components/retrieval/ChatMessage'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import { SendIcon, MessageSquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/ScrollArea'
import type { ChatMessage as ChatMessageType } from '@/types/chat'
import type { ParsedFile } from '@/lib/fileParser'
import { formatFileContentForPrompt } from '@/lib/fileParser'
import { webSearch, formatSearchResultsForPrompt, extractSearchKeywords } from '@/lib/webSearch'

// 生成唯一 ID
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// COT 解析函数
const parseCOTContent = (content: string) => {
  const thinkStartTag = '<think>'
  const thinkEndTag = '</think>'

  const startMatches: number[] = []
  const endMatches: number[] = []

  let startIndex = 0
  while ((startIndex = content.indexOf(thinkStartTag, startIndex)) !== -1) {
    startMatches.push(startIndex)
    startIndex += thinkStartTag.length
  }

  let endIndex = 0
  while ((endIndex = content.indexOf(thinkEndTag, endIndex)) !== -1) {
    endMatches.push(endIndex)
    endIndex += thinkEndTag.length
  }

  const hasThinkStart = startMatches.length > 0
  const hasThinkEnd = endMatches.length > 0
  const isThinking = hasThinkStart && startMatches.length > endMatches.length

  let thinkingContent = ''
  let displayContent = content

  if (hasThinkStart) {
    if (hasThinkEnd && startMatches.length === endMatches.length) {
      const lastStartIndex = startMatches[startMatches.length - 1]
      const lastEndIndex = endMatches[endMatches.length - 1]

      if (lastEndIndex > lastStartIndex) {
        thinkingContent = content
          .substring(lastStartIndex + thinkStartTag.length, lastEndIndex)
          .trim()
        displayContent = content.substring(lastEndIndex + thinkEndTag.length).trim()
      }
    } else if (isThinking) {
      const lastStartIndex = startMatches[startMatches.length - 1]
      thinkingContent = content.substring(lastStartIndex + thinkStartTag.length)
      displayContent = ''
    }
  }

  return {
    isThinking,
    thinkingContent,
    displayContent,
    hasValidThinkBlock:
      hasThinkStart && hasThinkEnd && startMatches.length === endMatches.length,
  }
}

export default function Chat() {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<ParsedFile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const thinkingStartTime = useRef<number | null>(null)
  const thinkingProcessed = useRef(false)

  const currentConversationId = useConversationsStore.use.currentConversationId()
  const conversations = useConversationsStore.use.conversations()
  const createConversation = useConversationsStore.use.createConversation()
  const addMessage = useConversationsStore.use.addMessage()
  const updateMessage = useConversationsStore.use.updateMessage()
  const updateConversationSettings = useConversationsStore.use.updateConversationSettings()

  // 直接从 conversations 数组中获取当前会话，确保响应式更新
  const conversation = conversations.find((c) => c.id === currentConversationId)
  const messages = conversation?.messages ?? []
  const settings = conversation?.settings
  
  // 联网搜索状态来自设置
  const webSearchEnabled = settings?.webSearchEnabled ?? false

  // 自动创建会话
  useEffect(() => {
    if (!currentConversationId) {
      createConversation()
    }
  }, [currentConversationId, createConversation])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  // 发送消息
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim() || isLoading || !currentConversationId) return

      // 重置思考状态
      thinkingStartTime.current = null
      thinkingProcessed.current = false

      // 处理附件
      const attachments = uploadedFiles
        .filter((f) => !f.error)
        .map((f) => ({
          id: generateId(),
          name: f.name,
          type: f.type,
          size: f.size,
          content: f.content,
        }))

      const userMessage: ChatMessageType = {
        id: `msg-${generateId()}`,
        role: 'user',
        content: inputValue,
        timestamp: Date.now(),
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      const assistantMessage: ChatMessageType = {
        id: `msg-${generateId()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isThinking: false,
        mermaidRendered: false,
        latexRendered: false,
      }

      // 添加消息
      addMessage(currentConversationId, userMessage)
      addMessage(currentConversationId, assistantMessage)

      // 清空输入和文件
      setInputValue('')
      setUploadedFiles([])
      setIsLoading(true)

      // 构建增强的 query
      let enhancedQuery = inputValue

      // 添加文件内容
      const fileContent = formatFileContentForPrompt(uploadedFiles)
      if (fileContent) {
        enhancedQuery = fileContent + enhancedQuery
      }

      // 联网搜索
      if (webSearchEnabled) {
        const searchKeywords = extractSearchKeywords(inputValue)
        const searchResult = await webSearch(searchKeywords)
        const searchContent = formatSearchResultsForPrompt(searchResult)
        if (searchContent) {
          enhancedQuery = searchContent + enhancedQuery
          // 更新用户消息，添加搜索上下文
          updateMessage(currentConversationId, userMessage.id, {
            searchContext: {
              query: searchKeywords,
              results: searchResult.results,
            },
          })
        }
      }

      // 获取设置：使用 Retrieval 页面的全局参数
      const globalSettings = useSettingsStore.getState().querySettings
      const historyTurns = settings?.historyTurns ?? 3

      const queryParams = {
        ...globalSettings,
        mode: settings?.mode || 'hybrid',
        query: enhancedQuery,
        response_type: 'Multiple Paragraphs',
        stream: true,
        history_turns: historyTurns,
        // Chat 页面独有：系统提示词
        ...(settings?.systemPrompt && { system_prompt: settings.systemPrompt }),
        conversation_history:
          historyTurns > 0
            ? messages
                .filter((m) => !m.isError)
                .slice(-historyTurns * 2)
                .map((m) => ({ role: m.role, content: m.content }))
            : [],
      }

      let fullContent = ''

      try {
        await queryTextStream(
          queryParams,
          (chunk) => {
            fullContent += chunk

            // 开始思考计时
            if (fullContent.includes('<think>') && !thinkingStartTime.current) {
              thinkingStartTime.current = Date.now()
            }

            // 解析 COT
            const cotResult = parseCOTContent(fullContent)

            // 计算思考时间
            let thinkingTime: number | null = null
            if (
              cotResult.hasValidThinkBlock &&
              !thinkingProcessed.current &&
              thinkingStartTime.current
            ) {
              const duration = (Date.now() - thinkingStartTime.current) / 1000
              thinkingTime = parseFloat(duration.toFixed(2))
              thinkingProcessed.current = true
            }

            updateMessage(currentConversationId, assistantMessage.id, {
              content: fullContent,
              isThinking: cotResult.isThinking,
              thinkingContent: cotResult.thinkingContent,
              displayContent: cotResult.isThinking
                ? ''
                : cotResult.displayContent || fullContent,
              thinkingTime: thinkingTime ?? assistantMessage.thinkingTime,
              mermaidRendered: /```mermaid\s+([\s\S]+?)```/g.test(fullContent),
              latexRendered: true,
            })
          },
          (error) => {
            updateMessage(currentConversationId, assistantMessage.id, {
              content: fullContent + '\n' + error,
              isError: true,
            })
          }
        )
      } catch (err) {
        updateMessage(currentConversationId, assistantMessage.id, {
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          isError: true,
        })
      } finally {
        setIsLoading(false)

        // 最终状态更新
        const finalCotResult = parseCOTContent(fullContent)
        updateMessage(currentConversationId, assistantMessage.id, {
          isThinking: false,
          displayContent: finalCotResult.displayContent || fullContent,
        })
      }
    },
    [
      inputValue,
      isLoading,
      currentConversationId,
      messages,
      settings,
      addMessage,
      updateMessage,
      uploadedFiles,
      webSearchEnabled,
    ]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full">
      {/* 侧边栏 */}
      <ChatSidebar />

      {/* 主聊天区域 */}
      <div className="flex flex-1 flex-col">
        {/* 头部 */}
        <ChatHeader />

        {/* 消息列表 */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl p-4">
            {messages.length === 0 ? (
              <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
                <MessageSquareIcon className="size-16 mb-4 opacity-20" />
                <h2 className="text-2xl font-semibold mb-2">{t('chat.welcomeTitle')}</h2>
                <p className="text-sm text-center max-w-md">
                  {t('chat.welcomeSubtitle')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <ChatMessage
                      message={{
                        ...message,
                        mermaidRendered: message.mermaidRendered ?? true,
                        latexRendered: message.latexRendered ?? true,
                      }}
                      isTabActive={true}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            {/* 已上传的文件 */}
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                      file.error
                        ? 'border-destructive/50 bg-destructive/10 text-destructive'
                        : 'border-border bg-muted'
                    }`}
                  >
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...uploadedFiles]
                        newFiles.splice(index, 1)
                        setUploadedFiles(newFiles)
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              {/* 文件上传按钮 */}
              <FileUploadButton
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                disabled={isLoading}
              />
              
              {/* 联网搜索开关 */}
              <WebSearchToggle
                enabled={webSearchEnabled}
                onToggle={(enabled) => {
                  if (currentConversationId) {
                    updateConversationSettings(currentConversationId, { webSearchEnabled: enabled })
                  }
                }}
                disabled={isLoading}
              />
              
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.inputPlaceholder')}
                className="min-h-[44px] max-h-[200px] resize-none flex-1"
                disabled={isLoading}
                rows={1}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="shrink-0 self-end"
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {webSearchEnabled && (
                <span className="text-blue-500 mr-2">🌐 {t('chat.webSearchActive')}</span>
              )}
              {t('chat.inputHint')}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

