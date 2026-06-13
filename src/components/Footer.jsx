import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'
import Logo from './Logo'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  const COLS = [
    {
      title: t('footer.platform'),
      links: [
        { label: t('footer.equipment'),    href: '/listings?category=kitchen' },
        { label: t('footer.staff'),        href: '/listings?category=staff' },
        { label: t('footer.suppliers'),    href: '/listings?category=suppliers' },
        { label: t('footer.allCategories'),href: '/listings' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.about'),    href: '/about' },
        { label: t('footer.blog'),     href: '/blog' },
        { label: t('footer.careers'),  href: '/careers' },
        { label: t('footer.partners'), href: '/partners' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.faq'),     href: '/faq' },
        { label: t('footer.contact'), href: '/contact' },
        { label: t('footer.terms'),   href: '/terms' },
        { label: t('footer.privacy'), href: '/privacy' },
      ],
    },
  ]

  return (
    <footer id="footer" className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              <Logo light height={30} />
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              {t('footer.desc')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Phone size={12} />
                <a href="tel:+9940556222912" className="hover:text-white transition-colors">
                  +994 055 622 29 12
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Mail size={12} />
                <a href="mailto:info@horecahub.az" className="hover:text-white transition-colors">
                  info@horecahub.az
                </a>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <a href="https://www.instagram.com/horecahub.az" target="_blank" rel="noreferrer"
                  className="text-white/40 hover:text-white transition-colors">
                  <Instagram size={16} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61589830914631" target="_blank" rel="noreferrer"
                  className="text-white/40 hover:text-white transition-colors">
                  <Facebook size={16} />
                </a>
              </div>
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-white/40 tracking-widest uppercase mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/55 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/30 tracking-widest uppercase">{t('footer.systemActive')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
