'use client'

import React, { useState, useEffect } from 'react'
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
import { MobileMenu } from '@/components/mobile-menu'
import { 
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

  const startQuiz = async (quizId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (response.ok) {
        const quizData = await response.json()
        
        // Transform the data structure to match what QuizTaking expects
        const transformedQuiz = {
          ...quizData,
          questions: quizData.questions.map((qq: any) => ({
            ...qq.question,
            order: qq.order
          }))
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
      startQuiz(quizAttempt.quizId)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Quiz Platform</h1>
            <p className="text-purple-300">Online test ve sınav platformu</p>
          </div>
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Menu Component */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Top Navbar */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    QuizMaster
                  </h1>
                  <p className="text-xs text-purple-300 -mt-1">Akıllı Test Platformu</p>
                </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Kategori veya test ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80 bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
              
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-10 hover:bg-white/10 text-white relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                  {user.avatar ? (
                    <img 
                      src={`${user.avatar}?t=${Date.now()}`} 
                      alt="Profil resmi"
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
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
                    <User className="h-5 w-5 text-purple-200" />
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-white font-medium">{user.name || user.email}</span>
                  <Badge variant="secondary" className="ml-2 text-xs bg-purple-600 text-white border-purple-500">
                    {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                  </Badge>
                </div>
              </div>
              {user.role === 'ADMIN' && (
                <button 
                  onClick={() => window.location.href = '/admin'}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5 px-4 py-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Admin Panel</span>
                </button>
              )}
              <button 
                onClick={() => window.location.href = '/leaderboard'}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5 px-4 py-2"
              >
                <Trophy className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Liderlik</span>
              </button>
              <button 
                onClick={() => window.location.href = '/profile'}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5 px-4 py-2"
              >
                <User className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Profil</span>
              </button>
              <button 
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 bg-red-500/5 px-4 py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Çıkış</span>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                  )}
                </button>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Kategori veya test ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                🚀 Yeni Nesil Test Platformu
              </Badge>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Bilgiyi
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {" Keşfet"}
              </span>
              <br />
              Başarıyı
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {" Yakala"}
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Kişiselleştirilmiş testler, anlık istatistikler ve interaktif öğrenme deneyimiyle 
              potansiyelini ortaya çıkar. Binlerce soru arasında kendini test et!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 w-full sm:w-auto h-12 text-base"
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="h-5 w-5 mr-2" />
                Teste Başla
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg backdrop-blur-sm w-full sm:w-auto h-12 text-base"
                onClick={() => window.location.href = '/leaderboard'}
              >
                <Trophy className="h-5 w-5 mr-2" />
                Liderlik Tablosu
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completed Tests Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 group hover:bg-white/15">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    {userStats.completedTests}
                  </div>
                  <div className="text-sm text-purple-300">Tamamlandı</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Test Çözümü</span>
                  <span className="font-medium text-white">
                    {userStats.completedTests === 0 ? 'Başlayın' : 'Devam edin'}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(userStats.completedTests * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 group hover:bg-white/15">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    {userStats.successRate}%
                  </div>
                  <div className="text-sm text-purple-300">Başarı Oranı</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Performans</span>
                  <span className="font-medium text-white">
                    {userStats.successRate >= 80 ? 'Mükemmel' : 
                     userStats.successRate >= 60 ? 'İyi' : 
                     userStats.successRate >= 40 ? 'Orta' : 'Geliştir'}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Ranking Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 group hover:bg-white/15">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                    #{userStats.ranking}
                  </div>
                  <div className="text-sm text-purple-300">Sıralama</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Liderlik</span>
                  <span className="font-medium text-white">
                    {userStats.ranking === '-' ? 'Henüz yok' : userStats.ranking === '1' ? '1. Sırada!' : `${userStats.ranking}. sırada`}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.ranking === '-' ? 0 : Math.max(100 - (parseInt(userStats.ranking) * 5), 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Kategoriler</h2>
            <p className="text-xl text-purple-300 max-w-2xl mx-auto">
              Farklı alanlarda uzmanlaşmış test kategorileri arasından seçim yapın
            </p>
          </div>

          {!selectedCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || '#8B5CF6' }}
                        />
                        <CardTitle className="text-white group-hover:text-purple-200 transition-colors">
                          {category.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-purple-600 text-white border-purple-500">
                        {category._count.quizzes} test
                      </Badge>
                    </div>
                    {category.description && (
                      <CardDescription className="text-purple-300">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-purple-300">
                      <span>{category._count.questions} soru</span>
                      <span className="group-hover:text-white transition-colors">Testleri gör →</span>
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
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-200 bg-cyan-500/5 px-4 py-2 mr-4"
                >
                  ← Geri
                </button>
                <h3 className="text-2xl font-bold text-white">
                  {categories.find(c => c.id === selectedCategory)?.name} Testleri
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{quiz.title}</CardTitle>
                        <Badge variant="secondary" className="bg-purple-600 text-white border-purple-500">
                          {quiz._count.questions} soru
                        </Badge>
                      </div>
                      {quiz.description && (
                        <CardDescription className="text-purple-300">
                          {quiz.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">Kategori</span>
                          <Badge variant="outline" className="border-white/30 text-white">
                            {quiz.category.name}
                          </Badge>
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-300">Süre Limiti</span>
                            <span className="text-white">{quiz.timeLimit} dakika</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">Deneme Sayısı</span>
                          <span className="text-white">{quiz._count.attempts}</span>
                        </div>
                        <button
                          onClick={() => startQuiz(quiz.id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-4 py-2"
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
      <footer className="bg-black/30 backdrop-blur-xl border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-purple-300">
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