'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, MessageCircleHeart, Cloud } from 'lucide-react'

interface MoodTagsProps {
  onMoodClick: (mood: string) => void
}

export function MoodTags({ onMoodClick }: MoodTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMoodClick('relaxed')}
        className="bg-secondary/50 border-border hover:bg-secondary text-secondary-foreground"
      >
        <Sparkles className="w-4 h-4 mr-1" />
        轻松
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMoodClick('share')}
        className="bg-secondary/50 border-border hover:bg-secondary text-secondary-foreground"
      >
        <MessageCircleHeart className="w-4 h-4 mr-1" />
        分享
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMoodClick('listen')}
        className="bg-secondary/50 border-border hover:bg-secondary text-secondary-foreground"
      >
        <Cloud className="w-4 h-4 mr-1" />
        倾听
      </Button>
    </div>
  )
}
