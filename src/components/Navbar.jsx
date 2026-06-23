import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Menu, X, Plus, Search, LogOut, User, MessageSquare, Pencil, Heart, ChevronDown } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailLocalPart(value) {
  const s = (value || '').trim()
  if (!s) return ''
  const at = s.indexOf('@')
  return at > 0 ? s.slice(0, at) : s
}

/** full_name → username → email local-part. Never returns a full email. */
export function getNavbarDisplayName(user, profile = null) {
  if (!user) return ''

  const nameCandidates = [
    profile?.full_name,
    user.user_metadata?.full_name,
    profile?.username,
    user.user_metadata?.username,
  ]

  for (const raw of nameCandidates) {
    const value = (raw || '').trim()
    if (!value || EMAIL_LIKE.test(value) || value.includes('@')) continue
    return value.split(/\s+/)[0]
  }

  return emailLocalPart(user.email || profile?.email)
}

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]             = useState(false)
  const [dropOpen, setDropOpen]             = useState(false)
  const [equipmentOpen, setEquipmentOpen]   = useState(false)
  const equipmentTimer = useRef(null)
  const [servicesOpen, setServicesOpen]     = useState(false)
  const servicesTimer = useRef(null)
  const [mobileEquipmentOpen, setMobileEquipmentOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen]   = useState(false)
  const [unreadCount, setUnreadCount]       = useState(0)

  const displayName = useMemo(
    () => getNavbarDisplayName(user, profile),
    [user, profile],
  )

  const EQUIPMENT_ITEMS = [
    { id: 'kitchen',   key: 'cat.kitchen'   },
    { id: 'coffee',    key: 'cat.coffee'    },
    { id: 'cold',      key: 'cat.cold'      },
    { id: 'service',   key: 'cat.service'   },
    { id: 'furniture', key: 'cat.furniture' },
    { id: 'tableware', key: 'cat.tableware' },
  ]

  const SERVICES_ITEMS = [
    { id: 'suppliers',     key: 'cat.suppliers'     },
    { id: 'consulting',    key: 'cat.consulting'    },
    { id: 'software',      key: 'cat.software'      },
    { id: 'training',      key: 'cat.training'      },
    { id: 'hygiene',       key: 'cat.hygiene'       },
    { id: 'alcohol',       key: 'cat.alcohol'       },
    { id: 'textile',       key: 'cat.textile'       },
    { id: 'maintenance',   key: 'cat.maintenance'   },
    { id: 'print_ads',     key: 'cat.print_ads'     },
    { id: 'construction',  key: 'cat.construction'  },
    { id: 'legal_finance', key: 'cat.legal_finance' },
  ]

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    async function fetchCount() {
      try {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false)
        setUnreadCount(count || 0)
      } catch { setUnreadCount(0) }
    }
    fetchCount()
    const channel = supabase.channel('navbar-messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, fetchCount)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function handleSignOut() {
    await signOut()
    setDropOpen(false)
    navigate('/')
  }

  const userInitial = (displayName || '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4 lg:gap-8">

          <Link to="/" className="flex-shrink-0">
            <Logo height={32} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 flex-1 min-w-0">
            {/* Avadanlıq dropdown */}
            <div className="relative"
              onMouseEnter={() => { clearTimeout(equipmentTimer.current); setEquipmentOpen(true) }}
              onMouseLeave={() => { equipmentTimer.current = setTimeout(() => setEquipmentOpen(false), 150) }}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-navy transition-colors duration-150 whitespace-nowrap">
                {t('nav.equipment')} <ChevronDown size={14} className={`transition-transform ${equipmentOpen ? 'rotate-180' : ''}`} />
              </button>
              {equipmentOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {EQUIPMENT_ITEMS.map(item => (
                    <Link key={item.id} to={`/listings?category=${item.id}`}
                      onClick={() => setEquipmentOpen(false)}
                      className="block px-4 py-2.5 text-sm text-navy hover:bg-gray-50 transition-colors">
                      {t(item.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Kadrlar */}
            <Link to="/listings?category=staff"
              className="text-sm font-medium text-gray-600 hover:text-navy transition-colors duration-150 whitespace-nowrap">
              {t('nav.staff')}
            </Link>

            {/* Xidmətlər dropdown */}
            <div className="relative"
              onMouseEnter={() => { clearTimeout(servicesTimer.current); setServicesOpen(true) }}
              onMouseLeave={() => { servicesTimer.current = setTimeout(() => setServicesOpen(false), 150) }}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-navy transition-colors duration-150 whitespace-nowrap">
                {t('nav.services')} <ChevronDown size={14} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {SERVICES_ITEMS.map(item => (
                    <Link key={item.id} to={`/listings?category=${item.id}`}
                      onClick={() => setServicesOpen(false)}
                      className="block px-4 py-2.5 text-sm text-navy hover:bg-gray-50 transition-colors">
                      {t(item.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Necə işləyir */}
            <Link to="/how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-navy transition-colors duration-150 whitespace-nowrap">
              {t('nav.howItWorks')}
            </Link>
          </nav>

          {/* Desktop right: Search | Post | Lang | User */}
          <div className="hidden md:flex items-center flex-shrink-0 ml-auto">
            <Link to="/listings" className="p-2 text-gray-500 hover:text-navy hover:bg-gray-50 rounded-lg transition-colors">
              <Search size={20} />
            </Link>

            <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-3">
              <Link to="/sell"
                className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                <Plus size={16} /> {t('nav.postListing')}
              </Link>

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

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors max-w-[160px]"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                        {profile?.logo_url
                          ? <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-white text-xs font-bold">{userInitial}</span>
                        }
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border border-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-navy truncate min-w-0">
                      {displayName}
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

            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden ml-auto">
            <Link to="/sell" className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap">
              + Elan
            </Link>
            <div className="relative">
            <button
              className="p-2 rounded-lg text-gray-500 hover:text-navy hover:bg-gray-50 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={t('nav.menu')}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {unreadCount > 0 && !menuOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-2.5 pb-3 mb-1 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <span className="text-sm font-semibold text-navy truncate">{displayName}</span>
            </div>
          )}

          {/* Language switcher */}
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

          {/* Avadanlıq expandable */}
          <div>
            <button
              onClick={() => setMobileEquipmentOpen(v => !v)}
              className="flex items-center justify-between w-full py-2.5 px-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              {t('nav.equipment')}
              <ChevronDown size={14} className={`transition-transform ${mobileEquipmentOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileEquipmentOpen && (
              <div className="pl-4 space-y-0.5">
                {EQUIPMENT_ITEMS.map(item => (
                  <Link key={item.id} to={`/listings?category=${item.id}`}
                    onClick={() => { setMenuOpen(false); setMobileEquipmentOpen(false) }}
                    className="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    {t(item.key)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Kadrlar */}
          <Link to="/listings?category=staff" onClick={() => setMenuOpen(false)}
            className="block py-2.5 px-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
            {t('nav.staff')}
          </Link>

          {/* Xidmətlər expandable */}
          <div>
            <button
              onClick={() => setMobileServicesOpen(v => !v)}
              className="flex items-center justify-between w-full py-2.5 px-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              {t('nav.services')}
              <ChevronDown size={14} className={`transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileServicesOpen && (
              <div className="pl-4 space-y-0.5">
                {SERVICES_ITEMS.map(item => (
                  <Link key={item.id} to={`/listings?category=${item.id}`}
                    onClick={() => { setMenuOpen(false); setMobileServicesOpen(false) }}
                    className="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    {t(item.key)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Necə işləyir */}
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)}
            className="block py-2.5 px-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
            {t('nav.howItWorks')}
          </Link>

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
                  <span className="relative">
                    <MessageSquare size={16} />
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
