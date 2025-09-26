'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Trophy, 
  User, 
  LogOut, 
  Settings, 
  Home,
  X
} from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth()

  if (!isOpen) return null

  const handleNavigate = (url: string) => {
    window.location.href = url
    onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[9998] md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 shadow-xl z-[9999] md:hidden">
        <div className="flex flex-col h-full max-h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-inner">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  QuizMaster
                </h1>
                <p className="text-xs text-slate-500">Akıllı Test Platformu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-200 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-white relative"
                  title="Profilime git"
                >
                  {user?.avatar ? (
                    <img 
                      src={`${user.avatar}?t=${Date.now()}`} 
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = ''
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                      <User className="w-6 h-6 text-blue-500" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-slate-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white rounded-full p-1 shadow">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-900 font-medium truncate">{user?.name || user?.email}</div>
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100 mt-1">
                  {user?.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <button
              onClick={() => handleNavigate('/')}
              className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 px-4 py-2"
            >
              <Home className="h-5 w-5 mr-3" />
              Ana Sayfa
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 px-4 py-2"
              >
                <Settings className="h-5 w-5 mr-3" />
                Admin Panel
              </button>
            )}

            <button
              onClick={() => handleNavigate('/leaderboard')}
              className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 px-4 py-2"
            >
              <Trophy className="h-5 w-5 mr-3" />
              Liderlik Tablosu
            </button>

            <button
              onClick={() => handleNavigate('/profile')}
              className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 px-4 py-2"
            >
              <User className="h-5 w-5 mr-3" />
              Profilim
            </button>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <button
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 px-4 py-2"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}