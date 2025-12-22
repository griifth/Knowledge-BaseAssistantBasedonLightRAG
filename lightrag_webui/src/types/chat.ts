// 会话类型
export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  model?: string
  settings?: ChatSettings
}

// 消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  isError?: boolean
  isThinking?: boolean
  thinkingContent?: string
  thinkingTime?: number | null
  displayContent?: string
  mermaidRendered?: boolean
  latexRendered?: boolean
  attachments?: FileAttachment[]
  // 联网搜索上下文
  searchContext?: SearchContext
}

// 文件附件
export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  content?: string
}

// 聊天设置
export interface ChatSettings {
  model: string
  mode: 'naive' | 'local' | 'global' | 'hybrid' | 'mix' | 'bypass'
  temperature: number
  maxTokens: number
  topP: number
  stream: boolean
  historyTurns: number
  systemPrompt?: string
  // 联网搜索
  webSearchEnabled: boolean
}

// 搜索结果
export interface SearchResult {
  title: string
  url: string
  snippet: string
}

// 消息中的搜索上下文
export interface SearchContext {
  query: string
  results: SearchResult[]
}

// 默认聊天设置
export const defaultChatSettings: ChatSettings = {
  model: '',
  mode: 'hybrid',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  stream: true,
  historyTurns: 3,
  systemPrompt: '',
  webSearchEnabled: false,
}

