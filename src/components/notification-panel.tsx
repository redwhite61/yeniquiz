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
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'TEST_COMPLETED':
        return <BookOpen className="h-4 w-4 text-emerald-500" />
      case 'NEW_TEST':
        return <BookOpen className="h-4 w-4 text-indigo-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RANK_CHANGE':
        return 'border-blue-100 bg-blue-50'
      case 'TEST_COMPLETED':
        return 'border-emerald-100 bg-emerald-50'
      case 'NEW_TEST':
        return 'border-indigo-100 bg-indigo-50'
      default:
        return 'border-slate-200 bg-slate-50'
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
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed top-4 right-4 w-96 max-h-[80vh] bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">Bildirimler</h2>
            {unreadNotificationsCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs border-red-200">
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
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <CheckAll className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Temizle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Bildirimler
            {unreadNotificationsCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600 text-xs border-red-200">
                {unreadNotificationsCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-700'
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
                  <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Henüz bildirim yok</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-3 ${getNotificationColor(notification.type)} border ${
                      !notification.read ? 'shadow-md' : 'shadow-none'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${!notification.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
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
                  <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Henüz canlı güncelleme yok</p>
                </div>
              ) : (
                leaderboardUpdates.map((update, index) => (
                  <Card
                    key={`${update.timestamp}_${index}`}
                    className="p-3 border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-medium">{update.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
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