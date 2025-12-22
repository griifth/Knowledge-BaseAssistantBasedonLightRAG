/**
 * 联网搜索工具
 * 使用后端代理调用博查AI搜索API
 */

import { backendBaseUrl } from '@/lib/constants'
import { useSettingsStore } from '@/stores/settings'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  summary?: string
  siteName?: string
  datePublished?: string
}

export interface WebSearchResponse {
  query: string
  results: SearchResult[]
  totalMatches?: number
  error?: string
}

/**
 * 调用后端博查搜索API
 */
export async function webSearch(
  query: string,
  options?: {
    count?: number
    freshness?: 'noLimit' | 'oneDay' | 'oneWeek' | 'oneMonth' | 'oneYear'
    summary?: boolean
  }
): Promise<WebSearchResponse> {
  if (!query.trim()) {
    return { query, results: [], error: '请输入搜索关键词' }
  }

  const token = localStorage.getItem('LIGHTRAG-API-TOKEN')
  const apiKey = useSettingsStore.getState().apiKey

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  try {
    const response = await fetch(`${backendBaseUrl}/chat/web-search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        count: options?.count ?? 8,
        freshness: options?.freshness ?? 'noLimit',
        summary: options?.summary ?? true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        query,
        results: [],
        error: `搜索请求失败: ${response.status} ${errorText}`,
      }
    }

    const data = await response.json()

    if (data.error) {
      return {
        query: data.query || query,
        results: [],
        error: data.error,
      }
    }

    return {
      query: data.query || query,
      results: data.results || [],
      totalMatches: data.totalMatches,
    }
  } catch (error) {
    return {
      query,
      results: [],
      error: `网络错误: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 将搜索结果格式化为 prompt 附加内容
 */
export function formatSearchResultsForPrompt(searchResponse: WebSearchResponse): string {
  if (searchResponse.error || searchResponse.results.length === 0) {
    return ''
  }

  const parts = searchResponse.results.map((r, i) => {
    const lines = [`[${i + 1}] ${r.title}`]
    if (r.url) lines.push(`来源: ${r.url}`)
    if (r.siteName) lines.push(`网站: ${r.siteName}`)
    if (r.datePublished) lines.push(`发布时间: ${r.datePublished}`)
    
    // 优先使用 summary（更完整），其次用 snippet
    const content = r.summary || r.snippet
    if (content) lines.push(content)
    
    return lines.join('\n')
  })

  return `\n\n---\n以下是联网搜索结果（关键词: "${searchResponse.query}"）：\n\n${parts.join('\n\n')}\n---\n\n`
}

/**
 * 从用户问题中提取搜索关键词
 * 简单实现：去除常见问句词和标点符号
 */
export function extractSearchKeywords(question: string): string {
  // 先去除标点符号
  let keywords = question.replace(/[？?！!。.，,、；;：:""''「」【】《》（）()]/g, ' ')
  
  // 去除常见问句词
  const stopWords = [
    '请问', '请', '告诉我', '什么是', '什么叫', '怎么', '如何', '为什么',
    '是什么', '有哪些', '哪些', '怎样', '能不能', '可以', '可不可以',
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'the', 'a', 'an'
  ]

  for (const word of stopWords) {
    // 使用字符串替换，不使用正则表达式避免特殊字符问题
    const lowerKeywords = keywords.toLowerCase()
    const lowerWord = word.toLowerCase()
    let index = lowerKeywords.indexOf(lowerWord)
    while (index !== -1) {
      keywords = keywords.slice(0, index) + ' ' + keywords.slice(index + word.length)
      index = keywords.toLowerCase().indexOf(lowerWord)
    }
  }

  // 清理多余空格
  keywords = keywords.replace(/\s+/g, ' ').trim()

  // 如果处理后太短，返回原问题（去除标点后的版本）
  return keywords.length < 3 ? question.replace(/[？?！!。.，,]/g, '').trim() : keywords
}
