'use client'

import { useState } from "react"
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator"
import { apiFetch } from '@/lib/api-fetch'
import { Link, useRouter } from '@/i18n/navigation'

export default function SignUp() {
  const [name, setName] = useState("")
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Account created! Redirecting to sign in...")
        setTimeout(() => {
          router.push({ pathname: '/auth/signin' })
        }, 2000)
      } else {
        setError(data.message || "Registration failed. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
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
            Create an account
          </h1>
          <p className="mt-2 text-[#737373]">
            Start creating amazing videos
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                Username
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
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                Password
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
                placeholder="At least 6 characters"
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                Confirm Password
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
                placeholder="Re-enter your password"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#737373]">
            Already have an account?{" "}
            <Link
              href={{ pathname: '/auth/signin' }}
              className="text-black font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] items-center justify-center rounded-l-3xl relative overflow-hidden">
        <div className="relative z-10 max-w-md px-12 text-center">
          <h2 className="text-4xl font-mono font-semibold text-white leading-tight">
            Transform Stories
            <br />
            Into Videos
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            AI-powered novel-to-video production platform.
            Turn your imagination into cinematic reality.
          </p>
        </div>

        {/* Bottom glow decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-t from-emerald-500/10 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  )
}
