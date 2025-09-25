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
  const [formData, setFormData] = useState({
    content: question?.content || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    options: question?.options || [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: question?.correctAnswer || '',
    imageUrl: question?.imageUrl || '',
    imageFile: null as File | null,
    points: question?.points || 1,
    difficulty: question?.difficulty || 'MEDIUM',
    categoryId: question?.category.id || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('formData changed:', formData)
  }, [formData])

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
      // For IMAGE type questions, validate that an image is uploaded
      if (formData.type === 'IMAGE' && !formData.imageUrl && !formData.imageFile) {
        setError('Resimli sorular için bir resim yüklemeniz gerekmektedir')
        setIsLoading(false)
        return
      }

      // Validate options for multiple choice and true/false questions
      if ((formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (!formData.options || !Array.isArray(formData.options) || formData.options.length === 0)) {
        setError('Çoktan seçmeli ve doğru/yanlış sorular için seçenekler gereklidir')
        setIsLoading(false)
        return
      }

      console.log('Final formData before submission:', formData)

      const url = question ? `/api/questions/${question.id}` : '/api/questions'
      const method = question ? 'PUT' : 'POST'

      const payload = {
        content: formData.content,
        type: formData.type,
        options: formData.type === 'TEXT' ? null : formData.options.filter(opt => opt.text.trim() !== ''),
        correctAnswer: formData.correctAnswer,
        imageUrl: formData.imageUrl,
        points: formData.points,
        difficulty: formData.difficulty,
        categoryId: formData.categoryId
      }

      console.log('Submitting question:', payload) // Debug log

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
          options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
          correctAnswer: '',
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
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', imageUrl: '' }]
    })
  }

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
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

            {(formData.type === 'IMAGE' || formData.type === 'MULTIPLE_CHOICE') && (
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
                      console.log('ImageUpload onChange called with URL:', url)
                      console.log('Current formData.imageUrl:', formData.imageUrl)
                      setFormData(prev => {
                        console.log('Updating formData imageUrl from', prev.imageUrl, 'to', url)
                        return { ...prev, imageUrl: url }
                      })
                    }}
                    onFileChange={(file) => {
                      console.log('ImageUpload onFileChange called with file:', file?.name)
                      setFormData(prev => ({ ...prev, imageFile: file }))
                    }}
                    onUploadStart={() => {
                      console.log('Upload started')
                      setIsImageUploading(true)
                    }}
                    onUploadEnd={() => {
                      console.log('Upload ended')
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
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/questions/${questionId}`, {
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
    }
  }

  if (user.role !== 'ADMIN') {
    return null
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-600/20 text-green-300 border-green-600/50'
      case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/50'
      case 'HARD': return 'bg-red-600/20 text-red-300 border-red-600/50'
      default: return 'bg-slate-600/20 text-slate-300 border-slate-600/50'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Soru Yönetimi</h3>
          <p className="text-sm text-slate-400">Test sorularını yönetin</p>
        </div>
        <QuestionForm categories={categories} onSuccess={fetchData} />
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
          {questions.map((question) => (
            <Card key={question.id} className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-lg text-white">{question.content}</CardTitle>
                  <CardDescription className="mt-1 text-slate-400">
                    {question.category.name} • {getTypeLabel(question.type)}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <QuestionForm
                    question={question}
                    categories={categories}
                    onSuccess={fetchData}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="border-slate-600 text-slate-300 hover:bg-red-600/20 hover:text-red-300 hover:border-red-600/50 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.imageUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={question.imageUrl} 
                        alt="Soru resmi" 
                        className="max-w-full h-auto max-h-32 rounded-md border border-slate-600"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {question.type !== 'TEXT' && question.type !== 'IMAGE' && question.options.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-slate-300">Seçenekler:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {question.options.map((option, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-3 p-2 rounded text-sm ${
                              index.toString() === question.correctAnswer
                                ? 'bg-green-600/20 text-green-300 border border-green-600/50'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                            }`}
                          >
                            <span className="font-medium min-w-[20px]">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <span className="flex-1">{option.text}</span>
                            {option.imageUrl && (
                              <img 
                                src={option.imageUrl} 
                                alt={`Seçenek ${index + 1}`}
                                className="h-8 w-8 rounded object-cover border border-slate-500"
                                onError={(e) => {
                                  e.currentTarget.src = '';
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'TEXT' && (
                    <div>
                      <p className="text-sm font-medium mb-1 text-slate-300">Doğru Cevap:</p>
                      <p className="text-sm bg-green-600/20 text-green-300 p-2 rounded border border-green-600/50">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty === 'EASY' ? 'Kolay' : 
                       question.difficulty === 'MEDIUM' ? 'Orta' : 'Zor'}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-600/20 text-slate-300 border-slate-600/50">
                      {question.points} Puan
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}