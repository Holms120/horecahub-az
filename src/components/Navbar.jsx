import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Menu, X, Plus, Search, LogOut, User, MessageSquare, Pencil, Heart } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [dropOpen, setDropOpen]       = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const NAV_LINKS = [
    { label: t('nav.staff'),       href: '/listings?category=staff' },
    { label: t('nav.suppliers'),   href: '/listings?category=suppliers' },
    { label: t('nav.howItWorks'),  href: '/how-it-works' },
  ]

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    async function fetchUnread() {
      try {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false)
        setUnreadCount(count || 0)
      } catch { setUnreadCount(0) }
    }
    fetchUnread()
    const iv = setInterval(fetchUnread, 30000)
    return () => clearInterval(iv)
  }, [user])

  async function handleSignOut() {
    await signOut()
    setDropOpen(false)
    navigate('/')
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex-shrink-0">
            <Logo height={32} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <Link key={link.label} to={link.href}
                className="text-sm font-medium text-gray-600 hover:text-navy transition-colors duration-150">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/listings" className="p-2 text-gray-500 hover:text-navy hover:bg-gray-50 rounded-lg transition-colors">
              <Search size={20} />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-navy max-w-[120px] truncate">
                    {user.email}
                  </span>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
                    <Link to={`/profile/${user.id}`} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50">
                      <User size={16} className="text-gray-400" /> {t('nav.myProfile')}
                    </Link>
                    <Link to={`/profile/${user.id}?tab=favorites`} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50">
                      <Heart size={16} className="text-red-400" /> {t('nav.favorites')}
                    </Link>
                    <Link to="/edit-profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50">
                      <Pencil size={16} className="text-gray-400" /> {t('nav.editProfile')}
                    </Link>
                    <Link to="/messages" onClick={() => { setDropOpen(false); setUnreadCount(0) }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50">
                      <span className="relative">
                        <MessageSquare size={16} className="text-gray-400" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </span>
                      {t('nav.messages')}
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/sell" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50">
                      <Plus size={16} className="text-gray-400" /> {t('nav.postListing')}
                    </Link>
                    <div className="border-t border-gray-100">
                      <button onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={16} /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-semibold text-navy hover:text-blue-600 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs font-semibold">
              {['az', 'ru', 'en'].map(lang => (
                <button
                  key={lang}
                  onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }}
                  className={`px-2 py-1 rounded transition-colors ${i18n.language === lang ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-navy'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              <Plus size={16} /> {t('nav.postListing')}
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:text-navy hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen(v => !v)} aria-label={t('nav.menu')}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-1 text-xs font-semibold pb-2">
              {['az', 'ru', 'en'].map(lang => (
                <button
                  key={lang}
                  onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }}
                  className={`px-2 py-1 rounded transition-colors ${i18n.language === lang ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-navy'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {NAV_LINKS.map(link => (
            <Link key={link.label} to={link.href} onClick={() => setMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <Link to={`/profile/${user.id}`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-navy hover:bg-gray-50 rounded-lg">
                  <User size={16} /> {t('nav.myProfile')}
                </Link>
                <Link to={`/profile/${user.id}?tab=favorites`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-navy hover:bg-gray-50 rounded-lg">
                  <Heart size={16} className="text-red-400" /> {t('nav.favorites')}
                </Link>
                <Link to="/edit-profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-navy hover:bg-gray-50 rounded-lg">
                  <Pencil size={16} /> {t('nav.editProfile')}
                </Link>
                <Link to="/messages" onClick={() => { setMenuOpen(false); setUnreadCount(0) }}
                  className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-navy hover:bg-gray-50 rounded-lg">
                  <MessageSquare size={16} /> {t('nav.messages')}
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full py-2.5 px-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut size={16} /> {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 text-center border border-gray-200 text-navy text-sm font-semibold rounded-xl">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-blue-600 text-white text-sm font-semibold rounded-xl">
                  {t('nav.register')}
                </Link>
              </div>
            )}
            <Link to="/sell" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <Plus size={16} /> {t('nav.postListing')}
            </Link>
          </div>
        </div>
      )}

      {dropOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
      )}
    </header>
  )
}
