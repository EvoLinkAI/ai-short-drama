'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Link } from '@/i18n/navigation'

export default function Home() {
  const { data: session } = useSession()
  const t = useTranslations('landing')

  return (
    <div className="min-h-screen font-sans bg-white">
      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Heading */}
            <h1 className="font-mono text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.15] text-[#171717] mb-6">
              {t('hero.titleLine1')}
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
              {t('hero.titleSuffix')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-[#737373] max-w-2xl mx-auto mb-10">
              {t('hero.subtitle')}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col items-center gap-3">
              <Link
                href={{ pathname: session ? '/workspace' : '/auth/signup' }}
                className="px-10 py-4 rounded-full text-base font-semibold bg-black text-white hover:bg-[#333] transition-all duration-200"
              >
                {session ? t('hero.ctaLoggedIn') : t('hero.ctaLoggedOut')}
              </Link>
              <span className="text-sm text-[#a3a3a3]">{t('hero.noCreditCard')}</span>
            </div>
          </div>
        </section>

        {/* Video Showcase */}
        <section className="py-10 overflow-hidden bg-[#f5f5f5]">
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <h2 className="font-mono text-2xl md:text-3xl font-normal text-center text-[#171717]">
              {t('showcase.title')}
            </h2>
          </div>
          <div className="flex gap-5 animate-scroll">
            {[...Array(2)].map((_, setIdx) =>
              [
                '01-romance', '02-revenge', '03-scifi', '04-anime',
                '05-action', '06-luxury', '07-drama', '08-fantasy',
              ].map((name, i) => (
                <div
                  key={`${setIdx}-${i}`}
                  className="flex-shrink-0 w-[280px] rounded-xl overflow-hidden bg-black"
                >
                  <video
                    src={`/videos/showcase/${name}.mp4`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full aspect-[9/16] object-cover"
                  />
                </div>
              ))
            )}
          </div>
          <style jsx>{`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-scroll {
              animation: scroll 40s linear infinite;
            }
          `}</style>
        </section>
      </main>

      <Footer />
    </div>
  )
}
