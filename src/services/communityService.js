import { db } from '../firebase';
import {
    collection, addDoc, query, orderBy, onSnapshot,
    serverTimestamp, doc, deleteDoc, updateDoc, getDocs, where
} from 'firebase/firestore';

const COLLECTION_NAME = 'communityPosts';

export const communityService = {
    // 실시간 구독
    subscribePosts(callback) {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    likes: data.likes || 0,
                    liked: false,
                    comments: data.comments || 0,
                    tags: Array.isArray(data.tags) ? data.tags : [],
                    images: Array.isArray(data.images) ? data.images : [],
                };
            });
            callback(posts);
        });
    },

    // 글 작성
    async createPost(postData) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...postData,
            likes: 0,
            comments: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    // 좋아요 토글
    async toggleLike(postId, currentLikes, isLiked) {
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, {
            likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
        });
    },

    // 삭제
    async deletePost(postId) {
        await deleteDoc(doc(db, COLLECTION_NAME, postId));
    },

    // ------------------------------------------------------------------------
    // 댓글 (Comments) - posts 내부 subcollection ('communityPosts/{postId}/comments')
    // ------------------------------------------------------------------------

    // 댓글 실시간 구독
    subscribeComments(postId, callback) {
        const q = query(
            collection(db, COLLECTION_NAME, postId, 'comments'),
            orderBy('createdAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                };
            });
            callback(comments);
        });
    },

    // 댓글 전송
    async sendComment(postId, { uid, senderName, text }) {
        await addDoc(collection(db, COLLECTION_NAME, postId, 'comments'), {
            uid,
            senderName,
            text,
            likes: 0,
            createdAt: serverTimestamp()
        });
    },

    // 댓글 좋아요 토글
    async toggleCommentLike(postId, commentId, userId) {
        const { getDoc, setDoc, increment } = await import('firebase/firestore');
        const likeRef = doc(db, COLLECTION_NAME, postId, 'comments', commentId, 'likes', userId);
        const commentRef = doc(db, COLLECTION_NAME, postId, 'comments', commentId);
        
        try {
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) {
                await deleteDoc(likeRef);
                await updateDoc(commentRef, { likes: increment(-1) });
                return false;
            } else {
                await setDoc(likeRef, { createdAt: serverTimestamp() });
                await updateDoc(commentRef, { likes: increment(1) });
                return true;
            }
        } catch (err) {
            console.error('댓글 좋아요 실패:', err);
            return false;
        }
    },

    // 댓글 좋아요 여부 확인
    async checkCommentLiked(postId, commentId, userId) {
        const { getDoc } = await import('firebase/firestore');
        const likeRef = doc(db, COLLECTION_NAME, postId, 'comments', commentId, 'likes', userId);
        const snap = await getDoc(likeRef);
        return snap.exists();
    },

    // 댓글 수 증가 (포스트 문서)
    async incrementComments(postId) {
        const { increment } = await import('firebase/firestore');
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, {
            comments: increment(1)
        });
    },

    // 사용자가 작성한 동네생활(커뮤니티) 피드 목록 가져오기
    async getUserCommunityPosts(uid) {
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
                    images: Array.isArray(data.images) ? data.images : []
                };
            });
        } catch (error) {
            console.error("Error fetching user community posts: ", error);
            return [];
        }
    }
};
