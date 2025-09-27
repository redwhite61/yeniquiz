'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileMenu } from '@/components/mobile-menu'
import { Trophy, Medal, Award, User, ArrowLeft, Crown, Star, Zap, Menu, TrendingUp, BarChart3 } from 'lucide-react'

interface UserScore {
  id: string
  name: string
  email: string
  avatar?: string
  totalScore: number
  totalQuizzes: number
  averagePercentage: number
  bestScore: number
  rank: number
}

const rankBadgeStyles: Record<number, string> = {
  1: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-300 shadow-lg',
  2: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border-slate-300 shadow-md',
  3: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white border-orange-300 shadow-md'
}

const getRankBadgeColor = (rank: number) => rankBadgeStyles[rank] ?? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200'

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-emerald-600 font-semibold'
  if (percentage >= 70) return 'text-blue-600 font-semibold'
  if (percentage >= 50) return 'text-amber-600 font-semibold'
  return 'text-rose-600 font-semibold'
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-8 w-8 text-amber-400 drop-shadow-md" />
    case 2:
      return <Medal className="h-7 w-7 text-slate-300 drop-shadow" />
    case 3:
      return <Award className="h-7 w-7 text-orange-400 drop-shadow" />
    default:
      return <span className="text-lg font-bold text-slate-600">#{rank}</span>
  }
}

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { isConnected } = useSocket()
  const [userScores, setUserScores] = useState<UserScore[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<UserScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const data = await response.json()
        setUserScores(data.topUsers)
        setCurrentUserRank(data.currentUser)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeaderboard()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    const handleRefreshLeaderboard = () => {
      fetchLeaderboard()
    }

    window.addEventListener('refreshLeaderboard', handleRefreshLeaderboard)
    return () => {
      window.removeEventListener('refreshLeaderboard', handleRefreshLeaderboard)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border border-slate-200 bg-white shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Erişim Engellendi</CardTitle>
            <CardDescription className="text-slate-600">
              Liderlik tablosunu görüntülemek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300"
            >
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = '/')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfa
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-lg">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">Liderlik Tablosu</h1>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Canlı
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">En başarılı profesyonelleri ve sıralamanızı takip edin.</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-700">{user.name || user.email}</span>
              <Badge variant="secondary" className="border-blue-100 bg-blue-50 text-blue-700 font-medium">
                {user.role === 'ADMIN' ? 'Admin' : 'Profesyonel'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-slate-900">Profesyonel Performans Liderleri</h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            En başarılı profesyonelleri ve kendi sıralamanızı görün.
          </p>
        </div>

        {currentUserRank && (
          <Card className="mb-12 border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <span className="flex items-center gap-2 text-xl font-bold">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Sizin Performansınız
                </span>
                <Badge className={`${getRankBadgeColor(currentUserRank.rank)} border text-sm font-medium py-1.5 px-3`}>
                  {getRankIcon(currentUserRank.rank)}
                </Badge>
              </CardTitle>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900">#{currentUserRank.rank}</div>
                  <div className="text-sm text-slate-500 mt-1">Sıralama</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900">{currentUserRank.totalScore}</div>
                  <div className="text-sm text-slate-500 mt-1">Toplam Puan</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900">{currentUserRank.totalQuizzes}</div>
                  <div className="text-sm text-slate-500 mt-1">Test Sayısı</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className={`text-3xl font-bold ${getScoreColor(currentUserRank.averagePercentage)}`}>
                    {currentUserRank.averagePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Başarı Oranı</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-amber-500" />
              En İyi 3 Profesyonel
            </h3>
            <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-700">
              Zirve Performans
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userScores.slice(0, 3).map((userScore, index) => (
              <Card
                key={userScore.id}
                className={`transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${
                  index === 0
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg'
                    : index === 1
                    ? 'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md'
                    : 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md'
                }`}
              >
                <div className={`p-4 text-center ${
                  index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                  index === 1 ? 'bg-gradient-to-r from-slate-500 to-slate-600' : 
                  'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}>
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <h3 className="text-white font-bold text-lg">
                    {index === 0 ? 'Şampiyon' : index === 1 ? 'İkinci' : 'Üçüncü'}
                  </h3>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                        {userScore.avatar ? (
                          <img
                            src={`${userScore.avatar}?t=${Date.now()}`}
                            alt={userScore.name || userScore.email}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = ''
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200">
                            <User className="h-10 w-10 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-bold shadow-lg ${
                          index === 0
                            ? 'border-amber-300 text-amber-600'
                            : index === 1
                            ? 'border-slate-300 text-slate-600'
                            : 'border-orange-300 text-orange-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-center text-xl font-bold text-slate-900 mb-1">
                    {userScore.name || userScore.email}
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 mb-4">
                    {userScore.totalQuizzes} test çözüldü
                  </CardDescription>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      <div className="text-3xl font-bold text-slate-900">{userScore.totalScore}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getScoreColor(userScore.averagePercentage)}`}>
                        {userScore.averagePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-500">Ortalama Başarı</div>
                    </div>
                    {index === 0 && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <span className="text-amber-600 font-medium">Lider Performans</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-6 w-6 text-amber-400" />
              Profesyonel Sıralama
            </CardTitle>
            <CardDescription className="text-slate-300">
              Tüm profesyonellerin performans sıralaması
            </CardDescription>
          </div>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Veriler yükleniyor...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userScores.map((userScore, index) => (
                  <div
                    key={userScore.id}
                    className={`flex items-center justify-between rounded-xl border p-5 transition-all duration-200 ${
                      userScore.id === user.id
                        ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-sm">
                        {userScore.avatar ? (
                          <img
                            src={`${userScore.avatar}?t=${Date.now()}`}
                            alt={userScore.name || userScore.email}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = ''
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">
                          {userScore.name || userScore.email}
                          {userScore.id === user.id && (
                            <Badge variant="secondary" className="ml-2 border-blue-200 bg-blue-50 text-blue-700 font-medium">
                              Siz
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <span>{userScore.totalQuizzes} test çözüldü</span>
                          <span className="text-slate-300">•</span>
                          <span className={getScoreColor(userScore.averagePercentage)}>{userScore.averagePercentage.toFixed(1)}% ortalama</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{userScore.totalScore} puan</div>
                      <div className="text-sm text-slate-500">En iyi: {userScore.bestScore} puan</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-300 sm:px-6 lg:px-8">
          <p className="font-medium">© 2024 QuizMaster. Tüm hakları saklıdır.</p>
          <p className="mt-2 text-sm text-slate-400">Profesyonel Performans Değerlendirme Platformu</p>
        </div>
      </footer>
    </div>
  )
}
