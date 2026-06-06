/**
 * Custom React Hooks
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/utils/store';
import { apiClient } from '@/utils/api';
export const useAsync = (fn, deps) => {
    const [state, setState] = useState({
        data: null,
        loading: true,
        error: null,
    });
    useEffect(() => {
        let mounted = true;
        const execute = async () => {
            try {
                const response = await fn();
                if (mounted) {
                    setState({ data: response, loading: false, error: null });
                }
            }
            catch (error) {
                if (mounted) {
                    setState({ data: null, loading: false, error: error });
                }
            }
        };
        execute();
        return () => {
            mounted = false;
        };
    }, deps);
    return state;
};
export const useSession = () => {
    const { session, setSession, setLoading } = useAuth();
    const [error, setError] = useState(null);
    useEffect(() => {
        const checkSession = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getSession();
                if (response.data) {
                    setSession(response.data);
                }
                else {
                    setSession(null);
                }
            }
            catch (err) {
                setSession(null);
                setError('Failed to load session');
            }
            finally {
                setLoading(false);
            }
        };
        if (!session) {
            checkSession();
        }
    }, []);
    return { session, error };
};
export const useForm = (initialValues, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);
    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            setValues(initialValues);
            setErrors({});
        }
        catch (error) {
            setErrors({ submit: error.message });
        }
        finally {
            setIsSubmitting(false);
        }
    }, [values, onSubmit, initialValues]);
    const setFieldValue = useCallback((field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    }, []);
    const setFieldError = useCallback((field, error) => {
        setErrors((prev) => ({ ...prev, [field]: error }));
    }, []);
    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        setFieldValue,
        setFieldError,
    };
};
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};
