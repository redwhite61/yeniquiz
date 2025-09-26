'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
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
  color?: string
}

interface Question {
  id: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT' | 'IMAGE'
  options: Array<{
    text: string
    imageUrl?: string
  }>
  correctAnswer: string
  imageUrl?: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: Category
}

interface QuestionFormProps {
  question?: Question
  categories: Category[]
  onSuccess: () => void
}

function QuestionForm({ question, categories, onSuccess }: QuestionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const normalizeOptions = (type: Question['type'], options?: Question['options']) => {
    const ensureOptionShape = (option?: { text?: string; imageUrl?: string }) => ({
      text: option?.text || '',
      imageUrl: option?.imageUrl || ''
    })

    if (type === 'TRUE_FALSE') {
      const baseOptions = options && options.length >= 2 ? options : []
      return [
        ensureOptionShape(baseOptions[0] || { text: 'Doğru' }),
        ensureOptionShape(baseOptions[1] || { text: 'Yanlış' })
      ]
    }

    const desiredLength = type === 'MULTIPLE_CHOICE' || type === 'IMAGE' ? 4 : 0
    if (desiredLength === 0) {
      return []
    }

    const existingOptions = options ? options.map((option) => ensureOptionShape(option)) : []
    if (existingOptions.length >= desiredLength) {
      return existingOptions
    }

    const additional = Array.from({ length: desiredLength - existingOptions.length }, () => ensureOptionShape())
    return [...existingOptions, ...additional]
  }

  const getInitialCorrectAnswer = () => {
    if (!question) {
      return '0'
    }

    if (question.type === 'TEXT') {
      return question.correctAnswer || ''
    }

    if (!question.correctAnswer) {
      return '0'
    }

    const parsedIndex = Number.parseInt(question.correctAnswer, 10)
    if (!Number.isNaN(parsedIndex)) {
      return parsedIndex.toString()
    }

    if (question.options && question.options.length > 0) {
      const matchedIndex = question.options.findIndex((option) => option.text === question.correctAnswer)
      if (matchedIndex !== -1) {
        return matchedIndex.toString()
      }
    }

    return '0'
  }

  const [formData, setFormData] = useState({
    content: question?.content || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    options: normalizeOptions(question?.type || 'MULTIPLE_CHOICE', question?.options),
    correctAnswer: question ? getInitialCorrectAnswer() : '0',
    imageUrl: question?.imageUrl || '',
    imageFile: null as File | null,
    points: question?.points || 1,
    difficulty: question?.difficulty || 'MEDIUM',
    categoryId: question?.category.id || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeChange = (value: Question['type']) => {
    setFormData((prev) => {
      const updatedOptions = normalizeOptions(value, prev.options)
      let nextCorrectAnswer = ''

      if (value === 'TEXT') {
        nextCorrectAnswer = ''
      } else {
        const parsedIndex = Number.parseInt(prev.correctAnswer || '', 10)
        if (!Number.isNaN(parsedIndex) && parsedIndex < updatedOptions.length) {
          nextCorrectAnswer = parsedIndex.toString()
        } else {
          nextCorrectAnswer = '0'
        }
      }

      return {
        ...prev,
        type: value,
        options: updatedOptions,
        correctAnswer: nextCorrectAnswer
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if image is still uploading
    if (isImageUploading) {
      setError('Lütfen resim yüklemesi tamamlanana kadar bekleyin')
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const requiresImageQuestion = formData.type !== 'TEXT'
      if (requiresImageQuestion && !formData.imageUrl && !formData.imageFile) {
        setError('Bu soru tipi için soru görseli eklemelisiniz')
        setIsLoading(false)
        return
      }

      const requiresOptions = formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE' || formData.type === 'IMAGE'
      if (requiresOptions) {
        if (!formData.options || !Array.isArray(formData.options) || formData.options.length === 0) {
          setError('Bu soru tipi için seçenekler gereklidir')
          setIsLoading(false)
          return
        }

        const hasIncompleteOption = formData.options.some((opt) => !opt.text.trim() || !opt.imageUrl)
        if (hasIncompleteOption) {
          setError('Lütfen tüm seçenekler için metin ve görsel ekleyin')
          setIsLoading(false)
          return
        }
      }

      if (requiresOptions && (formData.correctAnswer === '' || formData.correctAnswer === undefined || formData.correctAnswer === null)) {
        setError('Lütfen doğru cevabı seçin')
        setIsLoading(false)
        return
      }

      const url = question ? `/api/questions/${question.id}` : '/api/questions'
      const method = question ? 'PUT' : 'POST'

      const payload = {
        content: formData.content,
        type: formData.type,
        options: formData.type === 'TEXT' ? null : formData.options,
        correctAnswer: formData.correctAnswer,
        imageUrl: formData.imageUrl,
        points: formData.points,
        difficulty: formData.difficulty,
        categoryId: formData.categoryId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
        setIsOpen(false)
        setFormData({
          content: '',
          type: 'MULTIPLE_CHOICE',
          options: normalizeOptions('MULTIPLE_CHOICE'),
          correctAnswer: '0',
          imageUrl: '',
          imageFile: null,
          points: 1,
          difficulty: 'MEDIUM',
          categoryId: ''
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to save question:', errorData)
        setError(errorData.error || 'Soru kaydedilirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error saving question:', error)
      setError('Soru kaydedilirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const addOption = () => {
    setFormData((prev) => {
      if (prev.type === 'TRUE_FALSE') {
        return prev
      }

      return {
        ...prev,
        options: [...prev.options, { text: '', imageUrl: '' }]
      }
    })
  }

  const removeOption = (index: number) => {
    setFormData((prev) => {
      const updatedOptions = prev.options.filter((_, i) => i !== index)

      let updatedCorrectAnswer = prev.correctAnswer
      const parsedCorrectAnswer = Number.parseInt(prev.correctAnswer || '', 10)
      if (!Number.isNaN(parsedCorrectAnswer)) {
        if (parsedCorrectAnswer === index) {
          updatedCorrectAnswer = '0'
        } else if (parsedCorrectAnswer > index) {
          updatedCorrectAnswer = (parsedCorrectAnswer - 1).toString()
        }
      }

      return {
        ...prev,
        options: updatedOptions,
        correctAnswer: updatedCorrectAnswer
      }
    })
  }

  const updateOption = (index: number, field: 'text' | 'imageUrl', value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData({
      ...formData,
      options: newOptions
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {question ? (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Soru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? 'Soruyu Düzenle' : 'Yeni Soru Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {question ? 'Soru bilgilerini güncelleyin.' : 'Yeni bir soru oluşturun.'}
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
              <Label htmlFor="content" className="text-right">
                Soru
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="col-span-3"
                rows={3}
                required
              />
            </div>

            {(formData.type === 'IMAGE' || formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Soru Resmi
                </Label>
                <div className="col-span-3">
                  {isImageUploading && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-600 flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                        Resim yükleniyor, lütfen bekleyin...
                      </p>
                    </div>
                  )}
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => {
                      setFormData((prev) => ({ ...prev, imageUrl: url }))
                    }}
                    onFileChange={(file) => {
                      setFormData((prev) => ({ ...prev, imageFile: file }))
                    }}
                    onUploadStart={() => {
                      setIsImageUploading(true)
                    }}
                    onUploadEnd={() => {
                      setIsImageUploading(false)
                    }}
                    label="Soru Resmi Yükle"
                    maxSize={10}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tip
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as Question['type'])}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Soru tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Çoktan Seçmeli</SelectItem>
                  <SelectItem value="TRUE_FALSE">Doğru/Yanlış</SelectItem>
                  <SelectItem value="TEXT">Metin Cevaplı</SelectItem>
                  <SelectItem value="IMAGE">Resimli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategori
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type !== 'TEXT' && (
              <div className="space-y-2">
                <Label className="text-right col-span-1">Seçenekler</Label>
                <div className="col-span-3 space-y-4">
                  {formData.options.map((option, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Seçenek {index + 1}</Label>
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`Seçenek ${index + 1} metni`}
                          className="w-full"
                        />
                        
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex-1">
                            <ImageUpload
                              value={option.imageUrl || ''}
                              onChange={(url) => updateOption(index, 'imageUrl', url)}
                              label={`Seçenek ${index + 1} Resmi`}
                              maxSize={5}
                              className="mb-2"
                            />
                          </div>
                        </div>
                        
                        {option.imageUrl && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-400 mb-1">Seçenek resmi önizleme:</p>
                            <img 
                              src={option.imageUrl} 
                              alt={`Seçenek ${index + 1}`}
                              className="max-w-full h-auto max-h-24 rounded border border-slate-600"
                              onError={(e) => {
                                e.currentTarget.src = '';
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {formData.type !== 'TRUE_FALSE' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Seçenek Ekle
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="correctAnswer" className="text-right">
                Doğru Cevap
              </Label>
              {formData.type === 'TEXT' ? (
                <Input
                  id="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="col-span-3"
                  required
                />
              ) : (
                <Select
                  value={formData.correctAnswer}
                  onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Doğru cevabı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.options.map((option, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {option.text || `Seçenek ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Zorluk
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Zorluk seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Kolay</SelectItem>
                  <SelectItem value="MEDIUM">Orta</SelectItem>
                  <SelectItem value="HARD">Zor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Puan
              </Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || isImageUploading}
            >
              {isLoading ? 'Kaydediliyor...' : isImageUploading ? 'Resim Yükleniyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface QuestionManagementProps {
  user: any
}

export function QuestionManagement({ user }: QuestionManagementProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    try {
      setError(null)
      const [questionsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/categories')
      ])

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        setQuestions(questionsData)
      } else {
        const errorData = await questionsResponse.json()
        setError(errorData.error || 'Sorular yüklenirken bir hata oluştu')
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      } else {
        const errorData = await categoriesResponse.json()
        setError(errorData.error || 'Kategoriler yüklenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Veriler yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteQuestion = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      setError(null)
      const response = await fetch(`/api/questions/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Soru silinirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      setError('Soru silinirken bir hata oluştu')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (user.role !== 'ADMIN') {
    return null
  }

  const difficultyCounts = questions.reduce(
    (acc, question) => {
      acc[question.difficulty] = (acc[question.difficulty] || 0) + 1
      return acc
    },
    { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<Question['difficulty'], number>
  )

  const typeCounts = questions.reduce<Record<string, number>>((acc, question) => {
    acc[question.type] = (acc[question.type] || 0) + 1
    return acc
  }, {})

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'HARD': return 'bg-rose-50 text-rose-700 border-rose-100'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'Çoktan Seçmeli'
      case 'TRUE_FALSE': return 'Doğru/Yanlış'
      case 'TEXT': return 'Metin Cevaplı'
      case 'IMAGE': return 'Resimli'
      default: return type
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold text-slate-900">Soru Yönetimi</h3>
          <p className="text-sm text-slate-500">
            Soru bankanızı güncelleyin, içerikleri iyileştirin ve kategorilere göre düzenleyin.
          </p>
        </div>
        <QuestionForm categories={categories} onSuccess={fetchData} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100">Toplam Soru</CardDescription>
            <CardTitle className="text-3xl font-semibold">{questions.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-emerald-100">
            Aktif soru bankasında bulunan toplam soru sayısı.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Kolay</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{difficultyCounts.EASY}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            Temel seviyedeki sorular.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Orta</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{difficultyCounts.MEDIUM}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            Standart zorluk seviyesindeki sorular.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-slate-900 text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-300">Zor</CardDescription>
            <CardTitle className="text-3xl font-semibold">{difficultyCounts.HARD}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-300">
            Üst düzey bilgi gerektiren sorular.
          </CardContent>
        </Card>
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeCounts).map(([type, count]) => (
            <Badge
              key={type}
              variant="secondary"
              className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
            >
              {getTypeLabel(type)}: {count}
            </Badge>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card
              key={question.id}
              className="overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {question.content}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                      <Badge variant="secondary" className={getDifficultyColor(question.difficulty)}>
                        {getTypeLabel(question.type)}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full border-blue-100 bg-blue-50 text-blue-700">
                        {question.category.name}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full border-slate-200 bg-white text-slate-700">
                        {question.points} Puan
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuestionForm question={question} categories={categories} onSuccess={fetchData} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(question)}
                      className="border-slate-200 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 p-6">
                {question.imageUrl && (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                      <ImageIcon className="h-4 w-4" />
                      <span>Soru görseli</span>
                    </div>
                    <img src={question.imageUrl} alt="Soru görseli" className="h-56 w-full object-cover" />
                  </div>
                )}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700">Seçenekler</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {question.options.map((option, index) => {
                        const parsedCorrectIndex = Number.parseInt(question.correctAnswer || '', 10)
                        const isCorrect = !Number.isNaN(parsedCorrectIndex)
                          ? index === parsedCorrectIndex
                          : option.text === question.correctAnswer

                        return (
                          <div
                            key={index}
                            className={`flex flex-col gap-3 rounded-lg border px-3 py-3 text-sm shadow-sm transition-colors ${
                              isCorrect
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium text-slate-700">
                                {String.fromCharCode(65 + index)}. {option.text || `Seçenek ${index + 1}`}
                              </span>
                              {isCorrect && (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                  Doğru
                                </Badge>
                              )}
                            </div>
                            {option.imageUrl && (
                              <div className="overflow-hidden rounded-md border border-slate-200">
                                <img
                                  src={option.imageUrl}
                                  alt={`Seçenek ${index + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {question.type === 'TEXT' && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <span className="font-medium">Beklenen cevap:</span> {question.correctAnswer || 'Serbest yanıt'}
                  </div>
                )}
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
            <AlertDialogTitle>Bu soruyu silmek üzeresiniz</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.content}" sorusunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
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