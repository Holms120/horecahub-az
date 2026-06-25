import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

const Listings     = lazy(() => import('./pages/Listings'))
const ListingDetail = lazy(() => import('./pages/ListingDetail'))
const AddListing   = lazy(() => import('./pages/AddListing'))
const Profile      = lazy(() => import('./pages/Profile'))
const Messages     = lazy(() => import('./pages/Messages'))
const EditProfile  = lazy(() => import('./pages/EditProfile'))
const EditListing  = lazy(() => import('./pages/EditListing'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'))
const HowItWorks   = lazy(() => import('./pages/HowItWorks'))
const About        = lazy(() => import('./pages/About'))
const Contact      = lazy(() => import('./pages/Contact'))
const ComingSoon   = lazy(() => import('./pages/ComingSoon'))
const NotFound     = lazy(() => import('./pages/NotFound'))
const Admin        = lazy(() => import('./pages/Admin'))

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const AUTH_ROUTES = ['/login', '/register']

function Layout() {
  const { pathname } = useLocation()
  const isAuth = AUTH_ROUTES.includes(pathname)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isAuth && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"             element={<Home />} />
            <Route path="/listings"     element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/sell"         element={<AddListing />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/profile/:id"  element={<Profile />} />
            <Route path="/messages"     element={<Messages />} />
            <Route path="/edit-profile"      element={<EditProfile />} />
            <Route path="/listings/:id/edit" element={<EditListing />} />
            <Route path="/terms"        element={<TermsOfService />} />
            <Route path="/privacy"      element={<PrivacyPolicy />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about"        element={<About />} />
            <Route path="/contact"      element={<Contact />} />
            <Route path="/blog"         element={<ComingSoon />} />
            <Route path="/careers"      element={<ComingSoon />} />
            <Route path="/partners"     element={<ComingSoon />} />
            <Route path="/faq"          element={<Navigate to="/how-it-works" replace />} />
            <Route path="*"             element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuth && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="/*"     element={<Layout />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
