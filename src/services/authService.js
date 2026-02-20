import { auth, db } from '../firebase';
import {
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    linkWithPopup
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const googleProvider = new GoogleAuthProvider();

// 기본 프로필 데이터
const createDefaultProfile = (user) => ({
    uid: user.uid,
    nickname: user.displayName || `이웃${user.uid.slice(0, 4)}`,
    email: user.email || null,
    photoURL: user.photoURL || null,
    town: '역삼1동',
    level: 1,
    exp: 0,
    totalPosts: 0,
    totalReports: 0,
    totalFound: 0,
    goldenTimeParticipation: 0,
    communityPosts: 0,
    likesReceived: 0,
    currentTitle: null,
    unlockedTitles: [],
    unlockedBadges: [],
    isAnonymous: user.isAnonymous,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
});

export const authService = {
    // 인증 상태 변경 리스너
    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    },

    // 익명 로그인 (첫 진입 시)
    async signInAnonymous() {
        try {
            const result = await signInAnonymously(auth);
            await this.ensureUserProfile(result.user);
            return result.user;
        } catch (error) {
            console.error('익명 로그인 실패:', error);
            throw error;
        }
    },

    // Google 로그인
    async signInWithGoogle() {
        try {
            let result;
            // 이미 익명 로그인 상태면 계정 연결
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                try {
                    result = await linkWithPopup(auth.currentUser, googleProvider);
                } catch (linkError) {
                    // 이미 다른 계정으로 연결된 경우 일반 로그인
                    if (linkError.code === 'auth/credential-already-in-use' ||
                        linkError.code === 'auth/email-already-in-use') {
                        result = await signInWithPopup(auth, googleProvider);
                    } else {
                        throw linkError;
                    }
                }
            } else {
                result = await signInWithPopup(auth, googleProvider);
            }
            await this.ensureUserProfile(result.user, {
                nickname: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                isAnonymous: false
            });
            return result.user;
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            throw error;
        }
    },

    // 로그아웃
    async signOut() {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    },

    // 사용자 프로필 확인/생성
    async ensureUserProfile(user, extraData = {}) {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // 신규 사용자 → 프로필 생성
            const profile = { ...createDefaultProfile(user), ...extraData };
            await setDoc(userRef, profile);
            return profile;
        } else {
            // 기존 사용자 → 필요시 업데이트
            if (Object.keys(extraData).length > 0) {
                await updateDoc(userRef, {
                    ...extraData,
                    updatedAt: serverTimestamp()
                });
            }
            return { id: userSnap.id, ...userSnap.data() };
        }
    },

    // 사용자 프로필 조회
    async getUserProfile(uid) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        }
        return null;
    },

    // 프로필 업데이트
    async updateProfile(uid, data) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // 현재 사용자
    getCurrentUser() {
        return auth.currentUser;
    }
};
