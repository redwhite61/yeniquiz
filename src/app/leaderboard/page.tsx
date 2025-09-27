'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileMenu } from '@/components/mobile-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Trophy, Medal, Award, User, ArrowLeft, Crown, Star, Zap, Menu, Settings } from 'lucide-react'

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
  1: 'bg-amber-100 text-amber-700 border-amber-200',
  2: 'bg-slate-100 text-slate-700 border-slate-200',
  3: 'bg-orange-100 text-orange-700 border-orange-200'
}

const getRankBadgeColor = (rank: number) => rankBadgeStyles[rank] ?? 'bg-blue-100 text-blue-700 border-blue-200'

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-emerald-600'
  if (percentage >= 70) return 'text-blue-600'
  if (percentage >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-7 w-7 text-amber-500" />
    case 2:
      return <Medal className="h-6 w-6 text-slate-400" />
    case 3:
      return <Award className="h-6 w-6 text-orange-500" />
    default:
      return <span className="text-base font-semibold text-slate-500">#{rank}</span>
  }
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, logout } = useAuth()
  const { isConnected } = useSocket()
  const [userScores, setUserScores] = useState<UserScore[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<UserScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavigation = (path: string) => {
    router.push(path)
  }

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border border-slate-200 bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">Erişim Engellendi</CardTitle>
            <CardDescription className="text-slate-500">
              Liderlik tablosunu görüntülemek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = '/')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfa
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 text-white shadow-inner">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">Liderlik Tablosu</h1>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Canlı
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">En başarılı öğrencileri ve sıralamanızı takip edin.</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <span className="sr-only">Hesap menüsünü aç</span>
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  {user.avatar ? (
                    <img
                      src={`${user.avatar}?t=${Date.now()}`}
                      alt="Profil resmi"
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = ''
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3">
                  {user.avatar ? (
                    <img
                      src={`${user.avatar}?t=${Date.now()}`}
                      alt="Profil resmi"
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.name || 'Quiz Kullanıcısı'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="mx-0" />
                <div className="py-2">
                  <DropdownMenuItem
                    onSelect={() => handleNavigation('/profile')}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 focus:bg-blue-50 focus:text-blue-700"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleNavigation('/leaderboard')}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 focus:bg-blue-50 focus:text-blue-700"
                  >
                    <Trophy className="h-4 w-4" />
                    Liderlik
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem
                      onSelect={() => handleNavigation('/admin')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 focus:bg-blue-50 focus:text-blue-700"
                    >
                      <Settings className="h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator className="mx-0" />
                <DropdownMenuItem
                  onSelect={() => logout()}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                >
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </span>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
              {user.avatar ? (
                <img
                  src={`${user.avatar}?t=${Date.now()}`}
                  alt="Profil resmi"
                  className="h-9 w-9 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = ''
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <User className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-semibold text-slate-900">En İyi Performanslar</h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            En başarılı öğrencileri ve kendi sıralamanızı görün.
          </p>
        </div>

        {currentUserRank && (
          <Card className="mb-12 border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-slate-900">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Sizin Sıralamanız
                </span>
                <Badge className={`${getRankBadgeColor(currentUserRank.rank)} border`}>{getRankIcon(currentUserRank.rank)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-slate-900">#{currentUserRank.rank}</div>
                  <div className="text-sm text-slate-500">Sıralama</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-slate-900">{currentUserRank.totalScore}</div>
                  <div className="text-sm text-slate-500">Toplam Puan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-slate-900">{currentUserRank.totalQuizzes}</div>
                  <div className="text-sm text-slate-500">Test Sayısı</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-semibold ${getScoreColor(currentUserRank.averagePercentage)}`}>
                    {currentUserRank.averagePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500">Başarı Oranı</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {userScores.slice(0, 3).map((userScore, index) => (
            <Card
              key={userScore.id}
              className={`transform border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                index === 0
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                  : index === 1
                  ? 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'
                  : 'border-orange-200 bg-gradient-to-br from-amber-50 to-rose-50'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="mb-4 flex justify-center">{getRankIcon(index + 1)}</div>
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/60 bg-white shadow-inner">
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
                          <User className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-xs font-bold text-slate-700 ${
                        index === 0
                          ? 'border-amber-300'
                          : index === 1
                          ? 'border-slate-300'
                          : 'border-orange-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-center text-xl font-semibold text-slate-900">
                  {userScore.name || userScore.email}
                </CardTitle>
                <CardDescription className="text-center text-slate-500">
                  {userScore.totalQuizzes} test çözüldü
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div className="text-3xl font-semibold text-slate-900">{userScore.totalScore}</div>
                  </div>
                  <div>
                    <div className={`text-lg font-semibold ${getScoreColor(userScore.averagePercentage)}`}>
                      {userScore.averagePercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500">Ortalama Başarı</div>
                  </div>
                  {index === 0 && (
                    <div className="flex items-center justify-center gap-1 text-amber-600">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-medium">Şampiyon</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Trophy className="h-5 w-5" />
              Tüm Sıralama
            </CardTitle>
            <CardDescription className="text-slate-500">
              Tüm kullanıcıların performans sıralaması
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {userScores.map((userScore, index) => (
                  <div
                    key={userScore.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
                      userScore.id === user.id
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
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
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {userScore.name || userScore.email}
                          {userScore.id === user.id && (
                            <Badge variant="secondary" className="ml-2 border-blue-200 bg-blue-50 text-xs text-blue-700">
                              Siz
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {userScore.totalQuizzes} test çözüldü • {userScore.averagePercentage.toFixed(1)}% ortalama
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-slate-900">{userScore.totalScore} puan</div>
                      <div className="text-sm text-slate-500">En iyi: {userScore.bestScore} puan</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-500 sm:px-6 lg:px-8">
          © 2024 QuizMaster. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
