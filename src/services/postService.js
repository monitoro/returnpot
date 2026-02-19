import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where
} from 'firebase/firestore';

const COLLECTION_NAME = 'posts';

export const postService = {
    // 게시물 등록
    async createPost(postData) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...postData,
                createdAt: serverTimestamp(),
                status: 'ACTIVE'
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding document: ", error);
            throw error;
        }
    },

    // 게시물 실시간 구독
    subscribePosts(callback, category = 'ALL') {
        let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

        if (category !== 'ALL') {
            q = query(q, where('category', '==', category));
        }

        return onSnapshot(q, (querySnapshot) => {
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Firestore timestamp를 일반 시간 내림차순 텍스트로 변환 (심플링)
                time: doc.data().createdAt ? '방금 전' : '로딩 중'
            }));
            callback(posts);
        }, (error) => {
            console.error("Error subscribing posts: ", error);
        });
    }
};
