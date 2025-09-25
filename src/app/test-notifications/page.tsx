'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, Users, Trophy, BookOpen, Wifi, WifiOff } from 'lucide-react'

export default function TestNotificationsPage() {
  const { user } = useAuth()
  const {
    isConnected,
    notifications,
    leaderboardUpdates,
    unreadNotificationsCount,
    sendQuizCompletion,
    sendRankChange,
    sendNewTestCreated,
    requestLeaderboardUpdate
  } = useSocket()

  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString('tr-TR')}: ${result}`, ...prev].slice(0, 10))
  }

  const testQuizCompletion = () => {
    if (!user) return
    
    addTestResult('Test tamamlama bildirimi gönderiliyor...')
    sendQuizCompletion({
      userId: user.id,
      userName: user.name || user.email,
      score: 85,
      maxScore: 100,
      percentage: 85,
      quizId: 'test-quiz-1',
      quizTitle: 'Matematik Testi'
    })
  }

  const testRankChange = () => {
    if (!user) return
    
    addTestResult('Sıra değişikliği bildirimi gönderiliyor...')
    sendRankChange({
      userId: user.id,
      userName: user.name || user.email,
      oldRank: 5,
      newRank: 3,
      passedUserId: 'other-user-1',
      passedUserName: 'Diğer Kullanıcı'
    })
  }

  const testNewTestCreated = () => {
    addTestResult('Yeni test oluşturma bildirimi gönderiliyor...')
    sendNewTestCreated({
      testId: 'new-test-1',
      testTitle: 'Fizik Testi',
      categoryName: 'Fen Bilimleri',
      createdBy: user?.name || user?.email || 'Admin'
    })
  }

  const testLeaderboardUpdate = () => {
    addTestResult('Liderlik tablosu güncelleme isteği gönderiliyor...')
    requestLeaderboardUpdate()
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Erişim Engellendi</CardTitle>
            <CardDescription className="text-purple-300">
              Bildirimleri test etmek için giriş yapmalısınız.
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Bildirim Test Paneli</h1>
          <p className="text-xl text-purple-300">
            Real-time bildirim sistemini test edin
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8 bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              {isConnected ? <Wifi className="h-5 w-5 text-green-400" /> : <WifiOff className="h-5 w-5 text-red-400" />}
              Bağlantı Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-600" : "bg-red-600"}>
                {isConnected ? "Bağlı" : "Bağlı Değil"}
              </Badge>
              <span className="text-purple-300">
                {isConnected ? "Socket.io bağlantısı aktif" : "Socket.io bağlantısı kurulamadı"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Send className="h-5 w-5" />
                  Bildirim Testleri
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Farklı türlerde bildirimler gönderin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testQuizCompletion} 
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 disabled:opacity-50"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Test Tamamlama Bildirimi Gönder
                </Button>
                
                <Button 
                  onClick={testRankChange} 
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 disabled:opacity-50"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Sıra Değişikliği Bildirimi Gönder
                </Button>
                
                <Button 
                  onClick={testNewTestCreated} 
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 disabled:opacity-50"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Yeni Test Oluşturma Bildirimi Gönder
                </Button>
                
                <Button 
                  onClick={testLeaderboardUpdate} 
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0 disabled:opacity-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Liderlik Tablosu Güncelle
                </Button>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    Test Sonuçları
                  </span>
                  <Button 
                    onClick={clearTestResults} 
                    variant="outline" 
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Temizle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Henüz test sonucu yok</p>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className="p-2 bg-white/5 rounded text-sm text-purple-300">
                        {result}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Display */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Bell className="h-5 w-5" />
                  Bildirimler
                  {unreadNotificationsCount > 0 && (
                    <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Alınan bildirimler ({notifications.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Henüz bildirim yok</p>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border ${
                          notification.read 
                            ? 'border-gray-500/30 bg-gray-500/10' 
                            : 'border-purple-500/30 bg-purple-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${notification.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.timestamp).toLocaleTimeString('tr-TR')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Trophy className="h-5 w-5" />
                  Canlı Güncellemeler
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Liderlik tablosu güncellemeleri ({leaderboardUpdates.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leaderboardUpdates.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Henüz canlı güncelleme yok</p>
                  ) : (
                    leaderboardUpdates.map((update, index) => (
                      <div key={index} className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                        <p className="text-sm text-white font-medium">
                          {update.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(update.timestamp).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Info */}
        <Card className="mt-8 bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Kullanıcı Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Kullanıcı ID</p>
                <p className="text-purple-300 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">İsim</p>
                <p className="text-purple-300">{user.name || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">E-posta</p>
                <p className="text-purple-300">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Rol</p>
                <p className="text-purple-300">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}