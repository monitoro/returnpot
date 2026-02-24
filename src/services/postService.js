import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    increment
} from 'firebase/firestore';

const COLLECTION_NAME = 'posts';

export const postService = {
    // 게시물 등록 (tempId 지원)
    async createPost(postData, predefinedId = null) {
        try {
            if (!postData.uid) throw new Error("User ID is required");

            const docData = {
                ...postData,
                createdAt: serverTimestamp(),
                status: 'ACTIVE',
                views: 0,
                likes: 0
            };

            if (predefinedId) {
                await setDoc(doc(db, COLLECTION_NAME, predefinedId), docData);
                return predefinedId;
            } else {
                const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
                return docRef.id;
            }
        } catch (error) {
            console.error("Error adding document: ", error);
            throw error;
        }
    },

    // 게시물 실시간 구독
    subscribePosts(callback, filter = { category: 'ALL' }) {
        let q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );

        if (filter.category && filter.category !== 'ALL') {
            q = query(q, where('category', '==', filter.category));
        }

        return onSnapshot(q, (querySnapshot) => {
            const posts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    tags: Array.isArray(data.tags) ? data.tags : [],
                    imageUrl: data.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'
                };
            });
            callback(posts);
        }, (error) => {
            console.error("Error subscribing posts: ", error);
        });
    },

    // 게시물 상태 업데이트
    async updatePostStatus(postId, status) {
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, { status });
    },

    // 게시물 삭제 (어드민 전용)
    async deletePost(postId) {
        try {
            const postRef = doc(db, COLLECTION_NAME, postId);
            await deleteDoc(postRef);
            console.log("게시물 삭제 완료:", postId);
        } catch (error) {
            console.error("Error deleting document: ", error);
            throw error;
        }
    },

    // 좋아요 토글
    async toggleLike(postId, userId) {
        const likeRef = doc(db, COLLECTION_NAME, postId, 'likes', userId);
        const postRef = doc(db, COLLECTION_NAME, postId);
        const likeSnap = await getDoc(likeRef);

        if (likeSnap.exists()) {
            // 좋아요 취소
            await deleteDoc(likeRef);
            await updateDoc(postRef, { likes: increment(-1) });
            return false;
        } else {
            // 좋아요 추가
            await setDoc(likeRef, { createdAt: serverTimestamp() });
            await updateDoc(postRef, { likes: increment(1) });
            return true;
        }
    },

    // 좋아요 여부 확인
    async checkLiked(postId, userId) {
        const likeRef = doc(db, COLLECTION_NAME, postId, 'likes', userId);
        const likeSnap = await getDoc(likeRef);
        return likeSnap.exists();
    },

    // 조회수 증가
    async incrementViews(postId) {
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, { views: increment(1) });
    },

    // 댓글 수 증가
    async incrementComments(postId) {
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, { comments: increment(1) });
    },

    // 사용자가 작성한 메인 피드 목록 가져오기 (단발성)
    async getUserPosts(uid) {
        if (!uid) return [];
        try {
            const { getDocs } = await import('firebase/firestore');
            const q = query(
                collection(db, COLLECTION_NAME),
                where('uid', '==', uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    tags: Array.isArray(data.tags) ? data.tags : [],
                    imageUrl: data.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'
                };
            });
        } catch (error) {
            console.error("Error fetching user posts: ", error);
            return [];
        }
    }
};
