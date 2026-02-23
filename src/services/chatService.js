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
            likes: 0,
            createdAt: serverTimestamp()
        });
    },

    // 메시지(댓글) 좋아요 토글
    async toggleMessageLike(postId, messageId, userId) {
        const { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } = await import('firebase/firestore');
        const likeRef = doc(db, 'chats', postId, 'messages', messageId, 'likes', userId);
        const msgRef = doc(db, 'chats', postId, 'messages', messageId);
        
        try {
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) {
                await deleteDoc(likeRef);
                await updateDoc(msgRef, { likes: increment(-1) });
                return false;
            } else {
                await setDoc(likeRef, { createdAt: serverTimestamp() });
                await updateDoc(msgRef, { likes: increment(1) });
                return true;
            }
        } catch (err) {
            console.error('메시지 좋아요 실패:', err);
            return false;
        }
    },

    // 사용자가 좋아요 한 메시지 목록 구독
    subscribeLikedMessages(postId, userId, callback) {
        if (!userId) {
            callback(new Set());
            return () => {};
        }
        
        // This is a simplified approach. Ideally, we would query all likes for the user in this post,
        // but since we don't have a direct way to query subcollections easily without collectionGroup
        // (which requires indexing), we'll let the component handle individual checks or 
        // rely on the messages themselves if we embedded `likedBy`.
        // Alternatively, we query the messages and assume if we need to check, we check individually.
        
        // For now, simpler approach: we just expose the toggle.
        // We will manage state in the component directly by checking existence or maintaining a Map.
    },
    
    // 개별 메시지 좋아요 여부 확인
    async checkMessageLiked(postId, messageId, userId) {
        const { doc, getDoc } = await import('firebase/firestore');
        const likeRef = doc(db, 'chats', postId, 'messages', messageId, 'likes', userId);
        const snap = await getDoc(likeRef);
        return snap.exists();
    },

    // ------------------------------------------------------------------------
    // 댓글 서비스 (게시물 공개 댓글) - 게시물별 인라인 댓글
    // Firestore 구조: posts/{postId}/comments/{commentId}
    // ------------------------------------------------------------------------

    // 댓글 실시간 구독
    subscribeComments(postId, callback) {
        const q = query(
            collection(db, 'posts', postId, 'comments'),
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
        await addDoc(collection(db, 'posts', postId, 'comments'), {
            uid,
            senderName,
            text,
            likes: 0,
            createdAt: serverTimestamp()
        });
    },

    // 댓글 좋아요 토글
    async toggleCommentLike(postId, commentId, userId) {
        const { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } = await import('firebase/firestore');
        const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', userId);
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        
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

    // 개별 댓글 좋아요 여부 확인
    async checkCommentLiked(postId, commentId, userId) {
        const { doc, getDoc } = await import('firebase/firestore');
        const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', userId);
        const snap = await getDoc(likeRef);
        return snap.exists();
    }
};
