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
    updateDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'posts';

export const postService = {
    // 게시물 등록
    async createPost(postData) {
        try {
            // 필수 데이터 검증
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

        // 카테고리 필터
        if (filter.category && filter.category !== 'ALL') {
            q = query(q, where('category', '==', filter.category));
        }

        // 상태 필터 (기본적으로 ACTIVE만 보여줄지, 전체 보여줄지 등)
        // 현재는 모든 상태를 가져와서 프론트에서 처리하거나 필요한 경우 추가

        return onSnapshot(q, (querySnapshot) => {
            const posts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Timestamp를 Date 객체로 변환 (UI 렌더링 용이성)
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            });
            callback(posts);
        }, (error) => {
            console.error("Error subscribing posts: ", error);
        });
    },

    // 게시물 상태 업데이트 (예: 해결됨)
    async updatePostStatus(postId, status) {
        const postRef = doc(db, COLLECTION_NAME, postId);
        await updateDoc(postRef, { status });
    }
};
