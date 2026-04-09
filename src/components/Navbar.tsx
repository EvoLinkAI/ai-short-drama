'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AppIcon } from '@/components/ui/icons'

export default function Navbar() {
  const { data: session, status } = useSession()
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const userName = session?.user?.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 h-[64px] bg-white/80 backdrop-blur-[10px] border-b border-[#e5e5e5]">
      <div className="h-full px-6 grid grid-cols-3 items-center">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href={{ pathname: '/' as never }} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-small.png" alt="AIDrama" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight text-[#171717]">AIDrama</span>
          </Link>
        </div>

        {/* Center: Nav links (logged in only) */}
        <div className="flex items-center justify-center gap-8">
          {status !== 'loading' && session && (
            <>
              <Link
                href={{ pathname: '/workspace' }}
                className="text-sm text-[#525252] hover:text-[#171717] font-medium transition-colors"
              >
                {t('workspace')}
              </Link>
              <Link
                href={{ pathname: '/workspace/asset-hub' }}
                className="text-sm text-[#525252] hover:text-[#171717] font-medium transition-colors"
              >
                {t('assetHub')}
              </Link>
            </>
          )}
        </div>

        {/* Right: User menu / Auth */}
        <div className="flex items-center justify-end gap-4">
          {status === 'loading' ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-14 rounded bg-[#f5f5f5] animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-[#f5f5f5] animate-pulse" />
            </div>
          ) : session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center text-sm font-semibold">
                  {userInitial}
                </div>
                <span className="text-sm font-medium text-[#171717] hidden sm:inline">{userName}</span>
                <AppIcon name="chevronDown" className={`w-3 h-3 text-[#737373] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#e5e5e5]">
                    <div className="text-sm font-semibold text-[#171717]">{userName}</div>
                    <div className="text-xs text-[#737373] mt-0.5">Personal Account</div>
                  </div>
                  <div className="py-1">
                    <Link
                      href={{ pathname: '/profile' }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#525252] hover:bg-[#f5f5f5] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <AppIcon name="settingsHex" className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-[#e5e5e5] py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                    >
                      <AppIcon name="logout" className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href={{ pathname: '/auth/signin' }}
                className="text-sm text-[#525252] hover:text-[#171717] font-medium transition-colors"
              >
                {t('signin')}
              </Link>
              <Link
                href={{ pathname: '/auth/signup' }}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-[#262626] transition-colors"
              >
                {t('signup')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
