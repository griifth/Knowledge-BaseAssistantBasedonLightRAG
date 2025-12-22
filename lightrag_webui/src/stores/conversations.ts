import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSelectors } from '@/lib/utils'
import type { Conversation, ChatMessage, ChatSettings } from '@/types/chat'
import { defaultChatSettings } from '@/types/chat'

interface ConversationsState {
  conversations: Conversation[]
  currentConversationId: string | null

  // Actions
  createConversation: () => string
  deleteConversation: (id: string) => void
  switchConversation: (id: string) => void
  updateConversationTitle: (id: string, title: string) => void
  updateConversationSettings: (id: string, settings: Partial<ChatSettings>) => void
  addMessage: (conversationId: string, message: ChatMessage) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void
  clearMessages: (conversationId: string) => void
  getCurrentConversation: () => Conversation | null
}

// 生成唯一 ID
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const useConversationsStoreBase = create<ConversationsState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

      createConversation: () => {
        const id = `conv-${generateId()}`
        const newConversation: Conversation = {
          id,
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: { ...defaultChatSettings },
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }))
        return id
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          const newCurrentId =
            state.currentConversationId === id
              ? filtered[0]?.id ?? null
              : state.currentConversationId
          return {
            conversations: filtered,
            currentConversationId: newCurrentId,
          }
        })
      },

      switchConversation: (id) => {
        set({ currentConversationId: id })
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }))
      },

      updateConversationSettings: (id, settings) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  settings: { ...c.settings, ...settings } as ChatSettings,
                  updatedAt: Date.now(),
                }
              : c
          ),
        }))
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  // 自动更新标题（取第一条用户消息的前30个字符）
                  title:
                    c.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 30) +
                        (message.content.length > 30 ? '...' : '')
                      : c.title,
                }
              : c
          ),
        }))
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }))
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], updatedAt: Date.now(), title: '新对话' }
              : c
          ),
        }))
      },

      getCurrentConversation: () => {
        const state = get()
        return (
          state.conversations.find((c) => c.id === state.currentConversationId) ??
          null
        )
      },
    }),
    {
      name: 'lightrag-conversations',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

export const useConversationsStore = createSelectors(useConversationsStoreBase)

