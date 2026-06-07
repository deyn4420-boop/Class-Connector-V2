/**
 * Register Page
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@/hooks'
import { Button, Input, Select, Card } from '@/components/ui'
import { apiClient } from '@/utils/api'
import { UserPlus } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const { values, errors, isSubmitting, handleChange, handleSubmit, setFieldError } = useForm(
    { name: '', email: '', password: '', confirmPassword: '', staffIdOrUsn: '', classCode: '', className: '' },
    async (formValues) => {
      if (!formValues.name.trim() || !formValues.email.trim() || !formValues.password || !formValues.confirmPassword) {
        setFieldError('submit' as any, 'Please fill in all required fields.')
        return
      }

      if (role === 'teacher' && !formValues.staffIdOrUsn.trim()) {
        setFieldError('submit' as any, 'Please enter your staff ID.')
        return
      }

      if (role === 'student' && (!formValues.staffIdOrUsn.trim() || !formValues.classCode.trim())) {
        setFieldError('submit' as any, 'Please enter your USN and class code.')
        return
      }

      if (formValues.password !== formValues.confirmPassword) {
        setFieldError('confirmPassword' as any, 'Passwords do not match')
        return
      }

      try {
        const response = await apiClient.register(
          formValues.name,
          formValues.email,
          formValues.password,
          role,
          formValues.staffIdOrUsn,
          formValues.classCode,
          role === 'teacher' ? formValues.className : undefined
        )

        if (response.success) {
          navigate('/login')
        } else {
          setFieldError('submit' as any, response.message || 'Registration failed')
        }
      } catch (error) {
        setFieldError('submit' as any, 'Registration failed. Please try again.')
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
            <p className="text-muted">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="I am a"
              options={[
                { value: 'student', label: 'Student' },
                { value: 'teacher', label: 'Teacher' },
              ]}
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            />

            <Input
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={values.name}
              onChange={handleChange}
              error={errors.name as string}
              disabled={isSubmitting}
            />

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

            {role === 'teacher' && (
              <>
                <Input
                  label="Staff ID"
                  name="staffIdOrUsn"
                  placeholder="STAFF001"
                  value={values.staffIdOrUsn}
                  onChange={handleChange}
                  error={errors.staffIdOrUsn as string}
                  disabled={isSubmitting}
                />
                <Input
                  label="Class Name (Optional)"
                  name="className"
                  placeholder="My Class"
                  value={values.className}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </>
            )}

            {role === 'student' && (
              <>
                <Input
                  label="USN"
                  name="staffIdOrUsn"
                  placeholder="USN123456"
                  value={values.staffIdOrUsn}
                  onChange={handleChange}
                  error={errors.staffIdOrUsn as string}
                  disabled={isSubmitting}
                />
                <Input
                  label="Class Code"
                  name="classCode"
                  placeholder="ABCD1234"
                  value={values.classCode}
                  onChange={handleChange}
                  error={errors.classCode as string}
                  disabled={isSubmitting}
                />
              </>
            )}

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

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword as string}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              <UserPlus size={18} />
              Create Account
            </Button>

            {errors.submit && (
              <p className="text-center text-sm text-red-500 mt-2">{errors.submit as string}</p>
            )}

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:text-primary-light transition-colors font-bold">
                Login here
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
