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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-80 bg-slate-900 border-r border-white/10 shadow-xl z-[9999] md:hidden">
        <div className="flex flex-col h-full max-h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  QuizMaster
                </h1>
                <p className="text-xs text-purple-300">Akıllı Test Platformu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                <button 
                  onClick={() => handleNavigate('/profile')}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 relative"
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{user?.name || user?.email}</div>
                <Badge variant="secondary" className="text-xs bg-purple-600 text-white border-purple-500 mt-1">
                  {user?.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <button
              onClick={() => handleNavigate('/')}
              className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
            >
              <Home className="h-5 w-5 mr-3" />
              Ana Sayfa
            </button>
            
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
              >
                <Settings className="h-5 w-5 mr-3" />
                Admin Panel
              </button>
            )}

            <button
              onClick={() => handleNavigate('/leaderboard')}
              className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
            >
              <Trophy className="h-5 w-5 mr-3" />
              Liderlik Tablosu
            </button>

            <button
              onClick={() => handleNavigate('/profile')}
              className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
            >
              <User className="h-5 w-5 mr-3" />
              Profilim
            </button>

            <div className="border-t border-white/10 pt-4 mt-4">
              <button
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
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