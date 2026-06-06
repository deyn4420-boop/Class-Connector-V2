/**
 * Custom React Hooks
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/utils/store'
import { apiClient } from '@/utils/api'

export const useAsync = <T,>(
  fn: () => Promise<T>,
  deps?: React.DependencyList
) => {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true
    const execute = async () => {
      try {
        const response = await fn()
        if (mounted) {
          setState({ data: response, loading: false, error: null })
        }
      } catch (error) {
        if (mounted) {
          setState({ data: null, loading: false, error: error as Error })
        }
      }
    }
    execute()
    return () => {
      mounted = false
    }
  }, deps)

  return state
}

export const useSession = () => {
  const { session, setSession, setLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getSession()
        if (response.data) {
          setSession(response.data as any)
        } else {
          setSession(null)
        }
      } catch (err) {
        setSession(null)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    if (!session) {
      checkSession()
    }
  }, [])

  return { session, error }
}

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setValues((prev) => ({ ...prev, [name]: value }))
      if (errors[name as keyof T]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors]
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      setIsSubmitting(true)
      try {
        await onSubmit(values)
        setValues(initialValues)
        setErrors({})
      } catch (error) {
        setErrors({ submit: (error as Error).message } as any)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, onSubmit, initialValues]
  )

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
  }
}

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
