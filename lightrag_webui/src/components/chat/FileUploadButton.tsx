import { useRef, useState } from 'react'
import { PaperclipIcon, XIcon, FileTextIcon, ImageIcon, FileIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { parseFile, type ParsedFile } from '@/lib/fileParser'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/Tooltip'

interface FileUploadButtonProps {
  onFilesChange: (files: ParsedFile[]) => void
  files: ParsedFile[]
  disabled?: boolean
  className?: string
}

// 文件图标选择
function getFileIcon(type: string) {
  if (type.startsWith('image/')) {
    return <ImageIcon className="size-4" />
  }
  if (type.includes('text') || type.includes('json') || type.includes('xml')) {
    return <FileTextIcon className="size-4" />
  }
  return <FileIcon className="size-4" />
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FileUploadButton({
  onFilesChange,
  files,
  disabled,
  className,
}: FileUploadButtonProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setIsProcessing(true)
    try {
      const parsedFiles = await Promise.all(selectedFiles.map(parseFile))
      onFilesChange([...files, ...parsedFiles])
    } finally {
      setIsProcessing(false)
      // 清空 input 以允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* 已上传的文件列表 */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
                      file.error
                        ? 'border-destructive/50 bg-destructive/10 text-destructive'
                        : 'border-border bg-muted'
                    )}
                  >
                    {getFileIcon(file.type)}
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {file.error ? (
                    <span className="text-destructive">{file.error}</span>
                  ) : (
                    <span>{t('chat.fileReady')}</span>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClick}
              disabled={disabled || isProcessing}
              className="shrink-0"
            >
              <PaperclipIcon className={cn('size-4', isProcessing && 'animate-pulse')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('chat.uploadFile')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.xml,.html,.htm,.log,.yaml,.yml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/*,application/json,application/xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

