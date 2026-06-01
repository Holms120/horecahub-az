import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
