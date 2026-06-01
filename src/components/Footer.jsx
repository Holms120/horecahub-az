import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import Logo from './Logo'

const COLS = [
  {
    title: 'Platforma',
    links: [
      { label: 'Avadanlıq',    href: '/listings?category=kitchen' },
      { label: 'Kadrlar',      href: '/listings?category=staff' },
      { label: 'Təchizatçılar',href: '/listings?category=suppliers' },
      { label: 'Bütün kateqoriyalar', href: '/listings' },
    ],
  },
  {
    title: 'Şirkət',
    links: [
      { label: 'Haqqımızda',   href: '/' },
      { label: 'Blog',         href: '/' },
      { label: 'Karyera',      href: '/' },
      { label: 'Tərəfdaşlar',  href: '/' },
    ],
  },
  {
    title: 'Dəstək',
    links: [
      { label: 'Suallar (FAQ)', href: '/' },
      { label: 'Əlaqə',         href: '/' },
      { label: 'İstifadə şərtləri', href: '/' },
      { label: 'Məxfilik siyasəti', href: '/' },
    ],
  },
]

export default function Footer() {
  return (
    <footer id="footer" className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              <Logo light height={30} />
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Azərbaycanın HoReCa sektorunu bir platformada birləşdiririk.
            </p>
            <div className="space-y-2">
              {[
                { Icon: MapPin, text: 'Bakı, Azərbaycan' },
                { Icon: Phone, text: '+994 12 XXX XX XX' },
                { Icon: Mail,  text: 'info@horecahub.az' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/40 text-xs">
                  <Icon size={12} />
                  <span>{text}</span>
                </div>
              ))}
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
            © 2025 HorecaHub.az. Bütün hüquqlar qorunur.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/30 tracking-widest uppercase">Sistem aktiv</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
