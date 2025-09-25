'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MobileMenu } from '@/components/mobile-menu'
import { User, Trophy, Clock, Target, TrendingUp, ArrowLeft, BookOpen, Award, Zap, Star, Calendar, Menu, Camera, X } from 'lucide-react'

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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        setAvatarSuccess('Profil resmi başarıyla güncellendi!')
        setPreviewAvatar(null)
        
        // Debug: Log the avatar URL
        console.log('Avatar URL from server:', data.user?.avatar)
        console.log('Avatar URL being set:', avatarUrl)
        
        // Update the user object in auth context and localStorage
        const updatedUser = { ...user, avatar: avatarUrl }
        localStorage.setItem('quizUser', JSON.stringify(updatedUser))
        // Force a re-render by updating the auth context through window event
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: avatarUrl } }))
        
        setTimeout(() => setAvatarSuccess(null), 3000)
      } else if (response.status === 404) {
        // User not found - redirect to login
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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Lütfen bir resim dosyası seçin')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Dosya boyutu 5MB\'dan küçük olmalı')
      return
    }

    setAvatarError(null)
    setIsUploadingAvatar(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file to server
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Resim yüklenirken bir hata oluştu')
      }
      
      const data = await response.json()
      
      // Update avatar with the server URL
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: '' }),
      })

      if (response.ok) {
        setAvatarSuccess('Profil resmi kaldırıldı!')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Update the user object in auth context and localStorage
        const updatedUser = { ...user, avatar: undefined }
        localStorage.setItem('quizUser', JSON.stringify(updatedUser))
        // Force a re-render by updating the auth context through window event
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: undefined } }))
        
        setTimeout(() => setAvatarSuccess(null), 3000)
      } else if (response.status === 404) {
        // User not found - redirect to login
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
              Profilinizi görüntülemek için giriş yapmalısınız.
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 70) return 'text-blue-400'
    if (percentage >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500/20 text-green-400 border-green-500/50'
    if (percentage >= 70) return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-red-500/20 text-red-400 border-red-500/50'
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Uzman', icon: '🏆', color: 'text-yellow-400' }
    if (percentage >= 70) return { level: 'İyi', icon: '⭐', color: 'text-blue-400' }
    if (percentage >= 50) return { level: 'Orta', icon: '📈', color: 'text-purple-400' }
    return { level: 'Başlangıç', icon: '🌱', color: 'text-green-400' }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Erişim Engellendi</CardTitle>
            <CardDescription className="text-purple-300">
              Profilinizi görüntülemek için giriş yapmalısınız.
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
                <User className="h-8 w-8 text-purple-400 mr-2" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Profilim</h1>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-purple-200">{user.name || user.email}</span>
              <Badge variant="secondary" className="bg-purple-600 text-white border-purple-500">
                {user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
              </Badge>
              <Button variant="outline" onClick={logout} className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
                Çıkış
              </Button>
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
          <h2 className="text-5xl font-bold text-white mb-4">Profilim</h2>
          <p className="text-xl text-purple-300 max-w-2xl mx-auto">
            Test istatistiklerinizi ve geçmişinizi görün
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : userStats ? (
          <>
            {/* User Info Card */}
            <Card className="mb-8 bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <User className="h-5 w-5" />
                  Kullanıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="relative">
                        <div
                          className="rounded-full overflow-hidden border-4 border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:border-white/40 group-hover:scale-105"
                          style={{
                            width: 120,
                            height: 120,
                          }}
                        >
                          {user.avatar || previewAvatar ? (
                            <img
                              src={previewAvatar || (user.avatar ? `${user.avatar}?t=${Date.now()}` : '')}
                              alt="Profil resmi"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', e.currentTarget.src)
                                e.currentTarget.src = ''
                                e.currentTarget.style.display = 'none'
                              }}
                              onLoad={(e) => {
                                console.log('Image loaded successfully:', e.currentTarget.src)
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                              <div className="text-center">
                                <Camera className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-xs text-purple-400">Resim Ekle</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload Overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        {/* Loading Spinner */}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}

                        {/* Remove Button */}
                        {(user.avatar || previewAvatar) && !isUploadingAvatar && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAvatar()
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200 shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="text-center space-y-2">
                      <p className="text-sm text-purple-300">
                        {isUploadingAvatar ? 'Yükleniyor...' : 'Tıklayın veya sürükleyin'}
                      </p>
                      <p className="text-xs text-purple-400">
                        Maksimum 5MB • JPG, PNG, GIF
                      </p>
                    </div>

                    {avatarError && (
                      <p className="text-sm text-red-400 text-center">{avatarError}</p>
                    )}
                    {avatarSuccess && (
                      <p className="text-sm text-green-400 text-center">{avatarSuccess}</p>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-purple-300">Ad Soyad</label>
                      <p className="text-lg text-white">{user.name || 'Belirtilmemiş'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-purple-300">Email</label>
                      <p className="text-lg text-white">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-purple-300">Rol</label>
                      <p className="text-lg text-white">{user.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-purple-300">Kayıt Tarihi</label>
                      <p className="text-lg text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-300">Tamamlanan Testler</CardTitle>
                  <BookOpen className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {userStats.totalQuizzes}
                  </div>
                  <p className="text-xs text-purple-300">Toplam test</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-300">Toplam Puan</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {userStats.totalScore}
                  </div>
                  <p className="text-xs text-purple-300">Birikmiş puan</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-300">Başarı Oranı</CardTitle>
                  <Target className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(userStats.averagePercentage)}`}>
                    {userStats.averagePercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-purple-300">Ortalama başarı</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-300">En Yüksek Puan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {userStats.bestScore}
                  </div>
                  <p className="text-xs text-purple-300">Tek testte</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Level */}
            {userStats.totalQuizzes > 0 && (
              <Card className="mb-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Award className="h-5 w-5" />
                    Performans Seviyesi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{getPerformanceLevel(userStats.averagePercentage).icon}</div>
                      <div>
                        <div className={`text-2xl font-bold ${getPerformanceLevel(userStats.averagePercentage).color}`}>
                          {getPerformanceLevel(userStats.averagePercentage).level}
                        </div>
                        <div className="text-sm text-purple-300">
                          {userStats.averagePercentage.toFixed(1)}% ortalama başarı
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-purple-300 mb-1">İlerleme</div>
                      <Progress value={userStats.averagePercentage} className="w-32 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Overview */}
            <Card className="mb-8 bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  Performans Göstergeleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-purple-300">Genel Başarı Oranı</span>
                      <span className="text-sm font-medium text-white">{userStats.averagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={userStats.averagePercentage} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-purple-300">Toplam Çalışma Süresi</span>
                      <span className="text-sm font-medium text-white">{formatTime(userStats.totalTimeSpent)}</span>
                    </div>
                    <Progress value={Math.min((userStats.totalTimeSpent / 3600) * 10, 100)} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                      <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userStats.totalQuizzes}</div>
                      <div className="text-sm text-purple-300">Test Tamamlandı</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                      <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userStats.totalScore}</div>
                      <div className="text-sm text-purple-300">Toplam Puan</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Attempts */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Clock className="h-5 w-5" />
                  Son Testler
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Çözdüğünüz son testler ve sonuçları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userStats.recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {userStats.recentAttempts.map((attempt) => (
                      <div key={attempt.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: attempt.quiz.category.color || '#8B5CF6' }}
                            />
                            <h3 className="font-medium text-white">{attempt.quiz.title}</h3>
                            <Badge variant="outline" className="text-xs border-white/30 text-white">
                              {attempt.quiz.category.name}
                            </Badge>
                          </div>
                          <Badge className={getScoreBadgeColor(attempt.percentage)}>
                            {attempt.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-purple-300 mb-3">
                          <div className="flex items-center space-x-4">
                            <span className="text-white">{attempt.score} / {attempt.maxScore} puan</span>
                            <span>•</span>
                            <span>{formatTime(attempt.timeSpent)}</span>
                          </div>
                          <span>{formatDate(attempt.completedAt)}</span>
                        </div>
                        
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              attempt.percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              attempt.percentage >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              attempt.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${attempt.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      Henüz test çözmediniz
                    </h3>
                    <p className="text-purple-300 mb-6 max-w-md mx-auto">
                      İlk testinizi çözmek için ana sayfaya dönün ve kategoriler arasından seçim yapın.
                    </p>
                    <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                      Testlere Başla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                Profil bilgileri yüklenemedi
              </h3>
              <p className="text-purple-300">
                Lütfen daha sonra tekrar deneyin.
              </p>
            </CardContent>
          </Card>
        )}
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