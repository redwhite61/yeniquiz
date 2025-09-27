'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMemo, type KeyboardEvent } from 'react'

interface CategoryCounts {
  quizzes: number
  questions: number
}

export interface CategoryCardProps {
  category: {
    id: string
    name: string
    description?: string | null
    color?: string | null
    image?: string | null
    _count: CategoryCounts
  }
  onView: () => void
}

export function CategoryCard({ category, onView }: CategoryCardProps) {
  const fallbackBackground = useMemo(() => {
    const baseColor = category.color || '#1d4ed8'
    return `linear-gradient(135deg, ${baseColor} 0%, rgba(15,23,42,0.8) 100%)`
  }, [category.color])

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onView()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={handleKeyPress}
      className="group relative flex h-64 cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5 shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/60 hover:-translate-y-2 hover:shadow-2xl"
      style={{ backgroundColor: category.color || '#f1f5f9' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: category.image ? `url(${category.image})` : fallbackBackground,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/55 to-slate-900/10" />
      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
        <div className="space-y-4">
          <Badge className="w-auto border-white/20 bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
            {category._count.quizzes} test
          </Badge>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {category.name}
            </h3>
            <p className="text-sm text-white/80 line-clamp-2">
              {category.description || 'Bu kategoriye ait testleri hemen keşfedin.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge className="border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            {category._count.questions} soru
          </Badge>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white group-hover:translate-x-1"
            onClick={(event) => {
              event.stopPropagation()
              onView()
            }}
          >
            Testleri Gör
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard
