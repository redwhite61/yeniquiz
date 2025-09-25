'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileMenu } from '@/components/mobile-menu'
import { Trophy, Medal, Award, User, ArrowLeft, Crown, Star, Zap, Menu, Search } from 'lucide-react'

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

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { isConnected, requestLeaderboardUpdate } = useSocket()
  const [userScores, setUserScores] = useState<UserScore[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<UserScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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

  // Listen for real-time leaderboard updates
  useEffect(() => {
    const handleRefreshLeaderboard = () => {
      console.log('Refreshing leaderboard due to real-time update')
      fetchLeaderboard()
    }

    window.addEventListener('refreshLeaderboard', handleRefreshLeaderboard)
    
    return () => {
      window.removeEventListener('refreshLeaderboard', handleRefreshLeaderboard)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Erişim Engellendi</CardTitle>
            <CardDescription className="text-purple-300">
              Liderlik tablosunu görüntülemek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-400" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />
      case 3:
        return <Award className="h-6 w-6 text-amber-500" />
      default:
        return <span className="text-lg font-bold text-purple-300">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400'
      case 2:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400'
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400'
      default:
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400'
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 70) return 'text-blue-400'
    if (percentage >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Erişim Engellendi</CardTitle>
            <CardDescription className="text-purple-300">
              Liderlik tablosunu görüntülemek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Menu Component */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => window.location.href = '/'} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-200 bg-green-500/5 px-4 py-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfa
              </button>
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-400 mr-2" />
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Liderlik Tablosu</h1>
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Canlı</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-300" />
              <span className="text-purple-200">{user.name || user.email}</span>
              <Badge variant="secondary" className="bg-purple-600 text-white border-purple-500">
                {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
              </Badge>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-5xl font-bold text-white mb-4">En İyi Performanslar</h2>
          <p className="text-xl text-purple-300 max-w-2xl mx-auto">
            En başarılı öğrencileri ve kendi sıralamanızı görün
          </p>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <Card className="mb-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-2 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  Sizin Sıralamanız
                </span>
                <Badge className={getRankBadgeColor(currentUserRank.rank)}>
                  {getRankIcon(currentUserRank.rank)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    #{currentUserRank.rank}
                  </div>
                  <div className="text-sm text-purple-300">Sıralama</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {currentUserRank.totalScore}
                  </div>
                  <div className="text-sm text-purple-300">Toplam Puan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {currentUserRank.totalQuizzes}
                  </div>
                  <div className="text-sm text-purple-300">Test Sayısı</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(currentUserRank.averagePercentage)}`}>
                    {currentUserRank.averagePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-300">Başarı Oranı</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Users Podium */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {userScores.slice(0, 3).map((userScore, index) => (
            <Card 
              key={userScore.id} 
              className={`text-center backdrop-blur-xl border-2 transform transition-all duration-300 hover:scale-105 ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 shadow-2xl shadow-yellow-500/20' 
                  : index === 1 
                  ? 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30 shadow-xl shadow-gray-500/20' 
                  : 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30 shadow-lg shadow-amber-500/20'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-4">
                  {getRankIcon(index + 1)}
                </div>
                
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 bg-white/10 backdrop-blur-sm">
                      {userScore.avatar ? (
                        <img 
                          src={`${userScore.avatar}?t=${Date.now()}`} 
                          alt={userScore.name || userScore.email}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ''
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          <User className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                    </div>
                    {/* Rank Badge */}
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      index === 0 
                        ? 'bg-yellow-500 border-yellow-300 text-white' 
                        : index === 1 
                        ? 'bg-gray-500 border-gray-300 text-white' 
                        : 'bg-amber-500 border-amber-300 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                </div>
                
                <CardTitle className={`text-xl ${index === 0 ? 'text-yellow-300' : index === 1 ? 'text-gray-300' : 'text-amber-300'}`}>
                  {userScore.name || userScore.email}
                </CardTitle>
                <CardDescription className="text-purple-300 font-medium">
                  {userScore.totalQuizzes} test çözüldü
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <div className="text-3xl font-bold text-white">{userScore.totalScore}</div>
                  </div>
                  <div>
                    <div className={`text-lg font-semibold ${getScoreColor(userScore.averagePercentage)}`}>
                      {userScore.averagePercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-300">Ortalama Başarı</div>
                  </div>
                  {index === 0 && (
                    <div className="flex items-center justify-center space-x-1">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400 font-medium">Şampiyon</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              Tüm Sıralama
            </CardTitle>
            <CardDescription className="text-purple-300">
              Tüm kullanıcıların performans sıralaması
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {userScores.map((userScore, index) => (
                  <div
                    key={userScore.id}
                    className={`flex items-center justify-between p-4 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                      userScore.id === user?.id 
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 shadow-lg' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      {/* Profile Picture */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 backdrop-blur-sm flex-shrink-0">
                        {userScore.avatar ? (
                          <img 
                            src={`${userScore.avatar}?t=${Date.now()}`} 
                            alt={userScore.name || userScore.email}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = ''
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <User className="w-4 h-4 text-purple-400" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-white">
                          {userScore.name || userScore.email}
                          {userScore.id === user?.id && (
                            <Badge variant="secondary" className="ml-2 bg-purple-600 text-white border-purple-500 text-xs">
                              Siz
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-purple-300">
                          {userScore.totalQuizzes} test çözüldü • {userScore.averagePercentage.toFixed(1)}% ortalama
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-white">{userScore.totalScore} puan</div>
                      <div className="text-sm text-purple-300">
                        En iyi: {userScore.bestScore} puan
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-xl border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-purple-300">
              © 2024 QuizMaster. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}