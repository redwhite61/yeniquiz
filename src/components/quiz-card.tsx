'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Layers, Users, Play } from 'lucide-react'

interface QuizCounts {
  questions: number
  attempts: number
}

interface QuizCardQuiz {
  id: string
  title: string
  description?: string | null
  image?: string | null
  timeLimit?: number | null
  category: {
    name: string
    color?: string | null
  }
  _count: QuizCounts
}

interface QuizCardProps {
  quiz: QuizCardQuiz
  onStart: () => void
  isStarting?: boolean
}

const formatTimeLimit = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return 'Belirtilmedi'
  }

  if (minutes < 60) {
    return `${minutes} dk.`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const hourLabel = `${hours} sa.`

  if (!remainingMinutes) {
    return hourLabel
  }

  return `${hourLabel} ${remainingMinutes} dk.`
}

export function QuizCard({ quiz, onStart, isStarting = false }: QuizCardProps) {
  const fallbackBackground = useMemo(() => {
    const baseColor = quiz.category.color || '#2563eb'
    return `linear-gradient(135deg, ${baseColor} 0%, rgba(15,23,42,0.85) 100%)`
  }, [quiz.category.color])

  const numberFormatter = useMemo(() => new Intl.NumberFormat('tr-TR'), [])
  const questionLabel = `${numberFormatter.format(quiz._count.questions)} soru`
  const attemptsLabel = numberFormatter.format(quiz._count.attempts)
  const timeLimitLabel = formatTimeLimit(quiz.timeLimit)

  return (
    <div
      className="group relative flex min-h-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: quiz.image ? `url(${quiz.image})` : fallbackBackground
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-slate-900/10" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur">
                <span>{quiz.category.name}</span>
              </div>
              <h3 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                {quiz.title}
              </h3>
            </div>
            <Badge className="rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              {questionLabel}
            </Badge>
          </div>
          {quiz.description && (
            <p className="text-sm text-white/80 line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-white/90 backdrop-blur">
              <Layers className="h-4 w-4 text-white" />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold leading-tight text-white">
                  Kategori : {quiz.category.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-white/90 backdrop-blur">
              <Clock className="h-4 w-4 text-white" />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold leading-tight text-white">
                  Süre Limiti : {timeLimitLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-white/90 backdrop-blur">
              <Users className="h-4 w-4 text-white" />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold leading-tight text-white">
                  Deneme Sayısı : {attemptsLabel}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={onStart}
            disabled={isStarting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/90 px-6 font-semibold text-slate-900 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
          >
            <Play className="h-4 w-4" />
            {isStarting ? 'Yükleniyor...' : 'Teste Başla'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuizCard
