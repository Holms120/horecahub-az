import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Plus, Search, LogOut, User } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Avadanlıq',    href: '/listings?category=kitchen' },
  { label: 'Kadrlar',      href: '/listings?category=staff' },
  { label: 'Necə işləyir', href: '/#how' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50"
                    >
                      <User size={16} className="text-gray-400" /> Profilim
                    </Link>
                    <Link
                      to="/sell"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-navy hover:bg-gray-50"
                    >
                      <Plus size={16} className="text-gray-400" /> Elan yerləşdir
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Çıxış
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-semibold text-navy hover:text-blue-600 transition-colors">
                  Daxil ol
                </Link>
                <Link to="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Qeydiyyat
                </Link>
              </div>
            )}

            <Link to="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              <Plus size={16} /> Elan yerləşdir
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:text-navy hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen(v => !v)} aria-label="Menyu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
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
                  <User size={16} /> Profilim
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full py-2.5 px-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut size={16} /> Çıxış
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 text-center border border-gray-200 text-navy text-sm font-semibold rounded-xl">
                  Daxil ol
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-blue-600 text-white text-sm font-semibold rounded-xl">
                  Qeydiyyat
                </Link>
              </div>
            )}
            <Link to="/sell" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <Plus size={16} /> Elan yerləşdir
            </Link>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {dropOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
      )}
    </header>
  )
}
