'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Clock,
  Layers,
  ShieldAlert,
  Sparkles,
  Target,
  Users
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart
} from 'recharts'

interface HighlightEntry {
  label: string
  value: string
  description: string
  icon: React.ReactNode
}

interface OverviewResponse {
  totals: {
    totalUsers: number
    totalCategories: number
    totalQuestions: number
    totalQuizzes: number
    totalAttempts: number
    activeUsers: number
  }
  highlights: {
    mostChallengingCategory: { category: string; successRate: number } | null
    mostChallengingQuiz: { quiz: string; successRate: number; attemptCount: number } | null
    mostMissedQuestions: {
      questionId: string
      content: string
      incorrectRate: number
      averageTime: number
      attempts: number
    }[]
  }
  charts: {
    categorySuccess: { category: string; successRate: number }[]
    quizSuccess: { quiz: string; successRate: number; attemptCount: number }[]
    performanceTimeline: { completedAt: string; label: string; percentage: number; quizTitle: string }[]
    hardestQuestions: {
      questionId: string
      content: string
      incorrectRate: number
      averageTime: number
      attempts: number
    }[]
  }
  smartInsights: {
    strugglingAssignments: {
      userId: string
      name: string
      email: string
      categoryId: string
      categoryName: string
      successRate: number
      attemptCount: number
    }[]
    qualityAlerts: {
      questionId: string
      content: string
      incorrectRate: number
      averageTime: number
      attempts: number
    }[]
  }
}

interface TrendPoint {
  label: string
  percentage: number
  quizTitle: string
}

const tooltipFormatter = (value: number) => `${value}%`

