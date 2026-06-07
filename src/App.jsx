import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import AddListing from './pages/AddListing'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import EditProfile from './pages/EditProfile'
import EditListing from './pages/EditListing'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import HowItWorks from './pages/HowItWorks'
import About from './pages/About'
import Contact from './pages/Contact'
import ComingSoon from './pages/ComingSoon'
import NotFound from './pages/NotFound'

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
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/listings"     element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/sell"         element={<AddListing />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/profile/:id"  element={<Profile />} />
          <Route path="/messages"     element={<Messages />} />
          <Route path="/edit-profile"       element={<EditProfile />} />
          <Route path="/listings/:id/edit" element={<EditListing />} />
          <Route path="/terms"         element={<TermsOfService />} />
          <Route path="/privacy"       element={<PrivacyPolicy />} />
          <Route path="/how-it-works"  element={<HowItWorks />} />
          <Route path="/about"         element={<About />} />
          <Route path="/contact"       element={<Contact />} />
          <Route path="/blog"          element={<ComingSoon />} />
          <Route path="/careers"       element={<ComingSoon />} />
          <Route path="/partners"      element={<ComingSoon />} />
          <Route path="/faq"           element={<Navigate to="/how-it-works" replace />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
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
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}
