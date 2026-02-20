import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
    // 이미지 업로드
    async uploadImage(file, path = 'posts') {
        try {
            // 파일명 생성 (타임스탬프 + 랜덤)
            const extension = file.name.split('.').pop();
            const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
            const storageRef = ref(storage, `${path}/${filename}`);

            // 업로드
            const snapshot = await uploadBytes(storageRef, file);

            // 다운로드 URL 획득
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Image upload failed:", error);
            throw error;
        }
    }
};
