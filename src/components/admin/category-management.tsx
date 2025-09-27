'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Category {
  id: string
  name: string
  description?: string | null
  color?: string | null
  image?: string | null
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
    color: category?.color || '#3B82F6',
    image: category?.image || ''
  })
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: category?.name || '',
        description: category?.description || '',
        color: category?.color || '#3B82F6',
        image: category?.image || ''
      })
      setImagePreview(category?.image ?? null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [category, isOpen])

  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, image: '' }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      handleClearImage()
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFormData((prev) => ({ ...prev, image: result }))
      setImagePreview(result || null)
    }
    reader.readAsDataURL(file)
  }

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
        body: JSON.stringify({
          ...formData,
          image: formData.image || null
        }),
      })

      if (response.ok) {
        onSuccess()
        setIsOpen(false)
        setFormData({ name: '', description: '', color: '#3B82F6', image: '' })
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right pt-2">
                Görsel
              </Label>
              <div className="col-span-3 space-y-3">
                <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-white file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-600 hover:file:bg-slate-100"
                />
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Kategori önizlemesi"
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/10" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-white/80 text-slate-600 hover:bg-white"
                    >
                      Görseli Kaldır
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Görsel seçerek kategorinizi öne çıkarabilirsiniz.
                  </p>
                )}
              </div>
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
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      setError(null)
      const response = await fetch(`/api/categories/${deleteTarget.id}`, {
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
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (user.role !== 'ADMIN') {
    return null
  }

  const totalQuizzes = categories.reduce((sum, category) => sum + category._count.quizzes, 0)
  const totalQuestions = categories.reduce((sum, category) => sum + category._count.questions, 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold text-slate-900">Kategori Yönetimi</h3>
          <p className="text-sm text-slate-500">
            Koleksiyonunuzu düzenleyin, tanımlamalar ekleyin ve test içeriklerini gruplandırın.
          </p>
        </div>
        <CategoryForm onSuccess={fetchCategories} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100">Toplam Kategori</CardDescription>
            <CardTitle className="text-3xl font-semibold">{categories.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-blue-100">
            Aktif olarak kullanılan kategori sayısı.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">İlişkili Testler</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{totalQuizzes}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            Kategorilere bağlı toplam test sayısı.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-slate-900 text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-200">İçerik Havuzu</CardDescription>
            <CardTitle className="text-3xl font-semibold">{totalQuestions}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-200">
            Kategoriler altındaki toplam soru sayısı.
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${category.color || '#3B82F6'} 0%, rgba(15,23,42,0.08) 100%)` }}
              />
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    {category.description || 'Bu kategori için henüz açıklama eklenmedi.'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryForm category={category} onSuccess={fetchCategories} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(category)}
                    className="border-slate-200 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1 rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                    <span className="text-xs font-medium uppercase tracking-wide">Test</span>
                    <span className="text-sm font-semibold">{category._count.quizzes}</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1 rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                    <span className="text-xs font-medium uppercase tracking-wide">Soru</span>
                    <span className="text-sm font-semibold">{category._count.questions}</span>
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Görsel Temsil:</span>{' '}
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    />
                    {category.color || '#3B82F6'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent className="border border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi silmek üzeresiniz</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Siliniyor...' : 'Evet, sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}