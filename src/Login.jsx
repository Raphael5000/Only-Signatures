import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Label } from '../components/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card'
import { Toaster } from '../components/sonner'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'
import { authenticateClient } from './clients'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Small delay for UX
    setTimeout(() => {
      const client = authenticateClient(username, password)

      if (client) {
        // Store authenticated client in localStorage
        localStorage.setItem('authenticatedClient', JSON.stringify({
          id: client.id,
          name: client.name,
          route: client.route
        }))

        toast.success(`Welcome, ${client.name}!`, {
          description: 'Redirecting to your signature page...'
        })

        // Redirect to client's brand page
        setTimeout(() => {
          navigate(client.route)
        }, 1000)
      } else {
        toast.error('Invalid Credentials', {
          description: 'Please check your username and password'
        })
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <>
      <div className="min-h-[calc(100vh-68px)] flex items-center justify-center p-6" style={{ backgroundColor: '#F7FAF9' }}>
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Client Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your email signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  'Logging in...'
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  )
}

export default Login
