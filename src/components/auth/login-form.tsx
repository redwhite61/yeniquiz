
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/hooks/use-toast'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck
} from 'lucide-react'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast({
          title: "Giriş başarılı!",
          description: "Hoş geldiniz!",
        })
      } else {
        toast({
          title: "Giriş başarısız",
          description: "Email veya şifre hatalı.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Hoş geldiniz</p>
        <h2 className="text-3xl font-semibold tracking-tight">QuizMaster hesabınıza giriş yapın</h2>
        <p className="mt-2 max-w-md text-sm text-white/80">
          Özelleştirilmiş test önerileri, canlı performans takibi ve gelişmiş istatistik panellerine erişin.
        </p>
      </div>
      <CardContent className="px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email adresiniz
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@quizmaster.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Giriş yapılıyor
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Hesabınız yok mu?</span>
              <button
                type="button"
                onClick={onToggleMode}
                className="font-semibold text-blue-600 transition hover:text-blue-500"
              >
                Kayıt ol
              </button>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 bg-slate-50 px-8 py-6">
        <div className="flex items-center gap-3 text-slate-600">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          <p className="text-sm">
            Verileriniz kurumsal düzeyde şifreleme ile korunur ve KVKK uyumludur.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Gerçek zamanlı sonuçlar
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Geniş soru bankası
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}