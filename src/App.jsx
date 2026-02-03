import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '../components/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/dropdown-menu'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react'
import Editor from './Editor'
import Generator from './Generator'
import Inspiration from './Inspiration'
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
  const [authenticatedClient, setAuthenticatedClient] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Check auth state on mount and when location changes
  useEffect(() => {
    const client = getAuthenticatedClient()
    setAuthenticatedClient(client)
  }, [location])

  const isActive = (path) => location.pathname === path
  const isLoggedIn = !!authenticatedClient

  const handleLogout = () => {
    localStorage.removeItem('authenticatedClient')
    setAuthenticatedClient(null)
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col" style={{ backgroundColor: '#F7FAF9' }}>
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
              <Link
                to="/inspiration"
                className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                  isActive('/inspiration') ? 'bg-accent' : ''
                }`}
              >
                Inspiration
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                    {authenticatedClient?.name}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        if (authenticatedClient?.route) navigate(authenticatedClient.route)
                      }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <Link
                to="/inspiration"
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isActive('/inspiration')
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inspiration
              </Link>
              {isLoggedIn ? (
                <>
                  <div className="px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {authenticatedClient?.name}
                  </div>
                  <Link
                    to={authenticatedClient?.route || '/'}
                    className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
                      isActive(authenticatedClient?.route)
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 text-sm font-medium transition-colors text-gray-900 hover:bg-gray-100 text-left flex items-center w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
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
      <main className="flex-grow">
        {children}
      </main>
      <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        Copyright © 2026 - All rights reserved | A product by Hivory
      </footer>
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
          path="/inspiration"
          element={
            <Layout>
              <Inspiration />
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
