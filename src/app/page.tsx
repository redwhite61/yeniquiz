'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { QuizTaking } from '@/components/quiz/quiz-taking'
import { QuizResults } from '@/components/quiz/quiz-results'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
import { NotificationPanel } from '@/components/notification-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MobileMenu } from '@/components/mobile-menu'
import { 
  ArrowRight,
  BookOpen,
  Trophy,
  User,
  LogOut,
  Plus,
  Play,
  Search,
  Settings,
  HelpCircle,
  Clock,
  Home,
  BarChart3,
  Award,
  Users,
  ShieldCheck,
  ChevronDown,
  Menu,
  Bell
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  _count: {
    quizzes: number
    questions: number
  }
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  categoryId: string
  category: {
    name: string
    color?: string
  }
  _count: {
    questions: number
    attempts: number
  }
}

export default function Home() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [quizAttempt, setQuizAttempt] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userStats, setUserStats] = useState({
    completedTests: 0,
    successRate: 0,
    ranking: '-'
  })
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { user, logout, isLoading: authLoading } = useAuth()
  const { 
    isConnected, 
    unreadNotificationsCount, 
    sendQuizCompletion, 
    sendRankChange,
    sendNewTestCreated 
  } = useSocket()

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchUserStats = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/user/stats?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserStats({
          completedTests: data.completedTests,
          successRate: data.successRate,
          ranking: data.ranking
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchData = async () => {
    await Promise.all([fetchCategories(), fetchQuizzes()])
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const shuffleArray = <T,>(items: T[]): T[] => {
    const shuffled = [...items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const startQuiz = async (quizId: string, options: { shuffle?: boolean } = {}) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (response.ok) {
        const quizData = await response.json()

        // Transform the data structure to match what QuizTaking expects
        const transformedQuestions = quizData.questions.map((qq: any) => ({
          ...qq.question,
          order: qq.order
        }))

        const normalizedQuestions = options.shuffle
          ? shuffleArray(transformedQuestions).map((question: any, index: number) => ({
              ...question,
              order: index + 1
            }))
          : transformedQuestions

        const transformedQuiz = {
          ...quizData,
          questions: normalizedQuestions
        }

        console.log('Original quiz data:', quizData)
        console.log('Transformed quiz data:', transformedQuiz) // Debug log
        console.log('First question image URL:', transformedQuiz.questions[0]?.imageUrl)
        setCurrentQuiz(transformedQuiz)
      }
    } catch (error) {
      console.error('Error starting quiz:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitQuiz = async (answers: Record<string, string>, timeSpent: number) => {
    if (!user || !currentQuiz) return

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          userId: user.id,
          answers,
          timeSpent,
          startedAt: new Date(Date.now() - timeSpent * 1000).toISOString()
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizAttempt(data.quizAttempt)
        
        // Send real-time notification for quiz completion
        sendQuizCompletion({
          userId: user.id,
          userName: user.name || user.email,
          score: data.quizAttempt.score,
          maxScore: data.quizAttempt.maxScore,
          percentage: data.quizAttempt.percentage,
          quizId: currentQuiz.id,
          quizTitle: currentQuiz.title
        })
        
        // Send rank change notification if rank improved
        if (data.rankData?.improved && data.rankData?.oldRank && data.rankData?.newRank) {
          sendRankChange({
            userId: user.id,
            userName: user.name || user.email,
            oldRank: data.rankData.oldRank,
            newRank: data.rankData.newRank,
            passedUserId: data.rankData.passedUser?.id,
            passedUserName: data.rankData.passedUser?.name
          })
        }
        
        setCurrentQuiz(null)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    }
  }

  const exitQuiz = () => {
    setCurrentQuiz(null)
  }

  const retryQuiz = () => {
    if (quizAttempt) {
      startQuiz(quizAttempt.quizId, { shuffle: true })
      setQuizAttempt(null)
    }
  }

  const exitResults = () => {
    setQuizAttempt(null)
    fetchData()
    fetchUserStats() // Refresh user stats after completing a quiz
  }

  // Load data when user is logged in
  React.useEffect(() => {
    if (user && !currentQuiz && !quizAttempt) {
      fetchData()
    }
  }, [user, currentQuiz, quizAttempt])

  // Separate useEffect for user stats to ensure it's always called when user changes
  React.useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || quiz.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (currentQuiz) {
    return (
      <QuizTaking
        quiz={currentQuiz}
        onComplete={submitQuiz}
        onExit={exitQuiz}
      />
    )
  }

  if (quizAttempt) {
    return (
      <QuizResults
        quizAttempt={quizAttempt}
        onRetry={retryQuiz}
        onExit={exitResults}
      />
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-40 w-40 -translate-y-1/2 rounded-full bg-indigo-100/60 blur-3xl" />
        </div>
        <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
            <div className="space-y-8">
              <Badge className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Yeni nesil quiz platformu
              </Badge>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Kurumsal testlerinizi dakikalar içinde hazırlayın.
                </h1>
                <p className="text-lg text-slate-600">
                  QuizMaster ile ekiplerinizi eğitin, sertifikasyonları yönetin ve canlı liderlik tabloları ile motivasyonu yüksek tutun.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-indigo-100 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Güçlü güvenlik</p>
                      <p className="text-sm text-slate-500">Rol tabanlı yetkilendirme ve detaylı log kayıtları.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-indigo-100 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Canlı raporlama</p>
                      <p className="text-sm text-slate-500">Kişi bazlı skor kartları ve gelişim trendleri.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-indigo-100 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Hızlı kurulum</p>
                      <p className="text-sm text-slate-500">Hazır şablonlar ve sürükle-bırak soru oluşturma.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-indigo-100 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Takım ruhu</p>
                      <p className="text-sm text-slate-500">İster bireysel ister takım bazlı yarışmalar oluşturun.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-tr from-blue-200/60 via-indigo-200/50 to-purple-200/60 blur-3xl" />
              <div className="relative">
                {isLogin ? (
                  <LoginForm onToggleMode={() => setIsLogin(false)} />
                ) : (
                  <RegisterForm onToggleMode={() => setIsLogin(true)} />
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-3xl border border-white/70 bg-white/60 px-6 py-4 text-sm text-slate-600 shadow-lg shadow-indigo-100 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  12K+ başarı rozetleri dağıtıldı
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  350+ aktif sınav yayında
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Menu Component */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Top Navbar */}
      <header className="bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-inner">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-slate-900">QuizMaster</h1>
                <p className="text-xs text-slate-500 -mt-0.5">Akıllı Test Platformu</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Kategori veya test ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 size-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-sm">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <span className="sr-only">Hesap seçeneklerini aç</span>
                    <div className="relative">
                      <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                      {user.avatar ? (
                        <img
                          src={`${user.avatar}?t=${Date.now()}`}
                          alt="Profil resmi"
                          className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                          onError={(e) => {
                            console.error('Avatar failed to load on homepage:', e.currentTarget.src)
                            e.currentTarget.src = ''
                            e.currentTarget.style.display = 'none'
                          }}
                          onLoad={(e) => {
                            console.log('Avatar loaded successfully on homepage:', e.currentTarget.src)
                          }}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-900">
                        {user.name || user.email}
                      </span>
                      <Badge variant="secondary" className="mt-0.5 w-fit border-blue-100 bg-blue-50 text-xs text-blue-700">
                        {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                  <DropdownMenuLabel>Hızlı Erişim</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem onSelect={() => handleNavigation('/admin')}>
                      <Settings className="h-4 w-4 text-slate-500" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => handleNavigation('/leaderboard')}>
                    <Trophy className="h-4 w-4 text-slate-500" />
                    Liderlik
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 text-slate-500" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
                    <LogOut className="h-4 w-4" />
                    Çıkış
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 size-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold shadow-sm">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 size-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 size-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Kategori veya test ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completed Tests Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-slate-900">
                    {userStats.completedTests}
                  </div>
                  <div className="text-sm text-slate-500">Tamamlanan Test</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Test Aktivitesi</span>
                  <span className="font-medium text-slate-900">
                    {userStats.completedTests === 0 ? 'Başlayın' : 'Devam edin'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(userStats.completedTests * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-slate-900">
                    {userStats.successRate}%
                  </div>
                  <div className="text-sm text-slate-500">Başarı Oranı</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Performans Düzeyi</span>
                  <span className="font-medium text-slate-900">
                    {userStats.successRate >= 80 ? 'Mükemmel' :
                     userStats.successRate >= 60 ? 'İyi' :
                     userStats.successRate >= 40 ? 'Orta' : 'Geliştir'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Ranking Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-slate-900">
                    #{userStats.ranking}
                  </div>
                  <div className="text-sm text-slate-500">Sıralama</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Liderlik Durumu</span>
                  <span className="font-medium text-slate-900">
                    {userStats.ranking === '-' ? 'Henüz yok' : userStats.ranking === '1' ? '1. Sırada!' : `${userStats.ranking}. sırada`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.ranking === '-' ? 0 : Math.max(100 - (parseInt(userStats.ranking) * 5), 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 sm:p-10 lg:p-12 shadow-xl border border-slate-200 lg:col-span-7">
              <div
                className="absolute inset-y-0 right-0 hidden md:block"
                aria-hidden
              >
                <div className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 blur-3xl opacity-70"></div>
              </div>
              <div className="relative max-w-xl">
                <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-4 py-2 mb-6 border border-blue-100">
                  <span className="text-sm font-medium">🚀 Yeni Nesil Test Platformu</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
                  Bilgiyi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">Keşfet</span>, Başarıyı
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600"> Yakala</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                  Kişiselleştirilmiş testler, anlık istatistikler ve modern raporlarla öğrenme deneyimini profesyonel seviyeye taşıyın.
                  QuizMaster ile hedeflerinize ulaşmak için ihtiyacınız olan tüm araçları tek bir yerde keşfedin.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 shadow-lg hover:shadow-xl"
                    onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="h-5 w-5" />
                    Teste Başla
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 px-8 py-3 shadow-sm"
                    onClick={() => window.location.href = '/leaderboard'}
                  >
                    <Trophy className="h-5 w-5" />
                    Liderlik Tablosu
                  </button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 grid gap-6">
              <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8 flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
                    <Play className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Teste hemen başlayın</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      İlginizi çeken kategorileri seçin, dinamik sorularla bilgilerinizi ölçün ve güçlü raporlarla gelişiminizi takip edin.
                    </p>
                  </div>
                </div>
                <button
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Teste Başla
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8 flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Liderlik tablosuna göz atın</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Skorunuzu toplulukla karşılaştırın, başarı rozetlerini toplayın ve hedeflerinize ulaşmak için motivasyon sağlayın.
                    </p>
                  </div>
                </div>
                <button
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => router.push('/leaderboard')}
                >
                  Liderlik Tablosu
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-slate-900 mb-4">Kategoriler</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Farklı alanlarda uzmanlaşmış test kategorileri arasından seçim yapın
            </p>
          </div>

          {!selectedCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer bg-white border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full ring-2 ring-slate-100"
                          style={{ backgroundColor: category.color || '#8B5CF6' }}
                        />
                        <CardTitle className="text-slate-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                        {category._count.quizzes} test
                      </Badge>
                    </div>
                    {category.description && (
                      <CardDescription className="text-slate-500">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{category._count.questions} soru</span>
                      <span className="group-hover:text-blue-600 transition-colors">Testleri gör →</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBackToCategories}
                  className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 px-5 py-2 mr-4"
                >
                  ← Geri
                </button>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {categories.find(c => c.id === selectedCategory)?.name} Testleri
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="bg-white border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-900">{quiz.title}</CardTitle>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                          {quiz._count.questions} soru
                        </Badge>
                      </div>
                      {quiz.description && (
                        <CardDescription className="text-slate-500">
                          {quiz.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Kategori</span>
                          <Badge variant="outline" className="border-blue-100 text-blue-600">
                            {quiz.category.name}
                          </Badge>
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Süre Limiti</span>
                            <span className="text-slate-900">{quiz.timeLimit} dakika</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Deneme Sayısı</span>
                          <span className="text-slate-900">{quiz._count.attempts}</span>
                        </div>
                        <button
                          onClick={() => startQuiz(quiz.id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2"
                        >
                          {isLoading ? 'Yükleniyor...' : 'Teste Başla'}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-500">
              © 2024 QuizMaster. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </div>
  )
}