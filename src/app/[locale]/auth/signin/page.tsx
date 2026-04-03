'use client'

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Link, useRouter } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'

export default function SignIn() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error === 'RateLimited') {
        setError("Too many attempts. Please try again later.")
      } else if (result?.error) {
        setError("Invalid username or password.")
      } else {
        router.push(buildAuthenticatedHomeTarget())
        router.refresh()
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
          <span className="text-2xl font-bold tracking-tight text-[#171717] mb-8 block">AiDrama</span>

          <h1 className="text-2xl font-semibold text-[#171717]">
            Welcome back
          </h1>
          <p className="mt-2 text-[#737373]">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#737373] mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder="Enter your username"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-md bg-white text-[#171717] placeholder:text-[#a3a3a3] focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-md font-medium hover:bg-[#262626] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#737373]">
            Don&apos;t have an account?{" "}
            <Link
              href={{ pathname: '/auth/signup' }}
              className="text-black font-medium hover:underline"
            >
              Sign up
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
