'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, ChevronLeft, ChevronRight, Flag, ZoomIn } from 'lucide-react'
import { normalizeImageUrl, getFallbackImageUrl, isBlobUrl } from '@/lib/image-utils'
import { ImageModal } from '@/components/ui/image-modal'

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

  // Normalize image URLs to handle blob URLs
  const normalizedQuestionImage = normalizeImageUrl(currentQuestion.imageUrl || '')
  const normalizedOptions = currentQuestion.options.map(option => ({
    ...option,
    imageUrl: normalizeImageUrl(option.imageUrl || '')
  }))

  // Debug logging
  console.log('Current question:', currentQuestion)
  console.log('Original imageUrl:', currentQuestion.imageUrl)
  console.log('Normalized question image:', normalizedQuestionImage)
  console.log('Should show image:', (currentQuestion.type === 'IMAGE' || (currentQuestion.type === 'MULTIPLE_CHOICE' && normalizedQuestionImage)) && normalizedQuestionImage)

  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer)
          handleSubmit(true) // Auto-submit when time runs out
          return 0
        }
        return prev ? prev - 1 : null
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSubmit = (autoSubmit = false) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    onComplete(answers, timeSpent)
  }

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {quiz.title}
                </h1>
              </div>
              <p className="text-purple-300 text-sm sm:text-base">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  timeLeft < 300 
                    ? 'bg-red-500/20 border-red-500/50' 
                    : 'bg-blue-500/20 border-blue-500/50'
                }`}>
                  <Clock className={`h-5 w-5 ${timeLeft < 300 ? 'text-red-400' : 'text-blue-400'}`} />
                  <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-blue-400'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <button 
                onClick={onExit}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 bg-red-500/5 px-4 py-2"
              >
                Çıkış
              </button>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-purple-300 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="text-white font-medium">Soru {currentQuestionIndex + 1}</span>
                  <span className="text-purple-400">/ {quiz.questions.length}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">
                  <span className="text-white font-medium">Cevaplanan:</span>
                  <span className="text-green-400 font-medium">{getAnsweredCount()}</span>
                  <span className="text-purple-400">/ {quiz.questions.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">İlerleme:</span>
                <span className="text-purple-400">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3 bg-white/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" 
                   style={{ width: `${progress}%`, clipPath: 'inset(0 0 0 0)' }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="xl:col-span-3">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={`${getDifficultyColor(currentQuestion.difficulty)} border-0 font-medium px-3 py-1`}>
                      {currentQuestion.difficulty === 'EASY' ? 'Kolay' : 
                       currentQuestion.difficulty === 'MEDIUM' ? 'Orta' : 'Zor'}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 font-medium px-3 py-1">
                      {currentQuestion.points} Puan
                    </Badge>
                    <Badge variant="outline" className="border-white/30 text-purple-300 font-medium px-3 py-1">
                      Soru {currentQuestionIndex + 1}
                    </Badge>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 px-3 py-2 ${
                      flaggedQuestions.has(currentQuestion.id) 
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-white/10 border-white/20 text-purple-300 hover:bg-white/20'
                    } border`}
                  >
                    <Flag className="h-4 w-4" />
                    {flaggedQuestions.has(currentQuestion.id) ? 'İşaretlendi' : 'İşaretle'}
                  </button>
                </div>
                <CardTitle className="text-xl sm:text-2xl text-white leading-relaxed">
                  {currentQuestion.content}
                </CardTitle>
                {(currentQuestion.type === 'IMAGE' || (currentQuestion.type === 'MULTIPLE_CHOICE' && normalizedQuestionImage)) && normalizedQuestionImage && (
                  <div className="mt-4 group relative cursor-pointer" onClick={() => handleImageClick(normalizedQuestionImage, 'Soru resmi')}>
                    <img 
                      src={normalizedQuestionImage} 
                      alt="Soru resmi"
                      className="max-w-full h-auto rounded-lg border border-white/20 transition-transform duration-200 group-hover:scale-[1.02]"
                      onError={(e) => {
                        const img = e.currentTarget;
                        // If the image fails to load, use fallback
                        img.src = getFallbackImageUrl('question');
                        console.warn('Image failed to load, using fallback:', normalizedQuestionImage);
                      }}
                    />
                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleAnswerChange(currentQuestion.id, index.toString())}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          answers[currentQuestion.id] === index.toString()
                            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            answers[currentQuestion.id] === index.toString()
                              ? 'border-purple-400 bg-purple-400'
                              : 'border-white/40'
                          }`}>
                            {answers[currentQuestion.id] === index.toString() && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <Label className="text-white cursor-pointer flex-1">
                            <span className="font-bold text-purple-400 mr-2">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option.text}
                          </Label>
                          {normalizedOptions[index]?.imageUrl && (
                            <div className="ml-3 group relative cursor-pointer" onClick={(e) => {
                              e.stopPropagation()
                              handleImageClick(normalizedOptions[index].imageUrl, `Seçenek ${String.fromCharCode(65 + index)}`)
                            }}>
                              <img 
                                src={normalizedOptions[index].imageUrl} 
                                alt={`Seçenek ${String.fromCharCode(65 + index)}`}
                                className="w-16 h-16 object-cover rounded border border-white/20 transition-transform duration-200 group-hover:scale-110"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  // If the image fails to load, use fallback
                                  img.src = getFallbackImageUrl('option');
                                  console.warn('Option image failed to load, using fallback:', normalizedOptions[index]?.imageUrl);
                                }}
                              />
                              {/* Zoom Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                                <ZoomIn className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Doğru', 'Yanlış'].map((option, index) => (
                      <div 
                        key={index}
                        onClick={() => handleAnswerChange(currentQuestion.id, index.toString())}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] text-center ${
                          answers[currentQuestion.id] === index.toString()
                            ? index === 0 
                              ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20'
                              : 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            answers[currentQuestion.id] === index.toString()
                              ? index === 0 
                                ? 'border-green-400 bg-green-400'
                                : 'border-red-400 bg-red-400'
                              : 'border-white/40'
                          }`}>
                            {answers[currentQuestion.id] === index.toString() && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <Label className={`text-white cursor-pointer text-lg font-medium ${
                            answers[currentQuestion.id] === index.toString()
                              ? index === 0 ? 'text-green-400' : 'text-red-400'
                              : ''
                          }`}>
                            {option}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'TEXT' && (
                  <div className="relative">
                    <Textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Cevabınızı buraya yazın..."
                      rows={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-purple-400">
                      {answers[currentQuestion.id]?.length || 0} karakter
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'IMAGE' && (
                  <div className="relative">
                    <Textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Cevabınızı buraya yazın..."
                      rows={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-purple-400">
                      {answers[currentQuestion.id]?.length || 0} karakter
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <button
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 px-6 py-3 ${
                  currentQuestionIndex === 0
                    ? 'bg-white/5 border-white/10 text-purple-400 cursor-not-allowed'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                } border`}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Önceki Soru
              </button>

              <div className="flex items-center gap-2 text-sm text-purple-300">
                <span>{getAnsweredCount()} cevaplandı</span>
                <span>•</span>
                <span>{flaggedQuestions.size} işaretlendi</span>
              </div>

              <div className="flex gap-3">
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={goToNext}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-6 py-3 shadow-lg shadow-purple-500/25"
                  >
                    Sonraki Soru
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 px-6 py-3 shadow-lg shadow-green-500/25"
                  >
                    Testi Bitir
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="xl:col-span-1">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Soru Navigatörü
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Tüm sorulara hızlı erişim
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {quiz.questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`relative p-3 h-12 text-xs font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                        currentQuestionIndex === index
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                          : answers[question.id]
                            ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                            : flaggedQuestions.has(question.id)
                              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-white/10 border-white/20 text-purple-300 hover:bg-white/20'
                      } border`}
                    >
                      {index + 1}
                      {answers[question.id] && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                      {flaggedQuestions.has(question.id) && (
                        <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400">Cevaplandı</span>
                    </div>
                    <span className="text-white font-bold">{getAnsweredCount()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400">İşaretlendi</span>
                    </div>
                    <span className="text-white font-bold">{flaggedQuestions.size}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-400">Kalan</span>
                    </div>
                    <span className="text-white font-bold">{quiz.questions.length - getAnsweredCount()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm font-medium text-white mb-3">Test Özeti</div>
                  <div className="space-y-2 text-xs text-purple-300">
                    <div className="flex justify-between">
                      <span>Toplam Soru:</span>
                      <span className="text-white font-medium">{quiz.questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Süre:</span>
                      <span className="text-white font-medium">
                        {quiz.timeLimit ? `${quiz.timeLimit} dakika` : 'Sınırsız'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ortalama Puan:</span>
                      <span className="text-white font-medium">
                        {Math.round(quiz.questions.reduce((sum, q) => sum + q.points, 0) / quiz.questions.length)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={closeImageModal}
        imageUrl={selectedImageUrl}
        alt={selectedImageAlt}
      />
    </div>
  )
}