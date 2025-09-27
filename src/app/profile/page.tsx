'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MobileMenu } from '@/components/mobile-menu'
import {
  User,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  ArrowLeft,
  BookOpen,
  Award,
  Star,
  Menu,
  Camera,
  X,
  Crown,
  Medal,
  BarChart3
} from 'lucide-react'

interface QuizAttempt {
  id: string
  score: number
  maxScore: number
  percentage: number
  timeSpent: number
  completedAt: string
  quiz: {
    id: string
    title: string
    description?: string
    category: {
      name: string
      color?: string
    }
  }
}

interface UserStats {
  totalQuizzes: number
  totalScore: number
  averagePercentage: number
  totalTimeSpent: number
  bestScore: number
  recentAttempts: QuizAttempt[]
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-emerald-600'
  if (percentage >= 70) return 'text-blue-600'
  if (percentage >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

const getScoreBadgeColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (percentage >= 70) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (percentage >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 90) return { level: 'Uzman', icon: <Crown className="h-4 w-4" />, color: 'text-amber-600' }
  if (percentage >= 70) return { level: 'İyi', icon: <Medal className="h-4 w-4" />, color: 'text-blue-600' }
  if (percentage >= 50) return { level: 'Orta', icon: <TrendingUp className="h-4 w-4" />, color: 'text-indigo-600' }
  return { level: 'Başlangıç', icon: <BarChart3 className="h-4 w-4" />, color: 'text-emerald-600' }
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/profile/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return

    setIsUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(null)

    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: avatarUrl })
      })

      if (response.ok) {
        await response.json()
        setAvatarSuccess('Profil resmi başarıyla güncellendi!')
        setPreviewAvatar(null)

        const updatedUser = { ...user, avatar: avatarUrl }
        localStorage.setItem('quizUser', JSON.stringify(updatedUser))
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: avatarUrl } }))

        setTimeout(() => setAvatarSuccess(null), 3000)
      } else if (response.status === 404) {
        setAvatarError('Kullanıcı hesabınız bulunamadı. Lütfen tekrar giriş yapın.')
        setTimeout(() => {
          localStorage.removeItem('quizUser')
          window.location.href = '/'
        }, 2000)
      } else {
        const errorData = await response.json()
        setAvatarError(errorData.error || 'Profil resmi güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
      setAvatarError('Profil resmi güncellenirken bir hata oluştu')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAvatarError('Lütfen bir resim dosyası seçin')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Dosya boyutu 5MB\'dan küçük olmalı')
      return
    }

    setAvatarError(null)
    setIsUploadingAvatar(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Resim yüklenirken bir hata oluştu')
      }

      const data = await response.json()
      await updateAvatar(data.url)
    } catch (err) {
      setAvatarError('Resim yüklenirken bir hata oluştu')
      console.error('Upload error:', err)
      setIsUploadingAvatar(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeAvatar = async () => {
    if (!user) return

    setIsUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(null)
    setPreviewAvatar(null)

    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: '' })
      })

      if (response.ok) {
        setAvatarSuccess('Profil resmi kaldırıldı!')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        const updatedUser = { ...user, avatar: undefined }
        localStorage.setItem('quizUser', JSON.stringify(updatedUser))
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: undefined } }))

        setTimeout(() => setAvatarSuccess(null), 3000)
      } else if (response.status === 404) {
        setAvatarError('Kullanıcı hesabınız bulunamadı. Lütfen tekrar giriş yapın.')
        setTimeout(() => {
          localStorage.removeItem('quizUser')
          window.location.href = '/'
        }, 2000)
      } else {
        const errorData = await response.json()
        setAvatarError(errorData.error || 'Profil resmi kaldırılırken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error removing avatar:', error)
      setAvatarError('Profil resmi kaldırılırken bir hata oluştu')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, user])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours} saat ${minutes} dakika`
    } else if (minutes > 0) {
      return `${minutes} dakika ${remainingSeconds} saniye`
    } else {
      return `${remainingSeconds} saniye`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin shadow-2xl"></div>
          <div className="absolute inset-0 h-20 w-20 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4">
        <Card className="w-full max-w-md backdrop-blur-xl border border-white/20 bg-white/80 shadow-2xl ring-1 ring-black/5">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Erişim Engellendi
            </CardTitle>
            <CardDescription className="text-slate-600 mt-3 text-base">
              Profilinizi görüntülemek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] py-3 text-base font-medium"
            >
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const membershipDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-900">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Advanced Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 shadow-xl backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => (window.location.href = '/')}
              className="group inline-flex items-center gap-3 rounded-2xl border border-white/30 bg-white/40 px-6 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl transition-all duration-300 hover:border-blue-200/50 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Ana Sayfa
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/25 ring-4 ring-blue-100/50">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Profilim
                </h1>
                <p className="text-sm text-slate-600">Test istatistiklerinizi ve geçmişinizi takip edin.</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right mr-4">
              <span className="block text-sm font-medium text-slate-800">{user.name || user.email}</span>
              <Badge className="mt-1 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium shadow-sm">
                {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="border-rose-200/50 text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 backdrop-blur-xl font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/10"
            >
              Çıkış
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/40 text-slate-700 backdrop-blur-xl transition-all duration-300 hover:border-blue-200/50 hover:bg-blue-50/50 hover:text-blue-700 hover:scale-[1.05]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin shadow-xl"></div>
              <div className="absolute inset-0 h-12 w-12 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-xl animate-pulse"></div>
            </div>
          </div>
        ) : userStats ? (
          <div className="space-y-12">
            {/* User Info Card - Ultra Premium Design */}
            <Card className="relative overflow-hidden border border-white/30 bg-gradient-to-br from-white/90 via-white/70 to-blue-50/30 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
              <CardHeader className="relative z-10 pb-8">
                <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl font-semibold">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                    <User className="h-6 w-6" />
                  </div>
                  Kullanıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex flex-col items-start gap-12 lg:flex-row lg:items-center">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-6">
                    <div
                      className="group relative cursor-pointer transition-all duration-500 hover:scale-105"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="relative overflow-hidden rounded-3xl border-4 border-white shadow-2xl ring-8 ring-blue-100/50 transition-all duration-500 group-hover:ring-blue-200/70">
                        <div className="h-40 w-40 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50">
                          {(previewAvatar || user.avatar) ? (
                            <img
                              src={`${previewAvatar || user.avatar}?t=${Date.now()}`}
                              alt="Profil resmi"
                              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                              onError={(e) => {
                                console.error('Avatar failed to load on profile page:', e.currentTarget.src)
                                e.currentTarget.src = ''
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
                              <User className="h-16 w-16 text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-slate-900/80 via-slate-900/60 to-transparent py-4 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:opacity-100">
                          <Camera className="h-5 w-5" />
                          Güncelle
                        </div>
                      </div>
                      {previewAvatar && (
                        <button
                          onClick={() => setPreviewAvatar(null)}
                          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-xl ring-2 ring-slate-100 transition-all duration-300 hover:scale-110 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] font-medium"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? 'Yükleniyor...' : 'Yeni Resim Seç'}
                      </Button>
                      {user.avatar && (
                        <Button
                          variant="ghost"
                          onClick={removeAvatar}
                          className="text-rose-600 hover:bg-rose-50 border border-rose-200/50 backdrop-blur-xl font-medium transition-all duration-300 hover:scale-[1.02]"
                          disabled={isUploadingAvatar}
                        >
                          Kaldır
                        </Button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    {avatarError && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                        {avatarError}
                      </div>
                    )}
                    {avatarSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
                        {avatarSuccess}
                      </div>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="grid flex-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-3xl font-semibold text-slate-900">{user.name || user.email}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium px-4 py-2 text-sm shadow-lg">
                          {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                        </Badge>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Üyelik: {membershipDate}
                        </span>
                      </div>
                      <p className="text-base text-slate-600 font-medium bg-slate-50 px-4 py-2 rounded-lg">{user.email}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                          <div className="p-2 rounded-lg bg-blue-500 text-white">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-lg">{userStats.totalQuizzes}</span>
                            <p className="text-sm text-slate-600">Test Tamamlandı</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                          <div className="p-2 rounded-lg bg-emerald-500 text-white">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-lg">{formatTime(userStats.totalTimeSpent)}</span>
                            <p className="text-sm text-slate-600">Toplam Süre</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
                          <div className="p-2 rounded-lg bg-amber-500 text-white">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-lg">{userStats.averagePercentage.toFixed(1)}%</span>
                            <p className="text-sm text-slate-600">Ortalama Başarı</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                          <div className="p-2 rounded-lg bg-purple-500 text-white">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-lg">{userStats.bestScore}</span>
                            <p className="text-sm text-slate-600">En Yüksek Puan</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards - Ultra Premium Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Total Score Card */}
              <Card className="group relative overflow-hidden border border-white/30 bg-gradient-to-br from-white/90 to-blue-50/50 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-slate-900 text-xl font-semibold">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl group-hover:shadow-blue-500/25 transition-all duration-500">
                      <Target className="h-6 w-6" />
                    </div>
                    Toplam Başarı
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium text-base">
                    Testlerden elde ettiğiniz genel puan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-5xl font-semibold text-slate-900 mb-4">{userStats.totalScore}</div>
                  <p className="text-sm text-slate-600 mb-6 font-medium">Toplam puanınız.</p>
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min((userStats.totalScore / 1000) * 100, 100)} 
                      className="h-3 bg-blue-100 shadow-inner [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500 [&>div]:shadow-lg" 
                    />
                    <div className="text-xs text-slate-500 text-right font-medium">
                      {Math.min((userStats.totalScore / 1000) * 100, 100).toFixed(1)}% tamamlandı
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Success Card */}
              <Card className="group relative overflow-hidden border border-white/30 bg-gradient-to-br from-white/90 to-emerald-50/50 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-slate-900 text-xl font-semibold">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl group-hover:shadow-emerald-500/25 transition-all duration-500">
                      <Award className="h-6 w-6" />
                    </div>
                    Ortalama Başarı
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium text-base">
                    Sınavlardaki ortalama performansınız.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className={`text-5xl font-semibold mb-4 ${getScoreColor(userStats.averagePercentage)}`}>
                    {userStats.averagePercentage.toFixed(1)}%
                  </div>
                  <p className="text-sm text-slate-600 mb-6 font-medium">Tüm denemelerdeki ortalama başarı.</p>
                  <div className={`inline-flex items-center gap-3 rounded-2xl border-2 px-5 py-3 text-base font-medium shadow-lg ${getScoreBadgeColor(userStats.averagePercentage)}`}>
                    <span className="text-xl">{getPerformanceLevel(userStats.averagePercentage).icon}</span>
                    <span className={getPerformanceLevel(userStats.averagePercentage).color}>
                      {getPerformanceLevel(userStats.averagePercentage).level}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Study Time Card */}
              <Card className="group relative overflow-hidden border border-white/30 bg-gradient-to-br from-white/90 to-amber-50/50 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-slate-900 text-xl font-semibold">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl group-hover:shadow-amber-500/25 transition-all duration-500">
                      <Clock className="h-6 w-6" />
                    </div>
                    Çalışma Süresi
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium text-base">
                    Testlerde harcadığınız toplam süre.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-semibold text-slate-900 mb-4">{formatTime(userStats.totalTimeSpent)}</div>
                  <p className="text-sm text-slate-600 font-medium">Düzenli çalışma başarıyı getirir.</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attempts - Ultra Premium Design */}
            <Card className="relative overflow-hidden border border-white/30 bg-gradient-to-br from-white/90 via-white/70 to-purple-50/30 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardHeader className="relative z-10 pb-8">
                <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl font-semibold">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg">
                    <Star className="h-6 w-6" />
                  </div>
                  Son Test Denemeleri
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium text-base">
                  Son çözdüğünüz testlerin detayları.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {userStats.recentAttempts.length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-16 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-xl">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-800 mb-3">Henüz test çözmediniz.</p>
                    <p className="text-base text-slate-600 mb-8 font-medium max-w-md mx-auto">İlk testinize başlayarak istatistiklerinizi oluşturmaya başlayın.</p>
                    <Button
                      onClick={() => (window.location.href = '/')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.05] py-4 px-8 text-lg font-medium"
                    >
                      Teste Başla
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userStats.recentAttempts.map((attempt) => {
                      const performance = getPerformanceLevel(attempt.percentage)

                      return (
                        <div
                          key={attempt.id}
                          className="group relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-white/90 to-slate-50/50 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-blue-200/50 hover:shadow-2xl hover:scale-[1.01]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative z-10">
                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
                              <div>
                                <h3 className="text-2xl font-semibold text-slate-900 mb-2">{attempt.quiz.title}</h3>
                                <p className="text-base text-slate-600 font-medium">
                                  {attempt.quiz.category.name} • {formatDate(attempt.completedAt)}
                                </p>
                              </div>
                              <div className={`inline-flex items-center gap-3 rounded-2xl border-2 px-5 py-3 text-base font-medium shadow-lg ${getScoreBadgeColor(attempt.percentage)}`}>
                                <span className="text-xl">{performance.icon}</span>
                                <span className={performance.color}>{performance.level}</span>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 text-center shadow-lg backdrop-blur-xl">
                                <p className="text-sm text-slate-600 font-medium mb-2">Puan</p>
                                <p className="text-2xl font-semibold text-slate-900">
                                  {attempt.score} / {attempt.maxScore}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-5 text-center shadow-lg backdrop-blur-xl">
                                <p className="text-sm text-slate-600 font-medium mb-2">Başarı</p>
                                <p className={`text-2xl font-semibold ${getScoreColor(attempt.percentage)}`}>
                                  {attempt.percentage.toFixed(1)}%
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-amber-50/30 p-5 text-center shadow-lg backdrop-blur-xl">
                                <p className="text-sm text-slate-600 font-medium mb-2">Süre</p>
                                <p className="text-2xl font-semibold text-slate-900">{formatTime(attempt.timeSpent)}</p>
                              </div>
                              <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-purple-50/30 p-5 text-center shadow-lg backdrop-blur-xl">
                                <p className="text-sm text-slate-600 font-medium mb-2">Kategori</p>
                                <p className="text-2xl font-semibold text-slate-900">{attempt.quiz.category.name}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-white/90 to-slate-50/50 p-16 text-center shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center shadow-xl">
              <X className="h-8 w-8 text-rose-500" />
            </div>
            <p className="text-2xl font-semibold text-slate-800 mb-3">Profil verileri yüklenemedi.</p>
            <p className="text-base text-slate-600 font-medium">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          </div>
        )}
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
