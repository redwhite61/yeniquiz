'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserAnalyticsPanel } from '@/components/admin/user-analytics-panel'
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
        return 'bg-rose-50 text-rose-600 border border-rose-100'
      case 'STUDENT':
        return 'bg-blue-50 text-blue-600 border border-blue-100'
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
      : 'bg-rose-50 text-rose-600 border border-rose-100'
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-amber-600'
    return 'text-rose-600'
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Toplam Kullanıcı</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500">Kayıtlı kullanıcı</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aktif Kullanıcı</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{stats.activeUsers}</div>
            <p className="text-xs text-slate-500">Aktif hesap</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Admin</CardTitle>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Shield className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{stats.adminUsers}</div>
            <p className="text-xs text-slate-500">Yönetici</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Öğrenci</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{stats.studentUsers}</div>
            <p className="text-xs text-slate-500">Öğrenci</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ortalama Başarı</CardTitle>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${getPerformanceColor(stats.averageScore)}`}>
              {stats.averageScore}%
            </div>
            <p className="text-xs text-slate-500">Genel ortalama</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-slate-900">Kullanıcı Listesi</CardTitle>
              <CardDescription className="text-slate-500">
                Tüm kullanıcıları görüntüleyin ve yönetin
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={refreshUsers}
                disabled={refreshing}
                variant="outline"
                className="border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    İstatistikler
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-slate-200 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Kullanıcı İstatistikleri</DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Platformdaki kullanıcıların genel istatistikleri
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-2xl font-semibold text-blue-700 mb-1">{stats.totalUsers}</div>
                      <div className="text-sm text-slate-500">Toplam Kullanıcı</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="text-2xl font-semibold text-emerald-700 mb-1">{stats.activeUsers}</div>
                      <div className="text-sm text-slate-500">Aktif Kullanıcı</div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="text-2xl font-semibold text-indigo-700 mb-1">{stats.studentUsers}</div>
                      <div className="text-sm text-slate-500">Öğrenci</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
                      <div className="text-2xl font-semibold text-rose-700 mb-1">{stats.adminUsers}</div>
                      <div className="text-sm text-slate-500">Admin</div>
                    </div>
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                      <div className="text-2xl font-semibold text-violet-700 mb-1">{stats.totalQuizzes}</div>
                      <div className="text-sm text-slate-500">Toplam Test</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div className={`text-2xl font-semibold ${getPerformanceColor(stats.averageScore)} mb-1`}>
                        {stats.averageScore}%
                      </div>
                      <div className="text-sm text-slate-500">Ortalama Başarı</div>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 text-slate-600 focus:border-blue-500 focus:ring-blue-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200">
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STUDENT">Öğrenci</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 text-slate-600 focus:border-blue-500 focus:ring-blue-200">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-slate-500">Kullanıcı</TableHead>
                  <TableHead className="text-slate-500">Rol</TableHead>
                  <TableHead className="text-slate-500">Durum</TableHead>
                  <TableHead className="text-slate-500">İstatistikler</TableHead>
                  <TableHead className="text-slate-500">Kayıt Tarihi</TableHead>
                  <TableHead className="text-slate-500 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem) => (
                  <TableRow key={userItem.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                          <span className="text-sm font-medium">
                            {userItem.name?.charAt(0) || userItem.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {userItem.name || 'İsimsiz Kullanıcı'}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
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
                      <div className="text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-blue-500" />
                          <span>{userItem.stats.totalQuizzes} test</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getPerformanceColor(userItem.stats.averagePercentage)}`}>
                          <TrendingUp className="h-3 w-3" />
                          <span>{userItem.stats.averagePercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-500">
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
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-6xl">
                            <DialogHeader>
                              <DialogTitle className="text-slate-900">Kullanıcı Analizi</DialogTitle>
                              <DialogDescription className="text-slate-500">
                                Seçili kullanıcının kategori, test ve soru bazlı performans detayları
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="mt-4">
                                <UserAnalyticsPanel
                                  userId={selectedUser.id}
                                  fallbackName={selectedUser.name}
                                  email={selectedUser.email}
                                />
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => openEditDialog(userItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => toggleUserStatus(userItem.id)}
                        >
                          {userItem.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
            <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Kullanıcı Bulunamadı</h3>
              <p className="text-slate-500">Arama kriterlerinize uygun kullanıcı bulunamadı.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Kullanıcı Düzenle</DialogTitle>
            <DialogDescription className="text-slate-500">
              Kullanıcı bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Ad Soyad</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-200"
                  placeholder="Ad soyad girin"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">E-posta</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-200"
                  placeholder="E-posta adresi"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Rol</label>
                <Select value={editForm.role} onValueChange={(value) => handleEditFormChange('role', value)}>
                  <SelectTrigger className="bg-white border border-slate-200 text-slate-600 focus:border-blue-500 focus:ring-blue-200">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200">
                    <SelectItem value="STUDENT">Öğrenci</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEditDialog}
                  className="border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  İptal
                </Button>
                <Button
                  onClick={saveUserChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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