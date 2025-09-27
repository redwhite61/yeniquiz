'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { AnnouncementManagement } from '@/components/admin/announcement-management'
import { CategoryManagement } from '@/components/admin/category-management'
import { QuestionManagement } from '@/components/admin/question-management'
import { QuizManagement } from '@/components/admin/quiz-management'
import { UserManagement } from '@/components/admin/user-management'
import { DashboardOverview } from '@/components/admin/dashboard-overview'
import {
  Settings,
  HelpCircle,
  Menu,
  X,
  Home,
  Trophy,
  User,
  LogOut,
  Database,
  FileText,
  Users as UsersIcon,
  Megaphone
} from 'lucide-react'

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('categories')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-slate-200 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold text-slate-900">Erişim Engellendi</CardTitle>
            <CardDescription className="text-slate-600">
              Bu sayfaya sadece admin kullanıcılar erişebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Logo and Mobile Menu */}
            <div className="flex items-center space-x-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden inline-flex items-center justify-center rounded-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 size-10 transition-colors"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white border-r border-slate-200 p-0">
                  <SheetTitle className="sr-only">Admin Mobil Menü</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-inner">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div>
                          <h1 className="text-xl font-semibold text-slate-900">Admin Panel</h1>
                          <p className="text-xs text-slate-500">Yönetim Paneli</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 size-9"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* User Info */}
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                          <User className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 truncate">{user.name || user.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => {
                          window.location.href = '/'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Home className="h-5 w-5" />
                        Ana Sayfa
                      </button>

                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => {
                          window.location.href = '/leaderboard'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Trophy className="h-5 w-5" />
                        Liderlik Tablosu
                      </button>

                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => {
                          window.location.href = '/profile'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="h-5 w-5" />
                        Profilim
                      </button>

                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <button
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                          onClick={() => {
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          Çıkış Yap
                        </button>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center space-x-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-inner">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-semibold text-slate-900">Admin Panel</h1>
                  <p className="text-xs text-slate-500 -mt-0.5">Yönetim Paneli</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <div className="text-sm">
                  <span className="font-medium text-slate-900">{user.name || user.email}</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="rounded-full border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Ana Sayfa</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/leaderboard'}
                className="rounded-full border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
              >
                <Trophy className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Liderlik</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/profile'}
                className="rounded-full border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
              >
                <User className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Profil</span>
              </Button>
            </div>

            {/* Mobile User Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center rounded-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 size-10"
                  >
                    <div className="relative">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                      <User className="h-5 w-5" />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white border-l border-slate-200">
                  <SheetTitle className="sr-only">Kullanıcı Menüsü</SheetTitle>
                  <div className="flex flex-col space-y-6">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                        <User className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{user.name || user.email}</h3>
                    </div>

                    <nav className="space-y-2">
                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => window.location.href = '/profile'}
                      >
                        <User className="h-5 w-5" />
                        Profilim
                      </button>

                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => window.location.href = '/leaderboard'}
                      >
                        <Trophy className="h-5 w-5" />
                        Liderlik Tablosu
                      </button>

                      <button
                        className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 py-2"
                        onClick={() => window.location.href = '/'}
                      >
                        <Home className="h-5 w-5" />
                        Ana Sayfa
                      </button>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">Admin Paneli</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto sm:mx-0">
            Platformu kolayca yönetin, içerik oluşturun ve performansı takip edin.
          </p>
        </div>

        <div className="mb-12">
          <DashboardOverview />
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-max bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Kategoriler</span>
                  <span className="sm:hidden">Kat</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Sorular</span>
                  <span className="sm:hidden">Sor</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Testler</span>
                  <span className="sm:hidden">Test</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                <div className="flex items-center space-x-2">
                  <Megaphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Duyurular</span>
                  <span className="sm:hidden">Duy</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Kullanıcılar</span>
                  <span className="sm:hidden">Kul</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement user={user} />
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <QuestionManagement user={user} />
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <QuizManagement user={user} />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <AnnouncementManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement user={user} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-500">
              © 2024 QuizMaster Admin Panel. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}