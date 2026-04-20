import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import { Providers } from "./providers";
import { locales } from '@/i18n/routing';
import RouteTracker from '@/components/analytics/RouteTracker';

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || '';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});



type SupportedLocale = (typeof locales)[number]

// 动态元数据生成
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'layout' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aidrama.dev'
    return {
        metadataBase: new URL(appUrl),
        title: t('title'),
        description: t('description'),
        icons: {
            icon: '/favicon.svg',
            shortcut: '/favicon.svg',
            apple: '/favicon.svg',
        },
        openGraph: {
            url: appUrl,
            title: t('title'),
            description: t('description'),
        },
        other: {
            generator: 'EvoLinkAI Platform',
        },
    };
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // 验证 locale 是否有效
    if (!locales.includes(locale as SupportedLocale)) {
        notFound();
    }

    // 获取翻译消息
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <head>
                {process.env.NODE_ENV === "development" && (
                    <Script
                        src="//unpkg.com/react-grab/dist/index.global.js"
                        crossOrigin="anonymous"
                        strategy="beforeInteractive"
                    />
                )}
            </head>
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
            >
                {GA_ID && (
                    <>
                        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
                        <Script id="ga4-init" strategy="afterInteractive">{`
                            window.dataLayer=window.dataLayer||[];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js',new Date());
                            gtag('config','${GA_ID}');
                        `}</Script>
                    </>
                )}
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
                {GA_ID && <RouteTracker />}
            </body>
        </html>
    );
}
