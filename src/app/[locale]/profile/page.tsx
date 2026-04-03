'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import AppSidebar from '@/components/AppSidebar'
import { EvolinkApiKeyCard } from './components/EvolinkApiKeyCard'
import ApiConfigTab from './components/ApiConfigTab'
import { useRouter } from '@/i18n/navigation'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const tc = useTranslations('common')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push({ pathname: '/auth/signin' }); return }
  }, [router, session, status])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-[#525252]">{tc('loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafafa] overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Settings header */}
          <div className="border-b border-[#e5e5e5] bg-white px-8 py-6">
            <h1 className="text-2xl font-semibold text-[#171717]">Settings</h1>
            <p className="text-sm text-[#525252] mt-1">Configure your EvoLink API connection</p>
          </div>

          {/* Settings Content */}
          <div className="px-8 py-6 space-y-4">
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
              <EvolinkApiKeyCard />
            </div>
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
              <ApiConfigTab />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
