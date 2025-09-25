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

  const handleDelete = async (quizId: string) => {
    if (!confirm('Bu testi silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
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
      setIsLoading(false)
    }
  }

  const filteredQuestions = questions.filter(question => 
    !formData.categoryId || question.categoryId === formData.categoryId
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Test Yönetimi</h3>
          <p className="text-sm text-slate-500">Testleri oluşturun, düzenleyin ve silin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900 font-semibold">
                {editingQuiz ? 'Test Düzenle' : 'Yeni Test Oluştur'}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Test bilgilerini girin ve soruları seçin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-600">Test Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Test başlığını girin"
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-600">Kategori *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleInputChange('categoryId', value)}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200">
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
                  placeholder="Test açıklamasını girin"
                  rows={3}
                  className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit" className="text-slate-600">Süre Limiti (dakika)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={formData.timeLimit || ''}
                  onChange={(e) => handleInputChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Örn: 30"
                  className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600">Sorular</Label>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                    {selectedQuestions.length} soru seçildi
                  </Badge>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3 bg-slate-50">
                  {filteredQuestions.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">
                      {formData.categoryId ? 'Bu kategoride soru bulunmuyor' : 'Önce bir kategori seçin'}
                    </p>
                  ) : (
                    filteredQuestions.map((question) => (
                      <div key={question.id} className="flex items-start space-x-3">
                        <Switch
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked) => handleQuestionToggle(question.id, checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{question.content}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                              {question.type === 'MULTIPLE_CHOICE' ? 'Çoktan Seçmeli' :
                               question.type === 'TRUE_FALSE' ? 'Doğru/Yanlış' : 'Kısa Cevap'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
                              {question.category.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter>
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
                  {isLoading ? 'Kaydediliyor...' : (editingQuiz ? 'Güncelle' : 'Oluştur')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && !isDialogOpen ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.length === 0 ? (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-900">Henüz test bulunmuyor</h3>
                <p className="text-slate-500 mb-4">
                  İlk testi oluşturmak için "Yeni Test" butonuna tıklayın.
                </p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full ring-2 ring-slate-100"
                          style={{ backgroundColor: quiz.category.color || '#3B82F6' }}
                        />
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">{quiz.category.name}</Badge>
                        {quiz.timeLimit && (
                          <Badge variant="outline" className="border-amber-200 text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {quiz.timeLimit} dk
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-slate-900">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <CardDescription className="text-slate-500">{quiz.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(quiz)}
                        className="border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(quiz.id)}
                        disabled={isLoading}
                        className="border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <HelpCircle className="h-4 w-4" />
                      <span className="text-slate-600">{quiz._count.questions} soru</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-slate-600">{quiz._count.attempts} çözüm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}