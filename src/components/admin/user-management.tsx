'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar, 
  Trophy, 
  BookOpen,
  TrendingUp,
  Filter,
  MoreHorizontal,
  Eye,
  Shield,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  role: 'STUDENT' | 'ADMIN'
  createdAt: string
  lastLogin?: string | undefined
  isActive: boolean
  stats: {
    totalQuizzes: number
    totalScore: number
    averagePercentage: number
    completedTests: number
  }
}

interface UserManagementProps {
  user: any
}

export function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN'
  })

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:30:00Z',
      isActive: true,
      stats: {
        totalQuizzes: 0,
        totalScore: 0,
        averagePercentage: 0,
        completedTests: 0
      }
    },
    {
      id: '2',
      email: 'student1@example.com',
      name: 'Ahmet Yılmaz',
      role: 'STUDENT',
      createdAt: '2024-01-05T00:00:00Z',
      lastLogin: '2024-01-14T15:45:00Z',
      isActive: true,
      stats: {
        totalQuizzes: 15,
        totalScore: 1250,
        averagePercentage: 83.5,
        completedTests: 12
      }
    },
    {
      id: '3',
      email: 'student2@example.com',
      name: 'Ayşe Demir',
      role: 'STUDENT',
      createdAt: '2024-01-08T00:00:00Z',
      lastLogin: '2024-01-13T09:20:00Z',
      isActive: true,
      stats: {
        totalQuizzes: 8,
        totalScore: 680,
        averagePercentage: 85.0,
        completedTests: 7
      }
    },
    {
      id: '4',
      email: 'student3@example.com',
      name: 'Mehmet Kaya',
      role: 'STUDENT',
      createdAt: '2024-01-10T00:00:00Z',
      lastLogin: '2024-01-12T14:15:00Z',
      isActive: false,
      stats: {
        totalQuizzes: 3,
        totalScore: 180,
        averagePercentage: 60.0,
        completedTests: 2
      }
    },
    {
      id: '5',
      email: 'student4@example.com',
      name: 'Zeynep Çelik',
      role: 'STUDENT',
      createdAt: '2024-01-12T00:00:00Z',
      lastLogin: '2024-01-14T16:30:00Z',
      isActive: true,
      stats: {
        totalQuizzes: 22,
        totalScore: 1980,
        averagePercentage: 90.0,
        completedTests: 20
      }
    }
  ]

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      } else {
        console.error('Failed to fetch users - status:', response.status)
        setUsers([])
        setFilteredUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      setFilteredUsers([])
    }
  }

  const refreshUsers = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  useEffect(() => {
    const initializeUsers = async () => {
      await fetchUsers()
      setLoading(false)
    }
    initializeUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'STUDENT':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/50'
      : 'bg-red-500/20 text-red-400 border-red-500/50'
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 70) return 'text-blue-400'
    if (percentage >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action: 'toggleStatus'
        })
      })

      if (response.ok) {
        // Refresh the user list to get updated data
        await refreshUsers()
      } else {
        const errorData = await response.json()
        alert(`Hata: ${errorData.error || 'Kullanıcı durumu güncellenemedi'}`)
        console.error('Failed to toggle user status:', errorData)
      }
    } catch (error) {
      alert('Kullanıcı durumu güncellenirken bir hata oluştu')
      console.error('Error toggling user status:', error)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the user list
        await refreshUsers()
      } else {
        const errorData = await response.json()
        alert(`Hata: ${errorData.error || 'Kullanıcı silinemedi'}`)
        console.error('Failed to delete user:', errorData)
      }
    } catch (error) {
      alert('Kullanıcı silinirken bir hata oluştu')
      console.error('Error deleting user:', error)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      role: user.role
    })
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingUser(null)
    setEditForm({
      name: '',
      email: '',
      role: 'STUDENT'
    })
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveUserChanges = async () => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser.id,
          action: 'updateUser',
          userData: {
            name: editForm.name,
            email: editForm.email,
            role: editForm.role
          }
        })
      })

      if (response.ok) {
        closeEditDialog()
        await refreshUsers()
      } else {
        const errorData = await response.json()
        alert(`Hata: ${errorData.error || 'Kullanıcı güncellenemedi'}`)
        console.error('Failed to update user:', errorData)
      }
    } catch (error) {
      alert('Kullanıcı güncellenirken bir hata oluştu')
      console.error('Error updating user:', error)
    }
  }

  const getStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const adminUsers = users.filter(u => u.role === 'ADMIN').length
    const studentUsers = users.filter(u => u.role === 'STUDENT').length
    const totalQuizzes = users.reduce((sum, u) => sum + u.stats.totalQuizzes, 0)
    const averageScore = users.length > 0 
      ? Math.round(users.reduce((sum, u) => sum + u.stats.averagePercentage, 0) / users.length)
      : 0

    return { totalUsers, activeUsers, adminUsers, studentUsers, totalQuizzes, averageScore }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Kullanıcı</CardTitle>
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.totalUsers}</div>
            <p className="text-xs text-slate-400">Kayıtlı kullanıcı</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aktif Kullanıcı</CardTitle>
            <div className="p-2 bg-green-600/20 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stats.activeUsers}</div>
            <p className="text-xs text-slate-400">Aktif hesap</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Admin</CardTitle>
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">{stats.adminUsers}</div>
            <p className="text-xs text-slate-400">Yönetici</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Öğrenci</CardTitle>
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <BookOpen className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.studentUsers}</div>
            <p className="text-xs text-slate-400">Öğrenci</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Ortalama Başarı</CardTitle>
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageScore)}`}>
              {stats.averageScore}%
            </div>
            <p className="text-xs text-slate-400">Genel ortalama</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Kullanıcı Listesi</CardTitle>
              <CardDescription className="text-slate-400">
                Tüm kullanıcıları görüntüleyin ve yönetin
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={refreshUsers}
                disabled={refreshing}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0">
                <UserPlus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    İstatistikler
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Kullanıcı İstatistikleri</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Platformdaki kullanıcıların genel istatistikleri
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="text-2xl font-bold text-white mb-1">{stats.totalUsers}</div>
                      <div className="text-sm text-slate-400">Toplam Kullanıcı</div>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="text-2xl font-bold text-green-400 mb-1">{stats.activeUsers}</div>
                      <div className="text-sm text-slate-400">Aktif Kullanıcı</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{stats.studentUsers}</div>
                      <div className="text-sm text-blue-300">Öğrenci</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-red-400 mb-1">{stats.adminUsers}</div>
                      <div className="text-sm text-blue-300">Admin</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-purple-400 mb-1">{stats.totalQuizzes}</div>
                      <div className="text-sm text-blue-300">Toplam Test</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageScore)} mb-1`}>
                        {stats.averageScore}%
                      </div>
                      <div className="text-sm text-blue-300">Ortalama Başarı</div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STUDENT">Öğrenci</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border border-slate-700/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-700/50">
                <TableRow>
                  <TableHead className="text-slate-300">Kullanıcı</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
                  <TableHead className="text-slate-300">Durum</TableHead>
                  <TableHead className="text-slate-300">İstatistikler</TableHead>
                  <TableHead className="text-slate-300">Kayıt Tarihi</TableHead>
                  <TableHead className="text-slate-300 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem) => (
                  <TableRow key={userItem.id} className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white/20">
                          <span className="text-white text-sm font-medium">
                            {userItem.name?.charAt(0) || userItem.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {userItem.name || 'İsimsiz Kullanıcı'}
                          </div>
                          <div className="text-sm text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(userItem.role)}>
                        {userItem.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(userItem.isActive)}>
                        {userItem.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-white">
                          <BookOpen className="h-3 w-3 text-blue-400" />
                          <span>{userItem.stats.totalQuizzes} test</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getPerformanceColor(userItem.stats.averagePercentage)}`}>
                          <TrendingUp className="h-3 w-3" />
                          <span>{userItem.stats.averagePercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-400">
                        {formatDate(userItem.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 text-white max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-white">Kullanıcı Detayları</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white text-lg font-medium">
                                      {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-white">
                                      {selectedUser.name || 'İsimsiz Kullanıcı'}
                                    </div>
                                    <div className="text-sm text-blue-300">{selectedUser.email}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-blue-300">Rol</div>
                                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                                      {selectedUser.role === 'ADMIN' ? 'Admin' : 'Öğrenci'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="text-sm text-blue-300">Durum</div>
                                    <Badge className={getStatusBadgeColor(selectedUser.isActive)}>
                                      {selectedUser.isActive ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-blue-300">Toplam Test</div>
                                    <div className="text-white font-medium">{selectedUser.stats.totalQuizzes}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-blue-300">Tamamlanan</div>
                                    <div className="text-white font-medium">{selectedUser.stats.completedTests}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-blue-300">Toplam Puan</div>
                                    <div className="text-white font-medium">{selectedUser.stats.totalScore}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-blue-300">Başarı Oranı</div>
                                    <div className={`font-medium ${getPerformanceColor(selectedUser.stats.averagePercentage)}`}>
                                      {selectedUser.stats.averagePercentage.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-blue-300">Kayıt Tarihi</div>
                                  <div className="text-white">{formatDate(selectedUser.createdAt)}</div>
                                </div>
                                {selectedUser.lastLogin && (
                                  <div>
                                    <div className="text-sm text-blue-300">Son Giriş</div>
                                    <div className="text-white">{formatDate(selectedUser.lastLogin)}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-white/10"
                          onClick={() => openEditDialog(userItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300 hover:bg-green-600/20"
                          onClick={() => toggleUserStatus(userItem.id)}
                        >
                          {userItem.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                          onClick={() => deleteUser(userItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Kullanıcı Bulunamadı</h3>
              <p className="text-blue-300">Arama kriterlerinize uygun kullanıcı bulunamadı.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Kullanıcı Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Kullanıcı bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ad Soyad</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ad soyad girin"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-posta</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="E-posta adresi"
                  type="email"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Rol</label>
                <Select value={editForm.role} onValueChange={(value) => handleEditFormChange('role', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20">
                    <SelectItem value="STUDENT">Öğrenci</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEditDialog}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </Button>
                <Button
                  onClick={saveUserChanges}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}