export function DashboardOverview() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics/overview')
        if (!response.ok) {
          throw new Error('Veriler yüklenemedi')
        }
        const payload = await response.json()
        setData(payload)
        setError(null)
      } catch (err) {
        console.error('Failed to load admin analytics overview:', err)
        setError('Analitik veriler şu anda yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const highlights: HighlightEntry[] = useMemo(() => {
    if (!data) return []

    const entries: HighlightEntry[] = [
      {
        label: 'En Çok Zorlanılan Kategori',
        value: data.highlights.mostChallengingCategory
          ? `${data.highlights.mostChallengingCategory.category}`
          : 'Veri yok',
        description: data.highlights.mostChallengingCategory
          ? `%${data.highlights.mostChallengingCategory.successRate.toFixed(1)} başarı`
          : 'Henüz yeterli deneme yok',
        icon: <Layers className="h-5 w-5 text-blue-500" />
      },
      {
        label: 'En Çok Zorlanılan Test',
        value: data.highlights.mostChallengingQuiz
          ? data.highlights.mostChallengingQuiz.quiz
          : 'Veri yok',
        description: data.highlights.mostChallengingQuiz
          ? `%${data.highlights.mostChallengingQuiz.successRate.toFixed(1)} başarı • ${data.highlights.mostChallengingQuiz.attemptCount} deneme`
          : 'Henüz yeterli deneme yok',
        icon: <Target className="h-5 w-5 text-rose-500" />
      },
      {
        label: 'Toplam Aktif Öğrenci',
        value: data.totals.activeUsers.toString(),
        description: `${data.totals.totalAttempts} deneme kaydı`,
        icon: <Users className="h-5 w-5 text-emerald-500" />
      },
      {
        label: 'Toplam İçerik',
        value: `${data.totals.totalCategories} kategori • ${data.totals.totalQuizzes} test`,
        description: `${data.totals.totalQuestions} soru`,
        icon: <Activity className="h-5 w-5 text-indigo-500" />
      }
    ]

    return entries
  }, [data])

  const trendPoints: TrendPoint[] = useMemo(() => {
    if (!data) return []
    return data.charts.performanceTimeline.map((point) => ({
      label: point.label,
      percentage: point.percentage,
      quizTitle: point.quizTitle
    }))
  }, [data])

  if (loading) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm animate-pulse">
        <CardHeader>
          <CardTitle className="text-slate-900">Kullanıcı Dashboard Analizi</CardTitle>
          <CardDescription className="text-slate-500">
            Veriler hazırlanıyor...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-white border border-rose-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900">Analitik veriler yüklenemedi</CardTitle>
            <CardDescription className="text-slate-500">
              {error || 'Lütfen daha sonra tekrar deneyin.'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50">
            <AlertTriangle className="mr-2 h-4 w-4" /> Hata
          </Badge>
        </CardHeader>
      </Card>
    )
  }

  const toughestQuestions = data.highlights.mostMissedQuestions
  const qualityAlerts = data.smartInsights.qualityAlerts
  const strugglingAssignments = data.smartInsights.strugglingAssignments

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {highlights.map((item) => (
          <Card key={item.label} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle>
              <div className="rounded-full bg-slate-100 p-2">{item.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-slate-900">{item.value}</div>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Kategori Başarı Oranları</CardTitle>
            <CardDescription className="text-slate-500">
              Öğrencilerin kategori bazlı performans dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.categorySuccess}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                <Bar dataKey="successRate" fill="url(#categoryGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Test Bazlı Başarı</CardTitle>
            <CardDescription className="text-slate-500">
              Zaman içindeki başarı trendi ve testler
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {trendPoints.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Henüz deneme verisi yok
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trendPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => `Tarih: ${label}`} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">En Zorlu Sorular</CardTitle>
            <CardDescription className="text-slate-500">
              Yanlış oranı yüksek sorular ve ortalama süreler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualityAlerts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Problemli soru bulunmadı.
              </div>
            ) : (
              <div className="space-y-3">
                {qualityAlerts.map((item) => (
                  <div key={item.questionId} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.content}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          % {item.incorrectRate.toFixed(1)} yanlış • {item.attempts} deneme
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        <ShieldAlert className="mr-1 h-3.5 w-3.5" /> İncele
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> Ortalama {Math.max(item.averageTime, 1)} sn
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">En Çok Yanlış Yapılan Sorular</CardTitle>
            <CardDescription className="text-slate-500">
              Doğruluk oranı düşen soruları gözden geçirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {toughestQuestions.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Yeterli veri yok.
              </div>
            ) : (
              toughestQuestions.map((question, index) => (
                <div key={question.questionId} className="flex gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{question.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        %{question.incorrectRate.toFixed(1)} yanlış
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Ortalama {Math.max(question.averageTime, 1)} sn
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" /> {question.attempts} deneme
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Akıllı Araçlar</CardTitle>
            <CardDescription className="text-slate-500">
              Admin için önerilen odak alanları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Brain className="h-4 w-4 text-indigo-500" /> Zorlandığı Kartlar
                </div>
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  {strugglingAssignments.length}
                </Badge>
              </div>
              <div className="mt-3 space-y-3">
                {strugglingAssignments.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    Henüz öğrenciler için atanan odak kartı yok.
                  </p>
                ) : (
                  strugglingAssignments.map((assignment) => (
                    <div key={`${assignment.userId}-${assignment.categoryId}`} className="rounded-lg border border-slate-200 p-3 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                        <span>{assignment.name}</span>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                          %{assignment.successRate.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {assignment.categoryName} • {assignment.attemptCount} deneme
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-amber-500" /> Soru Kalite Kontrol
              </div>
              <div className="mt-3 space-y-3">
                {qualityAlerts.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    Şu anda özel inceleme gerektiren soru yok.
                  </p>
                ) : (
                  qualityAlerts.slice(0, 4).map((question) => (
                    <div key={question.questionId} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-700">
                      <div className="font-medium text-amber-800">
                        %{question.incorrectRate.toFixed(1)} yanlış • {question.attempts} deneme
                      </div>
                      <p className="mt-1 text-amber-700 line-clamp-2">{question.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
