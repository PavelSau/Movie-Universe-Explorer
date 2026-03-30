import { useState } from 'react'
import { LogIn, UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/stores/useAuthStore'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [tab, setTab] = useState<string>('login')
  const [error, setError] = useState<string | null>(null)

  // Login form
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')

  const { login, register, isLoading } = useAuth()

  const handleLogin = async () => {
    setError(null)
    try {
      await login(loginUsername, loginPassword)
      onOpenChange(false)
      resetForms()
    } catch {
      setError('Invalid username or password')
    }
  }

  const handleRegister = async () => {
    setError(null)
    if (regUsername.length < 3) { setError('Username must be at least 3 characters'); return }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!regDisplayName.trim()) { setError('Display name is required'); return }
    try {
      await register(regUsername, regPassword, regDisplayName)
      onOpenChange(false)
      resetForms()
    } catch {
      setError('Username already taken')
    }
  }

  const resetForms = () => {
    setLoginUsername(''); setLoginPassword('')
    setRegUsername(''); setRegPassword(''); setRegDisplayName('')
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForms() }}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Welcome to Movie Universe</DialogTitle>
          <DialogDescription>Sign in to unlock wishlists and personalized features</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as string); setError(null) }}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              <LogIn size={14} className="mr-1.5" /> Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              <UserPlus size={14} className="mr-1.5" /> Register
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle size={16} className="shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <TabsContent value="login">
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button className="w-full" onClick={handleLogin} disabled={isLoading || !loginUsername || !loginPassword}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Demo accounts (password: <Badge variant="secondary" className="text-[10px]">password123</Badge>)</p>
                <div className="flex flex-wrap gap-1">
                  {['john', 'jane', 'alex', 'maria', 'sam'].map((name) => (
                    <Button
                      key={name}
                      variant="outline"
                      size="xs"
                      onClick={() => { setLoginUsername(name); setLoginPassword('password123') }}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Username (3+ characters)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <Input
                placeholder="Display Name"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password (6+ characters)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
              <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
