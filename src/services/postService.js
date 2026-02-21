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
    deleteDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'posts';

export const postService = {
    // 게시물 등록
    async createPost(postData) {
        try {
            if (!postData.uid) throw new Error("User ID is required");

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...postData,
                createdAt: serverTimestamp(),
                status: 'ACTIVE',
                views: 0,
                likes: 0
            });
            return docRef.id;
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
    }
};
