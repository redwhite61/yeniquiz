'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, BarChart3, Clock, Flame, Gauge, LineChart, Trophy, XCircle } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface UserAnalyticsResponse {
  user: {
    id: string
    name: string | null
    email: string
  }
  summary: {
    totalAttempts: number
    averagePercentage: number
    improvement: number
  }
  learningCurve: { completedAt: string; percentage: number }[]
  categoryPerformance: { category: string; successRate: number; attempts: number }[]
  quizPerformance: { quiz: string; correct: number; total: number; successRate: number; attempts: number }[]
  questionInsights: {
    content: string
    attempts: number
    incorrectRate: number
    averageTime: number
    lastAnsweredAt: string | null
    lastResult: boolean | null
    flag: string | null
  }[]
}

interface UserAnalyticsPanelProps {
  userId: string
  fallbackName?: string | null
  email?: string
}

const tooltipFormatter = (value: number) => `${value}%`

export function UserAnalyticsPanel({ userId, fallbackName, email }: UserAnalyticsPanelProps) {
  const [data, setData] = useState<UserAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/analytics/user/${userId}`)
        if (!response.ok) {
          throw new Error('Kullanıcı analizi yüklenemedi')
        }
        const payload = await response.json()
        setData(payload)
        setError(null)
      } catch (err) {
        console.error('Failed to load user analytics:', err)
        setError('Veriler alınırken bir sorun oluştu.')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.learningCurve.map((point) => ({
      label: new Date(point.completedAt).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short'
      }),
      percentage: point.percentage
    }))
  }, [data])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-32 animate-pulse rounded bg-slate-100" />
        <div className="h-48 animate-pulse rounded bg-slate-100" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border border-rose-200/60 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Analiz yüklenemedi</CardTitle>
          <CardDescription className="text-slate-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <XCircle className="h-4 w-4" />
            Lütfen daha sonra tekrar deneyin.
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayName = data.user.name || fallbackName || data.user.email
  const improvementHighlight =
    data.summary.improvement !== 0
      ? data.summary.improvement > 0
        ? {
            label: `+${data.summary.improvement.toFixed(1)}% ilerleme`,
            badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            iconClass: 'text-emerald-500',
            description: 'Son denemelerde belirgin bir gelişme görülüyor.'
          }
        : {
            label: `${data.summary.improvement.toFixed(1)}% değişim`,
            badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
            iconClass: 'text-amber-500',
            description: 'Son denemelerde küçük düşüşler mevcut.'
          }
      : null

  const strugglingQuestions = data.questionInsights.filter((question) => question.flag)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900">{displayName}</h3>
        <p className="text-sm text-slate-500">{data.user.email || email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ortalama Başarı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <LineChart className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-semibold text-slate-900">%{data.summary.averagePercentage.toFixed(1)}</div>
                <p className="text-xs text-slate-500">Tüm denemelerin ortalaması</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Deneme Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-2xl font-semibold text-slate-900">{data.summary.totalAttempts}</div>
                <p className="text-xs text-slate-500">Tamamlanan test</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Performans Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gauge className="h-8 w-8 text-emerald-500" />
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {data.summary.improvement >= 0 ? '+' : ''}
                  {data.summary.improvement.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500">İlk ve son deneme karşılaştırması</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Öğrenme Eğrisi</CardTitle>
              <CardDescription className="text-slate-500">
                Zaman içerisindeki başarı yüzdesi
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Henüz tamamlanan test bulunmuyor.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                    <YAxis
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      labelFormatter={(label) => `Tarih: ${label}`}
                      cursor={{ stroke: '#2563eb', strokeWidth: 1 }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Soru Bazlı Analiz</CardTitle>
              <CardDescription className="text-slate-500">
                Kullanıcının zorlandığı veya hızlı geçtiği sorular
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.questionInsights.length === 0 ? (
                <p className="rounded-b-lg border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
                  Bu kullanıcı için soru detayı bulunmuyor.
                </p>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-3 px-6 pb-6">
                    {data.questionInsights.map((question, index) => (
                      <div key={`${question.content}-${index}`} className="rounded border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">{question.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="h-3.5 w-3.5" /> %{question.incorrectRate.toFixed(1)} yanlış
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Ortalama {Math.max(question.averageTime, 1)} sn
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5" /> {question.attempts} deneme
                              </span>
                            </div>
                          </div>
                          {question.flag && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              {question.flag}
                            </Badge>
                          )}
                        </div>
                        {question.lastAnsweredAt && (
                          <p className="mt-2 text-xs text-slate-400">
                            Son cevap: {new Date(question.lastAnsweredAt).toLocaleString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {improvementHighlight && (
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Gauge className={`h-9 w-9 ${improvementHighlight.iconClass}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Performans trendi</p>
                    <p className="text-xs text-slate-500">{improvementHighlight.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`${improvementHighlight.badgeClass} text-xs font-medium`}>
                  {improvementHighlight.label}
                </Badge>
              </CardContent>
            </Card>
          )}

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Kategori Performansı</CardTitle>
              <CardDescription className="text-slate-500">
                Hangi alanlarda güçlenmesi gerektiğini inceleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.categoryPerformance.length === 0 ? (
                <p className="rounded-b-lg border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
                  Bu kullanıcı için kategori verisi bulunmuyor.
                </p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 px-6 pb-6">
                    {data.categoryPerformance.map((category) => (
                      <div key={category.category} className="flex items-center justify-between rounded border border-slate-200 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{category.category}</p>
                          <p className="text-xs text-slate-500">{category.attempts} deneme</p>
                        </div>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          %{category.successRate.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Test Performansı</CardTitle>
              <CardDescription className="text-slate-500">
                Sonuçları test bazında görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.quizPerformance.length === 0 ? (
                <p className="rounded-b-lg border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
                  Bu kullanıcı için test verisi bulunmuyor.
                </p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 px-6 pb-6">
                    {data.quizPerformance.map((quiz) => (
                      <div key={quiz.quiz} className="flex items-center justify-between rounded border border-slate-200 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{quiz.quiz}</p>
                          <p className="text-xs text-slate-500">
                            {quiz.correct}/{quiz.total} doğru • {quiz.attempts} deneme
                          </p>
                        </div>
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          %{quiz.successRate.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {strugglingQuestions.length > 0 && (
            <Card className="border border-amber-200 bg-amber-50/60">
              <CardHeader>
                <CardTitle className="text-amber-800">Dikkat Gerektiren Sorular</CardTitle>
                <CardDescription className="text-amber-700">
                  Hızlı doğru cevaplanan veya sürekli yanlış yapılan sorular
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {strugglingQuestions.map((question, index) => (
                  <div key={`${question.content}-${index}`} className="flex items-start gap-3 rounded border border-amber-200 bg-white/70 p-3">
                    <Flame className="mt-1 h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">{question.content}</p>
                      <p className="text-xs text-amber-700">{question.flag}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
