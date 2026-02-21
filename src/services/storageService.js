import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 타임아웃 헬퍼
const withTimeout = (promise, ms) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`업로드 시간이 ${ms / 1000}초를 초과했습니다.`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export const storageService = {
    // 이미지 업로드 (30초 타임아웃)
    async uploadImage(file, path = 'posts') {
        try {
            // 파일명 생성 (타임스탬프 + 랜덤)
            const extension = file.name.split('.').pop();
            const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
            const storageRef = ref(storage, `${path}/${filename}`);

            console.log("이미지 업로드 시작:", filename, "크기:", (file.size / 1024).toFixed(1) + "KB");

            // 업로드 (30초 타임아웃)
            const snapshot = await withTimeout(uploadBytes(storageRef, file), 30000);

            // 다운로드 URL 획득
            const downloadURL = await withTimeout(getDownloadURL(snapshot.ref), 10000);
            console.log("이미지 업로드 성공:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Image upload failed:", error);
            throw error;
        }
    }
};
