'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CalendarDays, Loader2, Megaphone, Save } from 'lucide-react'

interface FormState {
  title: string
  content: string
  icon: string
  date: string
}

export function AnnouncementManagement() {
  const [announcement, setAnnouncement] = useState<{
    id: string
    title: string
    content: string
    icon?: string | null
    date?: string | null
    createdAt: string
    updatedAt: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [formState, setFormState] = useState<FormState>({
    title: '',
    content: '',
    icon: '',
    date: ''
  })

  const loadAnnouncement = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setAnnouncement(data)
          setFormState({
            title: data.title ?? '',
            content: data.content ?? '',
            icon: data.icon ?? '',
            date: data.date ? data.date.slice(0, 10) : ''
          })
        } else {
          setAnnouncement(null)
          setFormState({
            title: '',
            content: '',
            icon: '',
            date: ''
          })
        }
      } else {
        throw new Error('Duyuru yüklenemedi')
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Duyuru yüklenemedi',
        description: 'Lütfen daha sonra tekrar deneyiniz.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncement()
  }, [])

  const formattedDate = useMemo(() => {
    if (!announcement?.date) return null
    try {
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(announcement.date))
    } catch (error) {
      return null
    }
  }, [announcement?.date])

  const handleChange = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value
      }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formState.title,
          content: formState.content,
          icon: formState.icon,
          date: formState.date ? new Date(formState.date).toISOString() : null
        })
      })

      if (!response.ok) {
        throw new Error('Duyuru kaydedilemedi')
      }

      const data = await response.json()
      setAnnouncement(data)
      toast({
        title: 'Duyuru güncellendi',
        description: 'Anasayfada yeni duyuru kartı görüntüleniyor.'
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'İşlem başarısız',
        description: 'Duyuru kaydedilirken bir sorun oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Duyuru Kartı</CardTitle>
            <CardDescription className="text-slate-500">
              Anasayfada görünen hero duyuru kartının başlığını, içeriğini ve isteğe bağlı ikon ile tarih bilgisini buradan
              güncelleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={handleChange('title')}
                  placeholder="Örn. QuizMaster v2.0 yayında"
                  disabled={isLoading || isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Açıklama</Label>
                <Textarea
                  id="content"
                  value={formState.content}
                  onChange={handleChange('content')}
                  placeholder="Güncellemeler veya duyurular metni"
                  rows={5}
                  disabled={isLoading || isSaving}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="icon">İkon (opsiyonel)</Label>
                  <Input
                    id="icon"
                    value={formState.icon}
                    onChange={handleChange('icon')}
                    placeholder="Örn. 🚀 veya megaphone"
                    disabled={isLoading || isSaving}
                    maxLength={10}
                  />
                  <p className="text-xs text-slate-500">
                    Emoji veya kısa bir ikon adı girilebilir.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tarih (opsiyonel)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formState.date}
                    onChange={handleChange('date')}
                    disabled={isLoading || isSaving}
                  />
                  <p className="text-xs text-slate-500">Tarihi boş bırakabilirsiniz.</p>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || isLoading}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Duyuruyu Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Megaphone className="h-5 w-5 text-blue-600" />
              Canlı Önizleme
            </CardTitle>
            <CardDescription className="text-slate-500">
              Değişiklikleri kaydetmeden önce kartın ziyaretçilere nasıl görüneceğini inceleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <div className="absolute inset-y-0 right-0 hidden md:block">
                <div className="absolute -right-12 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-blue-100 blur-3xl opacity-60"></div>
              </div>
              <div className="relative space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Badge variant="secondary" className="flex items-center gap-2 rounded-full bg-blue-50 text-blue-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base">
                      {formState.icon || '📣'}
                    </span>
                    Platform Duyurusu
                  </Badge>
                  {formState.date ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      {new Intl.DateTimeFormat('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }).format(new Date(formState.date))}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {formState.title || 'Başlık'}
                </h3>
                <p className="text-base leading-relaxed text-slate-600">
                  {formState.content || 'Güncellemeler veya duyurular metni burada görüntülenecek.'}
                </p>
                {announcement && !formState.date && formattedDate ? (
                  <p className="text-xs text-slate-400">
                    Son kayıt tarihi: {formattedDate}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
