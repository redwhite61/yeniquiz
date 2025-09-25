'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { CategoryManagement } from '@/components/admin/category-management'
import { QuestionManagement } from '@/components/admin/question-management'
import { QuizManagement } from '@/components/admin/quiz-management'
import { UserManagement } from '@/components/admin/user-management'
import { 
  Settings, 
  Users, 
  BookOpen, 
  HelpCircle, 
  Menu,
  X,
  Home,
  BarChart3,
  Trophy,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Database,
  FileText,
  Users as UsersIcon
} from 'lucide-react'

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('categories')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCategories: 0,
    totalQuestions: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    activeUsers: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user && user.role === 'ADMIN') {
      fetchStats()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Erişim Engellendi</CardTitle>
            <CardDescription className="text-purple-300">
              Bu sayfaya sadece admin kullanıcılar erişebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navbar */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Logo and Mobile Menu */}
            <div className="flex items-center space-x-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-slate-900 border-white/10 p-0">
                  <SheetTitle className="sr-only">Admin Mobil Menü</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-sm opacity-75"></div>
                          <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-full">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                            Admin Panel
                          </h1>
                          <p className="text-xs text-blue-300">Yönetim Paneli</p>
                        </div>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                          <User className="h-8 w-8 text-blue-200" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium truncate">{user.name || user.email}</div>
                          <Badge variant="secondary" className="text-xs bg-blue-600 text-white border-blue-500">
                            Admin
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-6 space-y-2">
                      <button
                        className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => {
                          window.location.href = '/'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Home className="h-5 w-5 mr-3" />
                        Ana Sayfa
                      </button>
                      
                      <button
                        className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => {
                          window.location.href = '/leaderboard'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Trophy className="h-5 w-5 mr-3" />
                        Liderlik Tablosu
                      </button>

                      <button
                        className="w-full justify-start text-white hover:bg-white/10 hover:text-white inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => {
                          window.location.href = '/profile'
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="h-5 w-5 mr-3" />
                        Profilim
                      </button>

                      <div className="border-t border-white/10 pt-4 mt-4">
                        <button
                          className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                          onClick={() => {
                            // logout function would go here
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Çıkış Yap
                        </button>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-full">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-blue-300 -mt-1">Yönetim Paneli</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                  <User className="h-5 w-5 text-blue-200" />
                </div>
                <div className="text-sm">
                  <span className="text-white font-medium">{user.name || user.email}</span>
                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-600 text-white border-blue-500">
                    Admin
                  </Badge>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Ana Sayfa</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/leaderboard'}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5"
              >
                <Trophy className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Liderlik</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/profile'}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 bg-white/5"
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
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-white hover:bg-white/10"
                  >
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                      <User className="h-5 w-5" />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-slate-900 border-white/10">
                  <SheetTitle className="sr-only">Kullanıcı Menüsü</SheetTitle>
                  <div className="flex flex-col space-y-6">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 ring-2 ring-white"></div>
                        <User className="h-12 w-12 text-blue-200 mx-auto mb-3" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{user.name || user.email}</h3>
                      <Badge variant="secondary" className="mt-2 bg-blue-600 text-white border-blue-500">
                        Admin
                      </Badge>
                    </div>

                    <nav className="space-y-2">
                      <button
                        className="w-full justify-start text-white hover:bg-white/10 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => window.location.href = '/profile'}
                      >
                        <User className="h-5 w-5 mr-3" />
                        Profilim
                      </button>
                      
                      <button
                        className="w-full justify-start text-white hover:bg-white/10 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => window.location.href = '/leaderboard'}
                      >
                        <Trophy className="h-5 w-5 mr-3" />
                        Liderlik Tablosu
                      </button>

                      <button
                        className="w-full justify-start text-white hover:bg-white/10 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2 has-[>svg]:px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                        onClick={() => window.location.href = '/'}
                      >
                        <Home className="h-5 w-5 mr-3" />
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
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Admin Paneli</h2>
          <p className="text-lg text-blue-300 max-w-2xl mx-auto sm:mx-0">
            Platformu yönetin ve içerik ekleyin.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Kullanıcı</CardTitle>
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <UsersIcon className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {isLoading ? '-' : stats.totalUsers}
              </div>
              <p className="text-xs text-slate-400">Kayıtlı kullanıcı</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Kategoriler</CardTitle>
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <BookOpen className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isLoading ? '-' : stats.totalCategories}
              </div>
              <p className="text-xs text-slate-400">Aktif kategori</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Sorular</CardTitle>
              <div className="p-2 bg-green-600/20 rounded-lg">
                <HelpCircle className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {isLoading ? '-' : stats.totalQuestions}
              </div>
              <p className="text-xs text-slate-400">Toplam soru</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Testler</CardTitle>
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <FileText className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {isLoading ? '-' : stats.totalQuizzes}
              </div>
              <p className="text-xs text-slate-400">Aktif test</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 min-w-max bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-1">
              <TabsTrigger value="categories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Kategoriler</span>
                  <span className="sm:hidden">Kat</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="questions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Sorular</span>
                  <span className="sm:hidden">Sor</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Testler</span>
                  <span className="sm:hidden">Test</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-md">
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

          <TabsContent value="users" className="space-y-6">
            <UserManagement user={user} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-xl border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-blue-300">
              © 2024 QuizMaster Admin Panel. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}