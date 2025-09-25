'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  _count: {
    quizzes: number
    questions: number
  }
}

interface CategoryFormProps {
  category?: Category
  onSuccess: () => void
}

function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#3B82F6'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        setIsOpen(false)
        setFormData({ name: '', description: '', color: '#3B82F6' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Kategori kaydedilirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      setError('Kategori kaydedilirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kategori
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Kategori bilgilerini güncelleyin.' : 'Yeni bir kategori oluşturun.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Ad
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Renk
              </Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="col-span-3 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface CategoryManagementProps {
  user: any
}

export function CategoryManagement({ user }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setError(null)
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Kategoriler yüklenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Kategoriler yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Kategori silinirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Kategori silinirken bir hata oluştu')
    }
  }

  if (user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Kategori Yönetimi</h3>
          <p className="text-sm text-slate-400">Test kategorilerini yönetin</p>
        </div>
        <CategoryForm onSuccess={fetchCategories} />
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-md backdrop-blur-sm">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-lg text-white">{category.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <CategoryForm
                    category={category}
                    onSuccess={fetchCategories}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="border-slate-600 text-slate-300 hover:bg-red-600/20 hover:text-red-300 hover:border-red-600/50 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-slate-400">
                  {category.description || 'Açıklama bulunmuyor'}
                </CardDescription>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600/50">
                    {category._count.quizzes} Test
                  </Badge>
                  <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-600/50">
                    {category._count.questions} Soru
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}