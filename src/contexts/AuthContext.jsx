import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);           // Firebase Auth user
    const [profile, setProfile] = useState(null);      // Firestore profile
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 인증 상태 변경 감지
    useEffect(() => {
        const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userProfile = await authService.getUserProfile(firebaseUser.uid);
                    setProfile(userProfile);
                } catch (err) {
                    console.error('프로필 로드 실패:', err);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 익명 로그인
    const signInAnonymous = async () => {
        setError(null);
        try {
            const firebaseUser = await authService.signInAnonymous();
            const userProfile = await authService.getUserProfile(firebaseUser.uid);
            setProfile(userProfile);
            return firebaseUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Google 로그인
    const signInWithGoogle = async () => {
        setError(null);
        try {
            const firebaseUser = await authService.signInWithGoogle();
            const userProfile = await authService.getUserProfile(firebaseUser.uid);
            setProfile(userProfile);
            return firebaseUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // 로그아웃
    const signOut = async () => {
        try {
            await authService.signOut();
            setProfile(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // 프로필 업데이트
    const updateProfile = async (data) => {
        if (!user) return;
        try {
            await authService.updateProfile(user.uid, data);
            setProfile(prev => ({ ...prev, ...data }));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // 프로필 새로고침
    const refreshProfile = async () => {
        if (!user) return;
        const userProfile = await authService.getUserProfile(user.uid);
        setProfile(userProfile);
    };

    const value = {
        user,
        profile,
        loading,
        error,
        isAuthenticated: !!user,
        isAnonymous: user?.isAnonymous ?? true,
        signInAnonymous,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
