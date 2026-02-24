/**
 * Gemini AI 서비스
 * - 커뮤니티 글+답글 자동 생성
 * - 이미지 분석 → 피드 게시물 자동 변환
 * - 429 에러(할당량 초과) 시 자동 재시도 + 지연
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 딜레이 유틸
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGemini(prompt, imageBase64 = null, retries = 3) {
    const parts = [{ text: prompt }];

    if (imageBase64) {
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const mimeType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: base64Data
            }
        });
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 2048
                    }
                })
            });

            if (response.status === 429) {
                // 할당량 초과 - 대기 후 재시도
                const waitTime = Math.pow(2, attempt) * 5000 + Math.random() * 2000;
                console.warn(`Gemini API 429 에러. ${Math.round(waitTime / 1000)}초 후 재시도... (${attempt + 1}/${retries})`);
                await delay(waitTime);
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${err}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (err) {
            if (attempt === retries - 1) throw err;
            // 네트워크 에러 등도 재시도
            await delay(3000);
        }
    }
    throw new Error('Gemini API 최대 재시도 횟수 초과');
}

export const geminiService = {
    /**
     * 커뮤니티 글 + 랜덤 답글 생성
     */
    async generateCommunityPost(category = '자유게시판') {
        const replyCount = Math.floor(Math.random() * 5) + 1;
        const prompt = `당신은 한국의 분실물/실종 찾기 커뮤니티 앱 "리턴팟"의 사용자입니다.
아래 카테고리에 맞는 글 1개를 작성해주세요.

카테고리: ${category}
사용 가능한 카테고리: 자유게시판, 목격제보, 실종방지팁, 찾았어요!

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "post": {
    "content": "글 내용 (2~4문장, 자연스러운 한국어)",
    "author": "닉네임 (한국어 2~4글자)",
    "tags": ["태그1", "태그2"]
  },
  "replies": [
    {
      "author": "답글 작성자 닉네임",
      "content": "답글 내용 (1~2문장)"
    }
  ]
}

replies는 ${replyCount}개를 생성해주세요.
카테고리별 톤:
- 자유게시판: 일상적이고 친근한 이야기
- 목격제보: 목격 위치와 시간, 특징을 구체적으로
- 실종방지팁: 실용적인 팁과 경험
- 찾았어요!: 감사와 기쁨의 글`;

        const raw = await callGemini(prompt);
        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('JSON not found');
            return JSON.parse(jsonMatch[0]);
        } catch {
            console.error('Gemini 응답 파싱 실패:', raw);
            throw new Error('AI 응답 파싱 실패');
        }
    },

    /**
     * 이미지 분석 → 피드 게시물 데이터 추출
     */
    async analyzeImageForFeed(imageBase64) {
        const prompt = `이 이미지는 당근마켓 등 중고마켓 캡처, 커뮤니티 글 캡처, 전단지, 또는 일반 사진일 수 있습니다.
가장 먼저 이미지 내에 포함된 '텍스트(제목, 본문 내용, 위치, 특징 등)'를 꼼꼼히 모두 읽고 파악해주세요.
그 다음, 파악한 텍스트 정보를 바탕으로 분실이나 실종, 혹은 습득과 관련된 핵심 데이터를 추출해주세요.
만약 글이 명확하지 않거나 사진만 있다면, 사진 속 사물/상황을 바탕으로 자연스럽게 정보를 유추하여 채워주세요.

매우 중요: 마크다운 코드블록(\`\`\`json) 등 어떠한 설명도 덧붙이지 말고, 오직 아래 명시된 순수 JSON 객체 형태로만 응답하세요.
{
  "type": "LOST 또는 FOUND",
  "category": "HUMAN, PET, ITEM 중 하나",
  "title": "게시물 제목 (한국어, 20자 내외)",
  "description": "상세 설명 (한국어, 3~5문장. 이미지 안의 중요 텍스트를 최대한 반영)",
  "location": "추정 위치 또는 '서울시 강남구' 같은 일반 위치 (이미지 내 텍스트에 위치가 있다면 반드시 반영)",
  "features": "외형 특징 (한국어)",
  "tags": ["태그1", "태그2", "태그3"],
  "reward": "사례금 (예: 10만원, 없으면 빈 문자열)",
  "urgent": true 또는 false
}`;

        const raw = await callGemini(prompt, imageBase64);
        try {
            // 마크다운 백틱 및 불필요한 문자열 제거를 통한 파싱 안정화
            const cleanedRaw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedRaw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('JSON object not found');
            return JSON.parse(jsonMatch[0]);
        } catch (err) {
            console.error('이미지 분석 응답 파싱 실패:', raw, err);
            throw new Error('이미지 분석 실패: 데이터를 파싱할 수 없습니다.');
        }
    },

    /**
     * 특정 동네(행정동/법정동) 기준 주변 동네 5곳 이상 추출
     */
    async getNearbyTowns(townName) {
        const prompt = `당신은 지리 정보 AI입니다. 한국의 "${townName}" 주변에 인접해 있는 행정동 또는 법정동(근처 동네) 5~8곳의 이름을 JSON 배열 형태로만 응답해주세요.
반드시 아래 JSON 형식으로만 응답 (마크다운 백틱이나 다른 텍스트 없이):
[
  "동이름1", "동이름2", "동이름3", "동이름4", "동이름5"
]`;

        const raw = await callGemini(prompt);
        try {
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('JSON array not found');
            return JSON.parse(jsonMatch[0]);
        } catch {
            console.error('주변 동네 응답 파싱 실패:', raw);
            throw new Error('주변 동네 탐색 실패');
        }
    },

    // API 호출 간 안전 딜레이 (외부에서 사용)
    delay
};
