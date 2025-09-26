'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Trophy, Star, ArrowRight, ZoomIn } from 'lucide-react'
import { normalizeImageUrl, getFallbackImageUrl } from '@/lib/image-utils'
import { ImageModal } from '@/components/ui/image-modal'

interface Answer {
  questionId: string
  answer: string
  isCorrect: boolean
  points: number
  question: {
    content: string
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT' | 'IMAGE'
    options: Array<{
      text: string
      imageUrl?: string
    }>
    correctAnswer: string
    points: number
    imageUrl?: string
  }
}

interface QuizAttempt {
  id: string
  score: number
  maxScore: number
  percentage: number
  timeSpent: number
  completedAt: string
  answers: Answer[]
}

interface QuizResultsProps {
  quizAttempt: QuizAttempt
  onRetry: () => void
  onExit: () => void
  showReview?: boolean
}

export function QuizResults({ quizAttempt, onRetry, onExit, showReview = false }: QuizResultsProps) {
  const [reviewMode, setReviewMode] = useState(showReview)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [selectedImageAlt, setSelectedImageAlt] = useState('')

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes} dakika ${remainingSeconds} saniye`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Mükemmel!'
    if (percentage >= 80) return 'Çok İyi!'
    if (percentage >= 70) return 'İyi!'
    if (percentage >= 60) return 'Orta'
    if (percentage >= 50) return 'Geçti'
    return 'Geliştirilmeli'
  }

  const correctAnswers = quizAttempt.answers.filter((answer) => answer.isCorrect).length
  const incorrectAnswers = quizAttempt.answers.filter((answer) => !answer.isCorrect).length

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50 to-white p-8 sm:p-12 shadow-xl">
          <div className="pointer-events-none absolute -left-10 top-12 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl"></div>
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl"></div>
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/20">
              <Trophy className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Test Tamamlandı!
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
              Tebrikler! Sonuçlarınızı aşağıdaki panellerden inceleyebilir, performansınızı değerlendirebilir ve dilerseniz testi tekrar çözebilirsiniz.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="pb-4 text-center">
              <div className={`text-5xl font-bold ${getScoreColor(quizAttempt.percentage)}`}>
                {quizAttempt.percentage.toFixed(1)}%
              </div>
              <CardDescription className={`text-sm font-semibold uppercase tracking-wider ${getScoreColor(quizAttempt.percentage)}`}>
                {getScoreMessage(quizAttempt.percentage)}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-semibold text-slate-900">
                {quizAttempt.score} / {quizAttempt.maxScore}
              </div>
              <p className="mt-1 text-sm text-slate-500">Toplam Puan</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="pb-4 text-center">
              <div className="text-5xl font-bold text-emerald-600">{correctAnswers}</div>
              <CardDescription className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Doğru Cevap
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-6 text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  {correctAnswers}
                </span>
                <span className="inline-flex items-center gap-2 text-rose-500">
                  <XCircle className="h-5 w-5" />
                  {incorrectAnswers}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Toplam {quizAttempt.answers.length} soru</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="pb-4 text-center">
              <div className="text-4xl font-bold text-indigo-600">{formatTime(quizAttempt.timeSpent)}</div>
              <CardDescription className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Süre
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm text-indigo-600">
                <Clock className="h-4 w-4" />
                Ortalama {Math.round(quizAttempt.timeSpent / Math.max(quizAttempt.answers.length, 1))} sn/soru
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Performans Özeti
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(quizAttempt.percentage / 20) ? 'text-amber-400 fill-current' : 'text-slate-200'}`}
                  />
                ))}
              </div>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Aldığınız puana göre yıldız kazanırsınız. Çubuğu doldurdukça yeni başarıların kilidi açılır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={quizAttempt.percentage} className="h-3" />
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Button
            variant="outline"
            onClick={() => setReviewMode(!reviewMode)}
            className="h-auto rounded-2xl border-slate-200 bg-white px-6 py-4 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
          >
            <Star className="mr-2 h-4 w-4" />
            {reviewMode ? 'Sonuçları Gizle' : 'Cevapları İncele'}
          </Button>
          <Button
            onClick={onRetry}
            className="h-auto rounded-2xl bg-blue-600 px-6 py-4 text-white shadow-sm hover:bg-blue-700"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Tekrar Çöz
          </Button>
          <Button
            onClick={onExit}
            variant="secondary"
            className="h-auto rounded-2xl border-slate-200 bg-slate-100 px-6 py-4 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </div>

        {reviewMode && (
          <Card className="mt-10 border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Cevap İncelemesi</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Tüm sorularınızı tek tek inceleyin, doğru ve yanlış cevaplarınızı kıyaslayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizAttempt.answers.map((answer, index) => {
                const normalizedQuestionImage = normalizeImageUrl(answer.question.imageUrl || '')
                const normalizedOptions = (() => {
                  if (answer.question.options && answer.question.options.length > 0) {
                    return answer.question.options.map((option) => ({
                      ...option,
                      text: option.text || '',
                      imageUrl: normalizeImageUrl(option.imageUrl || '')
                    }))
                  }

                  if (answer.question.type === 'TRUE_FALSE') {
                    return [
                      { text: 'Doğru', imageUrl: '' },
                      { text: 'Yanlış', imageUrl: '' }
                    ]
                  }

                  return []
                })()

                const answerStateClasses = answer.isCorrect
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-rose-200 bg-rose-50'

                return (
                  <div
                    key={answer.questionId}
                    className={`rounded-2xl border ${answerStateClasses} p-6 transition hover:shadow-md`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={answer.isCorrect ? 'border-emerald-200 bg-white text-emerald-600' : 'border-rose-200 bg-white text-rose-600'}>
                          Soru {index + 1}
                        </Badge>
                        <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-slate-700">
                          {answer.points} puan
                        </Badge>
                      </div>
                      {answer.isCorrect ? (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                          <CheckCircle className="h-5 w-5" />
                          Doğru
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600">
                          <XCircle className="h-5 w-5" />
                          Yanlış
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-base font-medium text-slate-900">
                      {answer.question.content}
                    </p>

                    {(answer.question.type === 'MULTIPLE_CHOICE' || answer.question.type === 'TRUE_FALSE' || answer.question.type === 'IMAGE') && normalizedQuestionImage && (
                      <button
                        type="button"
                        className="mt-4 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        onClick={() => handleImageClick(normalizedQuestionImage, 'Soru resmi')}
                      >
                        <img
                          src={normalizedQuestionImage}
                          alt="Soru resmi"
                          className="h-auto w-full cursor-zoom-in object-cover transition hover:opacity-90"
                          onError={(e) => {
                            const img = e.currentTarget
                            img.src = getFallbackImageUrl('question')
                          }}
                        />
                      </button>
                    )}

                    {(answer.question.type === 'MULTIPLE_CHOICE' || answer.question.type === 'TRUE_FALSE' || answer.question.type === 'IMAGE') && normalizedOptions.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {normalizedOptions.map((option, optionIndex) => {
                          const parsedSelectedIndex = Number.parseInt(answer.answer || '', 10)
                          const parsedCorrectIndex = Number.parseInt(answer.question.correctAnswer || '', 10)
                          const isSelected = !Number.isNaN(parsedSelectedIndex)
                            ? optionIndex === parsedSelectedIndex
                            : answer.answer === option.text
                          const isCorrect = !Number.isNaN(parsedCorrectIndex)
                            ? optionIndex === parsedCorrectIndex
                            : option.text === answer.question.correctAnswer

                          const optionClasses = isSelected
                            ? isCorrect
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                            : isCorrect
                            ? 'border-emerald-200 bg-white text-emerald-600'
                            : 'border-slate-200 bg-white text-slate-700'

                          return (
                            <div
                              key={optionIndex}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${optionClasses}`}
                            >
                              <span>
                                {String.fromCharCode(65 + optionIndex)}. {option.text || `Seçenek ${optionIndex + 1}`}
                              </span>
                              {option.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleImageClick(option.imageUrl, `Seçenek ${String.fromCharCode(65 + optionIndex)}`)}
                                  className="group relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-white"
                                >
                                  <img
                                    src={option.imageUrl}
                                    alt={`Seçenek ${String.fromCharCode(65 + optionIndex)}`}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                    onError={(e) => {
                                      const img = e.currentTarget
                                      img.src = getFallbackImageUrl('option')
                                    }}
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition group-hover:opacity-100">
                                    <ZoomIn className="h-4 w-4" />
                                  </span>
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {answer.question.type === 'TEXT' && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                          <p className="mb-2 font-semibold text-blue-600">Sizin Cevabınız</p>
                          <p className="text-slate-700">{answer.answer || 'Cevap verilmedi'}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                          <p className="mb-2 font-semibold text-emerald-600">Doğru Cevap</p>
                          <p className="text-slate-700">{answer.question.correctAnswer}</p>
                        </div>
                      </div>
                    )}

                    {!answer.isCorrect && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">
                          Doğru cevap: {
                            answer.question.type === 'TEXT'
                              ? answer.question.correctAnswer
                              : (() => {
                                  const parsedCorrectIndex = Number.parseInt(answer.question.correctAnswer || '', 10)
                                  if (!Number.isNaN(parsedCorrectIndex)) {
                                    return normalizedOptions[parsedCorrectIndex]?.text || '—'
                                  }
                                  return answer.question.correctAnswer
                                })()
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <ImageModal isOpen={isModalOpen} onClose={closeImageModal} imageUrl={selectedImageUrl} alt={selectedImageAlt} />
    </div>
  )
}
