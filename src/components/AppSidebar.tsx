'use client'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { AppIcon, type AppIconName } from '@/components/ui/icons'

interface SidebarItem {
  id: string
  label: string
  icon: AppIconName
  href: string
}

const NAV_ITEMS: SidebarItem[] = [
  { id: 'workspace', label: 'Create', icon: 'monitor', href: '/workspace' },
  { id: 'asset-hub', label: 'Gallery', icon: 'folderHeart', href: '/workspace/asset-hub' },
]

export default function AppSidebar() {
  const pathname = usePathname() ?? ''
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <aside className="w-[200px] flex-shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col overflow-y-auto">
      {/* User info */}
      <div className="p-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#171717] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#171717] truncate">{userName}</div>
            <div className="text-xs text-[#737373]">Default User</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === 'asset-hub'
            ? pathname.includes('/asset-hub')
            : pathname.endsWith('/workspace') || !!pathname.match(/\/workspace\?/)

          return (
            <Link
              key={item.id}
              href={{ pathname: item.href as never }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#171717] text-white font-medium'
                  : 'text-[#525252] hover:bg-[#f5f5f5]'
              }`}
            >
              <AppIcon name={item.icon} className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + Sign Out — pinned to bottom */}
      <div className="mt-auto p-3 border-t border-[#e5e5e5] space-y-1">
        <Link
          href={{ pathname: '/profile' as never }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            pathname.includes('/profile')
              ? 'bg-[#171717] text-white font-medium'
              : 'text-[#525252] hover:bg-[#f5f5f5]'
          }`}
        >
          <AppIcon name="settingsHex" className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          <AppIcon name="logout" className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
