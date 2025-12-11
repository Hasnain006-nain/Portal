import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentsApi, coursesApi, enrollmentsApi, gradesApi, statsApi } from '../../lib/api';

interface DataContextType {
    students: any[];
    courses: any[];
    enrollments: any[];
    grades: any[];
    stats: { students: number; courses: number; enrollments: number } | null;
    loading: boolean;
    error: string | null;
    refetchAll: () => Promise<void>;
    refetchStudents: () => Promise<void>;
    refetchCourses: () => Promise<void>;
    refetchEnrollments: () => Promise<void>;
    refetchGrades: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [stats, setStats] = useState<{ students: number; courses: number; enrollments: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetchStudents = async () => {
        try {
            const data = await studentsApi.getAll();
            setStudents(data);
        } catch (err) {
            console.error('Failed to fetch students:', err);
        }
    };

    const refetchCourses = async () => {
        try {
            const data = await coursesApi.getAll();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        }
    };

    const refetchEnrollments = async () => {
        try {
            const data = await enrollmentsApi.getAll();
            setEnrollments(data);
        } catch (err) {
            console.error('Failed to fetch enrollments:', err);
        }
    };

    const refetchGrades = async () => {
        try {
            const data = await gradesApi.getAll();
            setGrades(data);
        } catch (err) {
            console.error('Failed to fetch grades:', err);
        }
    };

    const refetchStats = async () => {
        try {
            const data = await statsApi.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const refetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                refetchStudents(),
                refetchCourses(),
                refetchEnrollments(),
                refetchGrades(),
                refetchStats(),
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetchAll();
    }, []);

    return (
        <DataContext.Provider
            value={{
                students,
                courses,
                enrollments,
                grades,
                stats,
                loading,
                error,
                refetchAll,
                refetchStudents,
                refetchCourses,
                refetchEnrollments,
                refetchGrades,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
