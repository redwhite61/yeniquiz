'use client'

import { useEffect, useState } from 'react'

import { useSocket } from '@/hooks/use-socket'

import { Button } from '@/components/ui/button'
import { Bell, BookOpen, DollarSign, Info, Trophy, UserPlus, X } from 'lucide-react'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead
  } = useSocket()

  const [isMounted, setIsMounted] = useState(isOpen)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      const id = requestAnimationFrame(() => setAnimateIn(true))
      return () => cancelAnimationFrame(id)
    }

    setAnimateIn(false)

    const timeout = setTimeout(() => setIsMounted(false), 250)
    return () => clearTimeout(timeout)
  }, [isOpen])

  if (!isMounted) {
    return null
  }

  const iconForNotification = (type: string) => {
    switch (type) {
      case 'RANK_CHANGE':
      case 'ACHIEVEMENT':
        return <Trophy className="h-5 w-5 text-amber-500" />
      case 'TEST_COMPLETED':
      case 'NEW_TEST':
        return <BookOpen className="h-5 w-5 text-indigo-500" />
      case 'BONUS':
      case 'REWARD':
        return <DollarSign className="h-5 w-5 text-emerald-500" />
      case 'NEW_FOLLOWER':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-slate-400" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Şimdi'
    if (diffMins < 60) return `${diffMins}dk önce`
    if (diffHours < 24) return `${diffHours}s önce`
    if (diffDays < 7) return `${diffDays}g önce`
    return date.toLocaleDateString('tr-TR')
  }

  const unreadNotifications = notifications.filter((notification) => !notification.read)
  const readNotifications = notifications.filter((notification) => notification.read)

  const renderNotificationGroup = (
    title: string,
    items: typeof unreadNotifications
  ) => (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="space-y-3">
        {items.map((notification) => {
          const heading = (notification as { title?: string }).title ?? notification.message
          const detailText =
            (notification as {
              description?: string
              details?: string
              body?: string
              subtitle?: string
            }).description ??
            (notification as { details?: string }).details ??
            (notification as { body?: string }).body ??
            (notification as { subtitle?: string }).subtitle ??
            ''

          return (
            <button
              key={notification.id}
              onClick={() => !notification.read && markNotificationAsRead(notification.id)}
              className={`w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                notification.read ? '' : 'ring-1 ring-blue-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    {iconForNotification(notification.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{heading}</p>
                    <p className="text-xs text-slate-500">
                      {detailText || notification.message}
                    </p>
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-slate-400">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className={`relative flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl transition-all duration-300 ease-out sm:rounded-l-3xl sm:border-l sm:border-slate-200 ${
          animateIn ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            {unreadNotificationsCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={unreadNotificationsCount === 0}
              onClick={markAllNotificationsAsRead}
              className="text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Mark all read
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <Bell className="mb-4 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Hiç bildirim yok</p>
              <p className="text-xs">Yeni haberler burada görünecek.</p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 &&
                renderNotificationGroup('New', unreadNotifications)}
              {readNotifications.length > 0 &&
                renderNotificationGroup('Earlier', readNotifications)}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
