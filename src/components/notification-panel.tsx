'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, Trophy, TrendingUp, BookOpen, Check, CheckAll } from 'lucide-react'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    leaderboardUpdates,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications
  } = useSocket()

  const [activeTab, setActiveTab] = useState<'notifications' | 'live'>('notifications')

  if (!isOpen) return null

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RANK_CHANGE':
        return <TrendingUp className="h-4 w-4 text-blue-400" />
      case 'TEST_COMPLETED':
        return <BookOpen className="h-4 w-4 text-green-400" />
      case 'NEW_TEST':
        return <BookOpen className="h-4 w-4 text-purple-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RANK_CHANGE':
        return 'border-blue-500/30 bg-blue-500/10'
      case 'TEST_COMPLETED':
        return 'border-green-500/30 bg-green-500/10'
      case 'NEW_TEST':
        return 'border-purple-500/30 bg-purple-500/10'
      default:
        return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Az önce'
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    if (diffDays < 7) return `${diffDays} gün önce`
    return date.toLocaleDateString('tr-TR')
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="fixed top-4 right-4 w-96 max-h-[80vh] bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Bildirimler</h2>
            {unreadNotificationsCount > 0 && (
              <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                {unreadNotificationsCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadNotificationsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllNotificationsAsRead}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <CheckAll className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Temizle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bildirimler
            {unreadNotificationsCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-600 text-white text-xs">
                {unreadNotificationsCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Canlı Güncellemeler
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'notifications' ? (
            <div className="p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Henüz bildirim yok</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-3 ${getNotificationColor(notification.type)} backdrop-blur-sm border ${
                      !notification.read ? 'shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-1 h-auto"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {leaderboardUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Henüz canlı güncelleme yok</p>
                </div>
              ) : (
                leaderboardUpdates.map((update, index) => (
                  <Card
                    key={`${update.timestamp}_${index}`}
                    className="p-3 border-purple-500/30 bg-purple-500/10 backdrop-blur-sm"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Trophy className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                          {update.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(update.timestamp)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}