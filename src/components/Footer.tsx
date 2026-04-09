import Link from 'next/link';

const productLinks = [
  { title: 'Video Generation', href: '#video' },
  { title: 'Image Generation', href: '#image' },
  { title: 'Voice Synthesis', href: '#voice' },
];

const companyLinks = [
  { title: 'About', href: '#about' },
  { title: 'Contact', href: '#contact' },
  { title: 'Privacy', href: '#privacy' },
];

export function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main row */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* Brand */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-small.png" alt="AIDrama" className="h-6 w-auto" />
              <span className="text-base font-semibold tracking-tight text-[#171717]">AIDrama</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#737373]">
              AI creative platform for video and image generation. Top models, one workspace.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-12 sm:gap-16">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-widest mb-4 text-[#525252]">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5">
                {productLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#737373] hover:text-[#171717] transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-widest mb-4 text-[#525252]">
                Company
              </h3>
              <ul className="flex flex-col gap-2.5">
                {companyLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#737373] hover:text-[#171717] transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright row */}
        <div className="mt-10 pt-6 border-t border-[#e5e5e5] flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-[#737373]">
            © 2026 AIDrama. All rights reserved.
          </p>
          <p className="text-xs text-[#a3a3a3]">
            Powered by{' '}
            <a href="https://evolink.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#737373] transition-colors">
              EvoLinkAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
