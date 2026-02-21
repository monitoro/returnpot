import { db } from '../firebase';
import {
    collection, addDoc, query, orderBy, onSnapshot,
    serverTimestamp
} from 'firebase/firestore';

/**
 * 채팅 서비스 - 게시물별 실시간 채팅
 * Firestore 구조: chats/{postId}/messages/{messageId}
 */
export const chatService = {
    // 메시지 실시간 구독
    subscribeMessages(postId, callback) {
        const q = query(
            collection(db, 'chats', postId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                };
            });
            callback(messages);
        });
    },

    // 메시지 전송
    async sendMessage(postId, { uid, senderName, text }) {
        await addDoc(collection(db, 'chats', postId, 'messages'), {
            uid,
            senderName,
            text,
            createdAt: serverTimestamp()
        });
    }
};
