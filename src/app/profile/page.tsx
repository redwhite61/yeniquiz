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
  X
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
  if (percentage >= 90) return { level: 'Uzman', icon: '🏆', color: 'text-amber-600' }
  if (percentage >= 70) return { level: 'İyi', icon: '⭐', color: 'text-blue-600' }
  if (percentage >= 50) return { level: 'Orta', icon: '📈', color: 'text-indigo-600' }
  return { level: 'Başlangıç', icon: '🌱', color: 'text-emerald-600' }
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
              Profilinizi görüntülemek için giriş yapmalısınız.
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

  const membershipDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'

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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-inner">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Profilim</h1>
                <p className="text-sm text-slate-500">Test istatistiklerinizi ve geçmişinizi takip edin.</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{user.name || user.email}</span>
            <Badge variant="secondary" className="border-blue-100 bg-blue-50 text-blue-700">
              {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
            </Badge>
            <Button
              variant="outline"
              onClick={logout}
              className="border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
            >
              Çıkış
            </Button>
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

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-semibold text-slate-900">Profilim</h2>
          <p className="text-lg text-slate-500">Başarı grafiğiniz, test geçmişiniz ve kişisel ayarlarınız tek ekranda.</p>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : userStats ? (
          <div className="space-y-8">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <User className="h-5 w-5" />
                  Kullanıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="group relative cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="relative overflow-hidden rounded-full border-4 border-white shadow-xl ring-4 ring-blue-100">
                        <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-100">
                          {(previewAvatar || user.avatar) ? (
                            <img
                              src={`${previewAvatar || user.avatar}?t=${Date.now()}`}
                              alt="Profil resmi"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.error('Avatar failed to load on profile page:', e.currentTarget.src)
                                e.currentTarget.src = ''
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                              <User className="h-12 w-12 text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-slate-900/60 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="h-4 w-4" />
                          Güncelle
                        </div>
                      </div>
                      {previewAvatar && (
                        <button
                          onClick={() => setPreviewAvatar(null)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? 'Yükleniyor...' : 'Yeni Resim Seç'}
                      </Button>
                      {user.avatar && (
                        <Button
                          variant="ghost"
                          onClick={removeAvatar}
                          className="text-rose-600 hover:bg-rose-50"
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
                    {avatarError && <p className="text-sm text-rose-600">{avatarError}</p>}
                    {avatarSuccess && <p className="text-sm text-emerald-600">{avatarSuccess}</p>}
                  </div>

                  <div className="grid flex-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{user.name || user.email}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <Badge variant="secondary" className="border-blue-100 bg-blue-50 text-blue-700">
                          {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                        </Badge>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          Üyelik tarihi: {membershipDate}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{user.email}</p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span>{userStats.totalQuizzes} test tamamlandı</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Toplam süre: {formatTime(userStats.totalTimeSpent)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span>Ortalama başarı: {userStats.averagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-blue-500" />
                        <span>En yüksek puan: {userStats.bestScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Target className="h-5 w-5 text-blue-500" />
                    Toplam Başarı
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Testlerden elde ettiğiniz genel puan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-semibold text-slate-900">{userStats.totalScore}</div>
                  <p className="mt-2 text-sm text-slate-500">Toplam puanınız.</p>
                  <Progress value={Math.min((userStats.totalScore / 1000) * 100, 100)} className="mt-4" />
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Award className="h-5 w-5 text-blue-500" />
                    Ortalama Başarı
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Sınavlardaki ortalama performansınız.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-semibold ${getScoreColor(userStats.averagePercentage)}`}>
                    {userStats.averagePercentage.toFixed(1)}%
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Tüm denemelerdeki ortalama başarı.</p>
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${getScoreBadgeColor(userStats.averagePercentage)}`}>
                    {getPerformanceLevel(userStats.averagePercentage).icon}
                    <span className={getPerformanceLevel(userStats.averagePercentage).color}>
                      {getPerformanceLevel(userStats.averagePercentage).level}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Çalışma Süresi
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Testlerde harcadığınız toplam süre.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-semibold text-slate-900">{formatTime(userStats.totalTimeSpent)}</div>
                  <p className="mt-2 text-sm text-slate-500">Düzenli çalışma başarıyı getirir.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Star className="h-5 w-5 text-blue-500" />
                  Son Test Denemeleri
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Son çözdüğünüz testlerin detayları.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userStats.recentAttempts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <p className="text-lg font-medium text-slate-700">Henüz test çözmediniz.</p>
                    <p className="mt-2 text-sm text-slate-500">İlk testinize başlayarak istatistiklerinizi oluşturmaya başlayın.</p>
                    <Button
                      onClick={() => (window.location.href = '/')}
                      className="mt-6 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Teste Başla
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userStats.recentAttempts.map((attempt) => {
                      const performance = getPerformanceLevel(attempt.percentage)

                      return (
                        <div
                          key={attempt.id}
                          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:shadow"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{attempt.quiz.title}</h3>
                              <p className="text-sm text-slate-500">
                                {attempt.quiz.category.name} • {formatDate(attempt.completedAt)}
                              </p>
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${getScoreBadgeColor(attempt.percentage)}`}>
                              {performance.icon}
                              <span className={performance.color}>{performance.level}</span>
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <p className="text-sm text-slate-500">Puan</p>
                              <p className="text-xl font-semibold text-slate-900">
                                {attempt.score} / {attempt.maxScore}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <p className="text-sm text-slate-500">Başarı</p>
                              <p className={`text-xl font-semibold ${getScoreColor(attempt.percentage)}`}>
                                {attempt.percentage.toFixed(1)}%
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <p className="text-sm text-slate-500">Süre</p>
                              <p className="text-xl font-semibold text-slate-900">{formatTime(attempt.timeSpent)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <p className="text-sm text-slate-500">Kategori</p>
                              <p className="text-xl font-semibold text-slate-900">{attempt.quiz.category.name}</p>
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
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-700">Profil verileri yüklenemedi.</p>
            <p className="mt-2 text-sm text-slate-500">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-500 sm:px-6 lg:px-8">
          © 2024 QuizMaster. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
