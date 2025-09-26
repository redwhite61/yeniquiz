
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
  BadgeCheck,
  Check,
  Loader2,
  LockKeyhole,
  Mail,
  User
} from 'lucide-react'

interface RegisterFormProps {
  onToggleMode: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Lütfen şifrelerin aynı olduğundan emin olun.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Şifre çok kısa",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const success = await register(email, password, name)
      if (success) {
        toast({
          title: "Kayıt başarılı!",
          description: "Hoş geldiniz!",
        })
      } else {
        toast({
          title: "Kayıt başarısız",
          description: "Bu email adresi zaten kullanılıyor.",
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
    <Card className="w-full max-w-xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-emerald-200/50">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Yeni hesap</p>
        <h2 className="text-3xl font-semibold tracking-tight">Dakikalar içinde aramıza katılın</h2>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Ekip arkadaşlarınızla yarışın, özelleştirilmiş sınavlar oluşturun ve başarılarınızı kurumsal panelden yönetin.
        </p>
      </div>
      <CardContent className="px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                İsim (isteğe bağlı)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Adınız ve soyadınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Kurumsal email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="isim.soyisim@firma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Şifre
                </Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Şifre tekrar
                </Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Şifrenizi doğrulayın"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 transition focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kayıt yapılıyor
                </>
              ) : (
                <>
                  Kayıt Ol
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Zaten hesabınız var mı?</span>
              <button
                type="button"
                onClick={onToggleMode}
                className="font-semibold text-emerald-600 transition hover:text-emerald-500"
              >
                Giriş yap
              </button>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 bg-slate-50 px-8 py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Takım liderlik panosu", "Detaylı ilerleme raporları", "Kişiselleştirilmiş soru havuzu"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Kaydolarak kullanım şartlarını ve gizlilik politikamızı kabul etmiş olursunuz.
        </p>
      </CardFooter>
    </Card>
  )
}