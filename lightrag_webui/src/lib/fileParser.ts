/**
 * 文件解析工具
 * 支持前端解析文本文件，以及调用后端 API 解析 PDF/Word 等复杂文档
 */

import { backendBaseUrl } from '@/lib/constants'
import { useSettingsStore } from '@/stores/settings'

export interface ParsedFile {
  name: string
  type: string
  size: number
  content: string
  error?: string
}

// 支持前端直接解析的文件类型
const TEXT_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',
  'application/xml',
]

const TEXT_FILE_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.log', '.yaml', '.yml']

// 支持的图片类型（需要多模态模型）
const IMAGE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// 需要后端解析的文件类型
const BACKEND_PARSE_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx']

/**
 * 判断文件是否可以在前端解析
 */
export function canParseLocally(file: File): boolean {
  const ext = getFileExtension(file.name).toLowerCase()
  return (
    TEXT_FILE_TYPES.includes(file.type) ||
    TEXT_FILE_EXTENSIONS.includes(ext) ||
    file.type === '' && TEXT_FILE_EXTENSIONS.includes(ext)
  )
}

/**
 * 判断是否是图片文件
 */
export function isImageFile(file: File): boolean {
  return IMAGE_FILE_TYPES.includes(file.type)
}

/**
 * 判断是否需要后端解析
 */
export function needsBackendParsing(file: File): boolean {
  const ext = getFileExtension(file.name).toLowerCase()
  return BACKEND_PARSE_EXTENSIONS.includes(ext)
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot)
}

/**
 * 前端解析文本文件
 */
export async function parseTextFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve({
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        content: content,
      })
    }
    
    reader.onerror = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        error: '文件读取失败',
      })
    }
    
    reader.readAsText(file, 'utf-8')
  })
}

/**
 * 读取图片为 base64（用于多模态模型）
 */
export async function parseImageFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        content: content, // base64 data URL
      })
    }
    
    reader.onerror = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        error: '图片读取失败',
      })
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 调用后端 API 解析文件（PDF/Word/PPT/Excel）
 */
export async function parseFileViaBackend(file: File): Promise<ParsedFile> {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = localStorage.getItem('LIGHTRAG-API-TOKEN')
  const apiKey = useSettingsStore.getState().apiKey
  
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }
  
  try {
    const response = await fetch(`${backendBaseUrl}/chat/parse-file`, {
      method: 'POST',
      headers,
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        error: `解析失败: ${response.status} ${errorText}`,
      }
    }
    
    const result = await response.json()
    
    if (result.error) {
      return {
        name: result.filename || file.name,
        type: result.content_type || file.type,
        size: result.size || file.size,
        content: '',
        error: result.error,
      }
    }
    
    return {
      name: result.filename || file.name,
      type: result.content_type || file.type,
      size: result.size || file.size,
      content: result.content || '',
    }
  } catch (err) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      error: `网络错误: ${err instanceof Error ? err.message : '未知错误'}`,
    }
  }
}

/**
 * 主解析函数：根据文件类型选择合适的解析方式
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  // 文件大小限制（20MB）
  const MAX_SIZE = 20 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      error: '文件过大，最大支持 20MB',
    }
  }
  
  // 需要后端解析的文件（PDF/Word/PPT/Excel）
  if (needsBackendParsing(file)) {
    return parseFileViaBackend(file)
  }
  
  // 文本文件：前端直接解析
  if (canParseLocally(file)) {
    return parseTextFile(file)
  }
  
  // 图片文件：读取为 base64（暂不支持多模态，返回提示）
  if (isImageFile(file)) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      error: '图片解析需要多模态模型支持，当前 LightRAG 暂不支持',
    }
  }
  
  // 不支持的文件类型
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    content: '',
    error: `不支持的文件类型: ${file.type || '未知'}`,
  }
}

/**
 * 批量解析文件
 */
export async function parseFiles(files: File[]): Promise<ParsedFile[]> {
  return Promise.all(files.map(parseFile))
}

/**
 * 将解析后的文件内容格式化为 prompt 附加内容
 */
export function formatFileContentForPrompt(files: ParsedFile[]): string {
  const validFiles = files.filter(f => f.content && !f.error)
  
  if (validFiles.length === 0) return ''
  
  const parts = validFiles.map(f => {
    // 限制单个文件内容长度
    const maxContentLength = 30000
    const content = f.content.length > maxContentLength 
      ? f.content.slice(0, maxContentLength) + '\n...(内容已截断)'
      : f.content
    
    return `<file name="${f.name}">\n${content}\n</file>`
  })
  
  return `\n\n---\n以下是用户上传的文件内容：\n${parts.join('\n\n')}\n---\n\n`
}
