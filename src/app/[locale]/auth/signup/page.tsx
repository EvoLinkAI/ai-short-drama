'use client'

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from 'next-intl'
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator"
import { apiFetch } from '@/lib/api-fetch'
import { Link, useRouter } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'
import { trackEvent } from '@/lib/analytics'

function resolveSignupErrorKey(data: Record<string, unknown>): {
  key: string
  values?: Record<string, string | number>
} {
  const code = typeof data?.code === 'string' ? data.code : ''
  const field = typeof data?.field === 'string' ? data.field : ''
  const reason = typeof data?.reason === 'string' ? data.reason : ''
  const minLength = typeof data?.minLength === 'number' ? data.minLength : 6

  if (code === 'CONFLICT' && field === 'name' && reason === 'taken') {
    return { key: 'errors.usernameTaken' }
  }
  if (code === 'INVALID_PARAMS' && field === 'name' && reason === 'required') {
    return { key: 'errors.usernameRequired' }
  }
  if (code === 'INVALID_PARAMS' && field === 'password' && reason === 'required') {
    return { key: 'errors.passwordRequired' }
  }
  if (code === 'INVALID_PARAMS' && field === 'password' && reason === 'tooShort') {
    return { key: 'errors.passwordTooShort', values: { minLength } }
  }
  return { key: 'errors.signupGeneric' }
}

export default function SignUp() {
  const t = useTranslations('auth')
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // ── Client-side guards (mirror server rules) ───────────────────
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort', { minLength: 6 }))
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(t('errors.rateLimited'))
        } else {
          const { key, values } = resolveSignupErrorKey(data)
          setError(t(key, values))
        }
        setLoading(false)
        return
      }

      trackEvent('sign_up')
      setSuccess(t('signup.successAutoSignin'))
      const signInResult = await signIn('credentials', {
        username: name,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setSuccess(t('signup.successFallback'))
        setTimeout(() => {
          router.push({ pathname: '/auth/signin' })
        }, 1200)
        return
      }

      router.push(buildAuthenticatedHomeTarget())
      router.refresh()
    } catch {
      setError(t('errors.network'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-small.png" alt="AIDrama" className="h-8 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-[#171717]">AIDrama</span>
          </div>

          <h1 className="text-2xl font-semibold text-[#171717]">
            {t('signup.title')}
          </h1>
          <p className="mt-2 text-[#737373]">
            {t('signup.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                {t('signup.usernameLabel')}
              </label>
              <input
                id="name"
                name="username"
                type="text"
                autoComplete="username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder={t('signup.usernamePlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                {t('signup.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder={t('signup.emailPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                {t('signup.phoneLabel')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder={t('signup.phonePlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                {t('signup.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder={t('signup.passwordPlaceholder')}
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                {t('signup.confirmPasswordLabel')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder={t('signup.confirmPasswordPlaceholder')}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-md font-medium hover:bg-[#262626] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('signup.submitLoading') : t('signup.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#737373]">
            {t('signup.hasAccount')}{" "}
            <Link
              href={{ pathname: '/auth/signin' }}
              className="text-black font-medium hover:underline"
            >
              {t('signup.signinLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] items-center justify-center rounded-l-3xl relative overflow-hidden">
        <div className="relative z-10 max-w-md px-12 text-center">
          <h2 className="text-4xl font-mono font-semibold text-white leading-tight whitespace-pre-line">
            {t('brand.headline')}
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            {t('brand.description')}
          </p>
        </div>

        {/* Bottom glow decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-t from-emerald-500/10 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  )
}
