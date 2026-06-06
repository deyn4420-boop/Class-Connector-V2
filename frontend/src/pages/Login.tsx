/**
 * Login Page
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@/hooks'
import { Button, Input, Card } from '@/components/ui'
import { apiClient } from '@/utils/api'
import { useAuth } from '@/utils/store'
import { LogIn } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldError } = useForm(
    { email: '', password: '' },
    async (values) => {
      try {
        const response = await apiClient.login(values.email, values.password)
        if (response.data) {
          setSession(response.data as any)
          navigate(response.data.role === 'student' ? '/student' : '/teacher')
        } else {
          setFieldError('email' as any, response.message || 'Login failed')
        }
      } catch (error) {
        setFieldError('email' as any, 'Invalid email or password')
      }
    }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center p-4 animate-fadeInUp">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2">
              ClassConnect
            </h1>
            <p className="text-muted">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={values.email}
              onChange={handleChange}
              error={errors.email as string}
              disabled={isSubmitting}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange}
              error={errors.password as string}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              <LogIn size={18} />
              Sign In
            </Button>

            <p className="text-center text-sm text-muted">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:text-primary-light transition-colors font-bold">
                Register here
              </a>
            </p>
          </form>
        </Card>

        <p className="text-center text-xs text-muted mt-4">
          v2.0 • Modern Frontend • React + TypeScript
        </p>
      </div>
    </div>
  )
}
