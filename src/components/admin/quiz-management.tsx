'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Clock, BookOpen, HelpCircle } from 'lucide-react'
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
  description?: string
  color?: string
}

interface Question {
  id: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  options?: string[]
  correctAnswer: string
  categoryId: string
  category: {
    name: string
  }
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  categoryId: string
  category: {
    name: string
    color?: string
  }
  questions: {
    id: string
    order: number
    question: Question
  }[]
  _count: {
    questions: number
    attempts: number
  }
}

interface QuizFormData {
  title: string
  description?: string
  timeLimit?: number
  categoryId: string
  questionIds: string[]
}

export function QuizManagement({ user }: { user: any }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    timeLimit: undefined,
    categoryId: '',
    questionIds: []
  })

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const fetchQuizzes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchQuestions()
    fetchQuizzes()
  }, [])

  const totalQuizQuestions = quizzes.reduce((sum, quiz) => sum + quiz._count.questions, 0)
  const totalAttempts = quizzes.reduce((sum, quiz) => sum + quiz._count.attempts, 0)
  const averageQuestionCount = quizzes.length ? Math.round(totalQuizQuestions / quizzes.length) : 0
  const categoryCoverage = new Set(quizzes.map((quiz) => quiz.category?.name)).size

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuestionToggle = (questionId: string, checked: boolean) => {
    setSelectedQuestions(prev => {
      if (checked) {
        return [...prev, questionId]
      } else {
        return prev.filter(id => id !== questionId)
      }
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      timeLimit: undefined,
      categoryId: '',
      questionIds: []
    })
    setSelectedQuestions([])
    setEditingQuiz(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Test başlığı gereklidir')
      return
    }

    if (!formData.categoryId) {
      setError('Kategori seçimi gereklidir')
      return
    }

    if (selectedQuestions.length === 0) {
      setError('En az bir soru seçmelisiniz')
      return
    }

    setIsLoading(true)
    try {
      const url = editingQuiz ? `/api/quizzes/${editingQuiz.id}` : '/api/quizzes'
      const method = editingQuiz ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        questionIds: selectedQuestions
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: editingQuiz ? 'Test güncellendi' : 'Test oluşturuldu',
          description: editingQuiz ? 'Test başarıyla güncellendi.' : 'Yeni test başarıyla oluşturuldu.',
        })
        setIsDialogOpen(false)
        resetForm()
        fetchQuizzes()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Error saving quiz:', error)
      setError('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (quiz: Quiz) => {
    try {
      // Fetch full quiz details with questions
      const response = await fetch(`/api/quizzes/${quiz.id}`)
      if (response.ok) {
        const fullQuiz = await response.json()
        
        setEditingQuiz(fullQuiz)
        setFormData({
          title: fullQuiz.title,
          description: fullQuiz.description || '',
          timeLimit: fullQuiz.timeLimit,
          categoryId: fullQuiz.categoryId,
          questionIds: fullQuiz.questions.map(q => q.question.id)
        })
        setSelectedQuestions(fullQuiz.questions.map(q => q.question.id))
        setIsDialogOpen(true)
      } else {
        toast({
          title: 'Hata',
          description: 'Test detayları yüklenirken bir hata oluştu.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error)
      toast({
        title: 'Hata',
        description: 'Test detayları yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/quizzes/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Test silindi',
          description: 'Test başarıyla silindi.',
        })
        fetchQuizzes()
      } else {
        const errorData = await response.json()
        toast({
          title: 'Hata',
          description: errorData.message || 'Test silinirken bir hata oluştu.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast({
        title: 'Hata',
        description: 'Test silinirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredQuestions = questions.filter(question => 
    !formData.categoryId || question.categoryId === formData.categoryId
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold text-slate-900">Test Yönetimi</h3>
          <p className="text-sm text-slate-500">
            Ölçme deneyimini yönetin, kapsamı genişletin ve takımı bilgilendirin.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border border-slate-200 bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {editingQuiz ? 'Test Düzenle' : 'Yeni Test Oluştur'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Test bilgilerini girin, kategori seçin ve içerikleri ilişkilendirin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-600">Test Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Örn. Genel Kültür Değerlendirmesi"
                    className="border-slate-200 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-600">Kategori *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleInputChange('categoryId', value)}
                  >
                    <SelectTrigger className="border-slate-200 text-slate-900">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent className="border border-slate-200 bg-white">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-slate-700 hover:bg-blue-50">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-600">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Testin kapsamı ve beklentileri hakkında bilgi ekleyin"
                  rows={3}
                  className="border-slate-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit" className="text-slate-600">Süre Limiti (dakika)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    value={formData.timeLimit || ''}
                    onChange={(e) => handleInputChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Örn. 30"
                    className="border-slate-200 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Testi öne çıkar</Label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    Sınav süresi bırakıldığında adaylara süre baskısı oluşturur ve raporlamada görünür.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600">Sorular</Label>
                  <Badge variant="secondary" className="rounded-full border-blue-100 bg-blue-50 text-blue-700">
                    {selectedQuestions.length} soru seçildi
                  </Badge>
                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                      {formData.categoryId ? 'Bu kategoride soru bulunmuyor' : 'Soruları görmek için kategori seçin'}
                    </div>
                  ) : (
                    filteredQuestions.map((question) => (
                      <div key={question.id} className="flex items-start gap-3">
                        <Switch
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked) => handleQuestionToggle(question.id, checked)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{question.content}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <Badge variant="outline" className="border-slate-200 text-slate-600">
                              {question.type === 'MULTIPLE_CHOICE' ? 'Çoktan Seçmeli' :
                                question.type === 'TRUE_FALSE' ? 'Doğru/Yanlış' : 'Kısa Cevap'}
                            </Badge>
                            <Badge variant="secondary" className="border-blue-100 bg-blue-50 text-blue-700">
                              {question.category.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                  className="border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : editingQuiz ? 'Güncelle' : 'Oluştur'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-100">Toplam Test</CardDescription>
            <CardTitle className="text-3xl font-semibold">{quizzes.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-indigo-100">
            Platformda yayınlanan aktif testler.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Toplam Soru</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{totalQuizQuestions}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            Testlere bağlı toplam soru adedi.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Katılım</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{totalAttempts}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            Tamamlanan deneme sayısı.
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-slate-900 text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-300">Kapsam</CardDescription>
            <CardTitle className="text-3xl font-semibold">{categoryCoverage}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-300">
            Kapsanan farklı kategori sayısı.
          </CardContent>
        </Card>
      </div>

      {isLoading && !isDialogOpen ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {quizzes.length === 0 ? (
            <Card className="border border-dashed border-slate-300 bg-white text-center shadow-none">
              <CardContent className="py-12">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900">Henüz test bulunmuyor</h3>
                <p className="mt-2 text-sm text-slate-500">
                  İlk testi oluşturmak için "Yeni Test" butonunu kullanın.
                </p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${quiz.category.color || '#2563eb'} 0%, rgba(15,23,42,0.08) 100%)` }}
                />
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full border-blue-100 bg-blue-50 text-blue-700">
                        {quiz.category.name}
                      </Badge>
                      {quiz.timeLimit && (
                        <Badge variant="outline" className="flex items-center gap-1 border-amber-200 text-amber-600">
                          <Clock className="h-3 w-3" />
                          {quiz.timeLimit} dk
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-full border-slate-200 bg-white text-slate-600">
                        Ortalama {averageQuestionCount} soru
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <CardDescription className="mt-1 text-sm text-slate-500">{quiz.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quiz)}
                      className="border-slate-200 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(quiz)}
                      className="border-slate-200 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-500" />
                    <span>{quiz._count.questions} soru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span>{quiz._count.attempts} çözüm</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
            <AlertDialogTitle>Testi silmek üzeresiniz</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" testini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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