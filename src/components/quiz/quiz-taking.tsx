'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, ChevronLeft, ChevronRight, Flag, ZoomIn } from 'lucide-react'
import { normalizeImageUrl, getFallbackImageUrl } from '@/lib/image-utils'
import { ImageModal } from '@/components/ui/image-modal'
import { toast } from '@/hooks/use-toast'

interface Question {
  id: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT' | 'IMAGE'
  options: Array<{
    text: string
    imageUrl?: string
  }>
  imageUrl?: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  questions: (Question & { order: number })[]
}

interface QuizTakingProps {
  quiz: Quiz
  onComplete: (answers: Record<string, string>, timeSpent: number) => void
  onExit: () => void
}

const getDifficultyBadge = (difficulty: Question['difficulty']) => {
  switch (difficulty) {
    case 'EASY':
      return { label: 'Kolay', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'MEDIUM':
      return { label: 'Orta', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'HARD':
      return { label: 'Zor', className: 'bg-rose-100 text-rose-700 border-rose-200' }
  }
}

const getTrueFalseStyles = (selected: boolean, isTrue: boolean) => {
  if (!selected) {
    return 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50'
  }
  return isTrue
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
    : 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
}

export function QuizTaking({ quiz, onComplete, onExit }: QuizTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [startTime] = useState(Date.now())
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [selectedImageAlt, setSelectedImageAlt] = useState('')

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  const normalizedQuestionImage = normalizeImageUrl(currentQuestion.imageUrl || '')
  const normalizedOptions = (() => {
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      return currentQuestion.options.map((option) => ({
        ...option,
        text: option.text || '',
        imageUrl: normalizeImageUrl(option.imageUrl || '')
      }))
    }

    if (currentQuestion.type === 'TRUE_FALSE') {
      return [
        { text: 'Doğru', imageUrl: '' },
        { text: 'Yanlış', imageUrl: '' }
      ]
    }

    return []
  })()

  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return prev ? prev - 1 : null
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handleSubmit = (autoSubmit = false) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    onComplete(answers, timeSpent)
  }

  const isQuestionAnswered = (question: Quiz['questions'][number]) => {
    const answer = answers[question.id]

    if (question.type === 'TEXT') {
      return Boolean(answer && answer.trim().length > 0)
    }

    return answer !== undefined && answer !== ''
  }

  const getAnsweredCount = () =>
    quiz.questions.reduce((count, question) => (isQuestionAnswered(question) ? count + 1 : count), 0)

  const handleImageClick = (imageUrl: string, alt: string = 'Resim') => {
    setSelectedImageUrl(imageUrl)
    setSelectedImageAlt(alt)
    setIsModalOpen(true)
  }

  const closeImageModal = () => {
    setIsModalOpen(false)
    setSelectedImageUrl('')
    setSelectedImageAlt('')
  }

  const handleManualSubmit = () => {
    const answeredCount = getAnsweredCount()

    if (answeredCount < quiz.questions.length) {
      const firstUnansweredIndex = quiz.questions.findIndex((question) => !isQuestionAnswered(question))

      toast({
        title: 'Eksik sorular var',
        description: `${quiz.questions.length - answeredCount} soruya daha cevap vermelisiniz.`,
        variant: 'destructive'
      })

      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex)
      }

      return
    }

    handleSubmit()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const answeredCount = getAnsweredCount()
  const totalQuestions = quiz.questions.length
  const allQuestionsAnswered = answeredCount === totalQuestions

  const difficultyBadge = getDifficultyBadge(currentQuestion.difficulty)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Card className="w-full border border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    {quiz.questions.length} soru
                  </span>
                  <span>•</span>
                  <span>{quiz.timeLimit ? `${quiz.timeLimit} dakika` : 'Süre sınırı yok'}</span>
                </div>
                <CardTitle className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{quiz.title}</CardTitle>
                {quiz.description && (
                  <CardDescription className="mt-2 text-base text-slate-500">{quiz.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-3">
                {timeLeft !== null && (
                  <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                    timeLeft < 300
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-blue-200 bg-blue-50 text-blue-600'
                  }`}>
                    <Clock className="h-4 w-4" />
                    {formatTime(timeLeft)}
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={onExit}
                  className="border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                >
                  Çıkış
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Soru {currentQuestionIndex + 1}</span>
                  <span className="text-slate-400">/ {quiz.questions.length}</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="font-medium text-slate-900">Cevaplanan:</span>
                  <span className="text-blue-600">{answeredCount}</span>
                  <span className="text-slate-400">/ {totalQuestions}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>İlerleme</span>
                  <span className="font-semibold text-blue-600">%{Math.round(progress)}</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {difficultyBadge && (
                    <Badge className={`${difficultyBadge.className} border px-3 py-1 font-medium`}>{difficultyBadge.label}</Badge>
                  )}
                  <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-slate-700 font-medium">
                    {currentQuestion.points} Puan
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium">
                    Soru {currentQuestionIndex + 1}
                  </Badge>
                  <Button
                    variant={flaggedQuestions.has(currentQuestion.id) ? 'default' : 'outline'}
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`ml-auto inline-flex items-center gap-2 ${
                      flaggedQuestions.has(currentQuestion.id)
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'border-slate-200 text-slate-700 hover:border-amber-200 hover:text-amber-600'
                    }`}
                  >
                    <Flag className="h-4 w-4" />
                    {flaggedQuestions.has(currentQuestion.id) ? 'İşaretlendi' : 'İşaretle'}
                  </Button>
                </div>
                <CardTitle className="text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
                  {currentQuestion.content}
                </CardTitle>
                {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE' || currentQuestion.type === 'IMAGE') &&
                  normalizedQuestionImage && (
                    <div
                      className="group relative mt-2 cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                      onClick={() => handleImageClick(normalizedQuestionImage, 'Soru resmi')}
                    >
                      <img
                        src={normalizedQuestionImage}
                        alt="Soru resmi"
                        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        onError={(e) => {
                          const img = e.currentTarget
                          img.src = getFallbackImageUrl('question')
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="rounded-full bg-white/90 p-3 shadow">
                          <ZoomIn className="h-5 w-5 text-slate-700" />
                        </div>
                      </div>
                    </div>
                  )}
              </CardHeader>
              <CardContent className="space-y-6">
                {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'IMAGE') && (
                  <div className="space-y-3">
                    {normalizedOptions.map((option, index) => {
                      const isSelected = answers[currentQuestion.id] === index.toString()
                      return (
                        <div
                          key={index}
                          onClick={() => handleAnswerChange(currentQuestion.id, index.toString())}
                          className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                              isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <Label className="flex-1 cursor-pointer text-sm font-medium text-slate-700">
                            {option.text || `Seçenek ${index + 1}`}
                          </Label>
                          {normalizedOptions[index]?.imageUrl && (
                            <div
                              className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleImageClick(
                                  normalizedOptions[index].imageUrl || '',
                                  `Seçenek ${String.fromCharCode(65 + index)}`
                                )
                              }}
                            >
                              <img
                                src={normalizedOptions[index].imageUrl}
                                alt={`Seçenek ${String.fromCharCode(65 + index)}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  const img = e.currentTarget
                                  img.src = getFallbackImageUrl('option')
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <ZoomIn className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {normalizedOptions.slice(0, 2).map((option, index) => {
                      const isSelected = answers[currentQuestion.id] === index.toString()
                      return (
                        <div
                          key={index}
                          onClick={() => handleAnswerChange(currentQuestion.id, index.toString())}
                          className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 text-center text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm ${
                            getTrueFalseStyles(isSelected, index === 0)
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                              isSelected
                              ? index === 0
                                ? 'border-emerald-400 bg-emerald-500 text-white'
                                : 'border-rose-400 bg-rose-500 text-white'
                              : 'border-slate-200 text-slate-500'
                          }`}
                          >
                            {option.text?.charAt(0) || (index === 0 ? 'D' : 'Y')}
                          </div>
                          <span className="text-base font-semibold text-slate-700">{option.text || (index === 0 ? 'Doğru' : 'Yanlış')}</span>
                          {option.imageUrl && (
                            <button
                              type="button"
                              className="group relative mt-2 h-24 w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleImageClick(option.imageUrl || '', `Seçenek ${index === 0 ? 'Doğru' : 'Yanlış'}`)
                              }}
                            >
                              <img
                                src={option.imageUrl}
                                alt={`Seçenek ${index === 0 ? 'Doğru' : 'Yanlış'}`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  const img = e.currentTarget
                                  img.src = getFallbackImageUrl('option')
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-slate-900/30 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <ZoomIn className="h-5 w-5" />
                              </span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {currentQuestion.type === 'TEXT' && (
                  <div className="space-y-2">
                    <Textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Cevabınızı buraya yazın..."
                      rows={6}
                      className="resize-none border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:ring-blue-200"
                    />
                    <div className="text-right text-xs text-slate-500">
                      {answers[currentQuestion.id]?.length || 0} karakter
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className="order-1 border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Önceki Soru
              </Button>
              <div className="order-3 flex items-center gap-2 text-sm text-slate-500 sm:order-2">
                <span>{answeredCount} cevaplandı</span>
                <span>•</span>
                <span>{flaggedQuestions.size} işaretlendi</span>
              </div>
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  onClick={goToNext}
                  className="order-2 sm:order-3 inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sonraki Soru
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleManualSubmit}
                  aria-disabled={!allQuestionsAnswered}
                  className={`order-2 sm:order-3 inline-flex items-center gap-2 text-white transition ${
                    allQuestionsAnswered
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-300 text-slate-500 hover:bg-slate-300 hover:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Testi Bitir
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!allQuestionsAnswered && (
              <p className="text-sm font-medium text-amber-600">
                Tüm soruları cevaplamadan testi tamamlayamazsınız.
              </p>
            )}
          </div>

          <Card className="border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Soru Navigatörü</CardTitle>
              <CardDescription className="text-slate-500">Sorular arasında hızlı geçiş yapın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {quiz.questions.map((question, index) => {
                  const isCurrent = currentQuestionIndex === index
                  const isAnswered = isQuestionAnswered(question)
                  const isFlagged = flaggedQuestions.has(question.id)

                  return (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`relative flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : isAnswered
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isFlagged
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {index + 1}
                      {isAnswered && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500"></span>}
                      {isFlagged && <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-amber-500"></span>}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Cevaplandı
                  </span>
                  <span className="text-slate-900">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    İşaretlendi
                  </span>
                  <span className="text-slate-900">{flaggedQuestions.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Kalan
                  </span>
                  <span className="text-slate-900">{totalQuestions - answeredCount}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Toplam Soru</span>
                  <span className="font-medium text-slate-900">{quiz.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Süre</span>
                  <span className="font-medium text-slate-900">{quiz.timeLimit ? `${quiz.timeLimit} dakika` : 'Sınırsız'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam Puan</span>
                  <span className="font-medium text-slate-900">
                    {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageModal isOpen={isModalOpen} onClose={closeImageModal} imageUrl={selectedImageUrl} alt={selectedImageAlt} />
    </div>
  )
}
