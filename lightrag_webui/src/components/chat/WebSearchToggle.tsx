import { GlobeIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/Tooltip'

interface WebSearchToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  className?: string
}

export default function WebSearchToggle({
  enabled,
  onToggle,
  disabled,
  className,
}: WebSearchToggleProps) {
  const { t } = useTranslation()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={enabled ? 'default' : 'outline'}
            size="icon"
            onClick={() => onToggle(!enabled)}
            disabled={disabled}
            className={cn(
              'shrink-0 transition-colors',
              enabled && 'bg-blue-500 hover:bg-blue-600 text-white',
              className
            )}
          >
            <GlobeIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {enabled ? t('chat.webSearchEnabled') : t('chat.webSearchDisabled')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

