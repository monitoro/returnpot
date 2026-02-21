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
    }
};
