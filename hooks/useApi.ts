import { useState, useEffect } from 'react';

export function useApi<T>(apiCall: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, []);

    return { data, loading, error, refetch };
}

export function useMutation<T, P>(apiCall: (params: P) => Promise<T>) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (params: P) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall(params);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error };
}
