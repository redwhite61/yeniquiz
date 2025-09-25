'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
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
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Mükemmel!'
    if (percentage >= 80) return 'Çok İyi!'
    if (percentage >= 70) return 'İyi!'
    if (percentage >= 60) return 'Orta'
    if (percentage >= 50) return 'Geçti'
    return 'Geliştirilmeli'
  }

  const correctAnswers = quizAttempt.answers.filter(a => a.isCorrect).length
  const incorrectAnswers = quizAttempt.answers.filter(a => !a.isCorrect).length

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Celebration Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-sm opacity-75 animate-pulse"></div>
              <Trophy className="relative h-16 w-16 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
            Test Tamamlandı!
          </h1>
          <p className="text-xl text-purple-300 max-w-2xl mx-auto">
            Başarınızı kutluyoruz! Detaylı sonuçlarınız aşağıda
          </p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl transform hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className={`text-5xl sm:text-6xl font-bold mb-2 ${
                quizAttempt.percentage >= 90 ? 'text-green-400' :
                quizAttempt.percentage >= 70 ? 'text-blue-400' :
                quizAttempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {quizAttempt.percentage.toFixed(1)}%
              </div>
              <CardDescription className={`text-lg font-bold ${
                quizAttempt.percentage >= 90 ? 'text-green-400' :
                quizAttempt.percentage >= 70 ? 'text-blue-400' :
                quizAttempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {getScoreMessage(quizAttempt.percentage)}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                {quizAttempt.score} / {quizAttempt.maxScore}
              </div>
              <p className="text-sm text-purple-300">Toplam Puan</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl transform hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="text-5xl sm:text-6xl font-bold text-green-400 mb-2">
                {correctAnswers}
              </div>
              <CardDescription className="text-lg font-bold text-green-400">
                Doğru Cevap
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">{correctAnswers}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-medium">{incorrectAnswers}</span>
                </div>
              </div>
              <p className="text-sm text-purple-300 mt-3">
                Toplam {quizAttempt.answers.length} soru
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl transform hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="text-5xl sm:text-6xl font-bold text-purple-400 mb-2">
                {formatTime(quizAttempt.timeSpent)}
              </div>
              <CardDescription className="text-lg font-bold text-purple-400">
                Süre
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-purple-300">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Ortalama {Math.round(quizAttempt.timeSpent / quizAttempt.answers.length)} saniye/soru</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicator */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-white flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                Performans Göstergesi
              </span>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 transition-all duration-500 ${
                      i < Math.floor(quizAttempt.percentage / 20) 
                        ? 'text-yellow-400 fill-current animate-pulse' 
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Progress value={quizAttempt.percentage} className="h-4 bg-white/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" 
                   style={{ width: `${quizAttempt.percentage}%`, clipPath: 'inset(0 0 0 0)' }}></div>
            </div>
            <div className="flex justify-between text-sm text-purple-300 mt-4">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setReviewMode(!reviewMode)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 px-6 py-4 h-auto"
          >
            <Star className="h-4 w-4 mr-2" />
            {reviewMode ? 'Sonuçları Gizle' : 'Cevapları İncele'}
          </button>
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-4 h-auto shadow-lg shadow-blue-500/25"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Tekrar Çöz
          </button>
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-6 py-4 h-auto shadow-lg shadow-purple-500/25"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </button>
        </div>

        {/* Review Section */}
        {reviewMode && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                Cevap İncelemesi
              </CardTitle>
              <CardDescription className="text-purple-300 text-lg">
                Tüm soruları ve cevaplarınızı detaylı olarak inceleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizAttempt.answers.map((answer, index) => {
                // Normalize image URLs for this answer
                const normalizedQuestionImage = normalizeImageUrl(answer.question.imageUrl || '')
                const normalizedOptions = answer.question.options?.map(option => ({
                  ...option,
                  imageUrl: normalizeImageUrl(option.imageUrl || '')
                })) || []
                
                // Debug logging
                console.log('Review answer:', answer)
                console.log('Question imageUrl:', answer.question.imageUrl)
                console.log('Normalized question image:', normalizedQuestionImage)
                console.log('Should show image:', (answer.question.type === 'IMAGE' || (answer.question.type === 'MULTIPLE_CHOICE' && normalizedQuestionImage)) && normalizedQuestionImage)
                
                return (
                  <div key={answer.questionId} className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    answer.isCorrect 
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15' 
                      : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
                  }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${
                        answer.isCorrect 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                          : 'bg-red-500/20 text-red-400 border-red-500/50'
                      } border font-medium px-3 py-1`}>
                        Soru {index + 1}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 font-medium px-3 py-1">
                        {answer.points} puan
                      </Badge>
                    </div>
                    {answer.isCorrect ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-6 w-6" />
                        <span className="font-bold">Doğru</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="h-6 w-6" />
                        <span className="font-bold">Yanlış</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg font-medium text-white mb-4 leading-relaxed">
                    {answer.question.content}
                  </p>

                  {(answer.question.type === 'IMAGE' || (answer.question.type === 'MULTIPLE_CHOICE' && normalizedQuestionImage)) && normalizedQuestionImage && (
                    <div className="mb-4 group relative cursor-pointer" onClick={() => handleImageClick(normalizedQuestionImage, 'Soru resmi')}>
                      <img 
                        src={normalizedQuestionImage} 
                        alt="Soru resmi"
                        className="max-w-full h-auto rounded-lg border border-white/20 transition-transform duration-200 group-hover:scale-[1.02]"
                        onError={(e) => {
                          const img = e.currentTarget;
                          // If the image fails to load, use fallback
                          img.src = getFallbackImageUrl('question');
                          console.warn('Question image failed to load, using fallback:', normalizedQuestionImage);
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

                  {(answer.question.type === 'MULTIPLE_CHOICE' || answer.question.type === 'TRUE_FALSE') && normalizedOptions.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {normalizedOptions.map((option, optionIndex) => {
                        const isSelected = answer.answer === optionIndex.toString()
                        const isCorrect = answer.question.correctAnswer === optionIndex.toString()
                        
                        let bgColor = 'bg-white/5 border-white/20'
                        let textColor = 'text-purple-300'
                        
                        if (isSelected && isCorrect) {
                          bgColor = 'bg-green-500/20 border-green-500/50'
                          textColor = 'text-green-400'
                        }
                        if (isSelected && !isCorrect) {
                          bgColor = 'bg-red-500/20 border-red-500/50'
                          textColor = 'text-red-400'
                        }
                        if (!isSelected && isCorrect) {
                          bgColor = 'bg-green-500/10 border-green-500/30'
                          textColor = 'text-green-400'
                        }
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${bgColor}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${textColor}`}>
                                {String.fromCharCode(65 + optionIndex)}. {option.text}
                              </span>
                              {option.imageUrl && (
                                <div className="ml-2 group relative cursor-pointer" onClick={(e) => {
                                  e.stopPropagation()
                                  handleImageClick(option.imageUrl, `Seçenek ${String.fromCharCode(65 + optionIndex)}`)
                                }}>
                                  <img 
                                    src={option.imageUrl} 
                                    alt={`Seçenek ${String.fromCharCode(65 + optionIndex)}`}
                                    className="w-12 h-12 object-cover rounded border border-white/20 transition-transform duration-200 group-hover:scale-110"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      // If the image fails to load, use fallback
                                      img.src = getFallbackImageUrl('option');
                                      console.warn('Option image failed to load, using fallback:', option.imageUrl);
                                    }}
                                  />
                                  {/* Zoom Overlay */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                                    <ZoomIn className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {(answer.question.type === 'TEXT' || answer.question.type === 'IMAGE') && (
                    <div className="space-y-3 mb-4">
                      <div className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/10">
                        <div className="text-sm font-medium text-blue-400 mb-2">
                          Sizin Cevabınız:
                        </div>
                        <div className="text-white">{answer.answer || 'Cevap verilmedi'}</div>
                      </div>
                      <div className="p-4 rounded-xl border-2 border-green-500/30 bg-green-500/10">
                        <div className="text-sm font-medium text-green-400 mb-2">
                          Doğru Cevap:
                        </div>
                        <div className="text-white">{answer.question.correctAnswer}</div>
                      </div>
                    </div>
                  )}

                  {!answer.isCorrect && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">Doğru cevap: </span>
                        <span>
                          {answer.question.type === 'TEXT' || answer.question.type === 'IMAGE'
                            ? answer.question.correctAnswer
                            : answer.question.options && answer.question.options[parseInt(answer.question.correctAnswer)]?.text
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                )
              })}
            </CardContent>
          </Card>
        )}
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