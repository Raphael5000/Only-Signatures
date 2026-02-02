import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '../components/navigation-menu'
import { Menu, X } from 'lucide-react'
import Editor from './Editor'
import Generator from './Generator'
import MoxiiAfrica from './MoxiiAfrica'
import Login from './Login'

// Check if user is authenticated
function getAuthenticatedClient() {
  try {
    const stored = localStorage.getItem('authenticatedClient')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Protected Route component
function ProtectedRoute({ children }) {
  const client = getAuthenticatedClient()
  
  if (!client) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Check auth state on mount and when location changes
  useEffect(() => {
    const client = getAuthenticatedClient()
    setIsLoggedIn(!!client)
  }, [location])

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('authenticatedClient')
    setIsLoggedIn(false)
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className="min-h-screen text-gray-900" style={{ backgroundColor: '#F7FAF9' }}>
      <header className="relative flex h-[68px] items-center justify-between px-6 bg-white border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3">
          <img 
            className="h-9 w-auto" 
            src="/Only Signautes Logo.svg" 
            alt="Only Signatures logo" 
          />
        </Link>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link
                to="/"
                className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                  isActive('/') ? 'bg-accent' : ''
                }`}
              >
                Editor
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                to="/generator"
                className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                  isActive('/generator') ? 'bg-accent' : ''
                }`}
              >
                Generator
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                    isActive('/login') ? 'bg-accent' : ''
                  }`}
                >
                  Login
                </Link>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50">
            <nav className="flex flex-col py-2">
              <Link
                to="/"
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Editor
              </Link>
              <Link
                to="/generator"
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isActive('/generator')
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Generator
              </Link>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 text-sm font-medium transition-colors text-gray-900 hover:bg-gray-100 text-left"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
      {children}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Editor />
            </Layout>
          }
        />
        <Route
          path="/generator"
          element={
            <Layout>
              <Generator />
            </Layout>
          }
        />
        <Route
          path="/moxii-africa"
          element={
            <Layout>
              <ProtectedRoute>
                <MoxiiAfrica />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
