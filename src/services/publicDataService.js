/**
 * 공공데이터 서비스 - 유기동물 조회 API (농림축산식품부)
 * 엔드포인트: apis.data.go.kr/1543061/abandonmentPublicService_v2
 */

const SERVICE_KEY = import.meta.env.VITE_DATA_GO_KR_KEY;
const BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2';

export const publicDataService = {
    /**
     * 유기동물 목록 조회
     * @param {Object} params - 검색 조건
     * @param {string} params.upkind - 축종코드 (417000:개, 422400:고양이, 429900:기타)
     * @param {number} params.numOfRows - 한 페이지 결과 수 (기본 20)
     * @param {number} params.pageNo - 페이지 번호
     * @param {string} params.bgnde - 검색 시작일 (YYYYMMDD)
     * @param {string} params.endde - 검색 종료일 (YYYYMMDD)
     */
    async fetchAnimals(params = {}) {
        const {
            upkind = '',
            numOfRows = 20,
            pageNo = 1,
            bgnde = '',
            endde = ''
        } = params;

        let url = `${BASE_URL}/abandonmentPublic_v2?serviceKey=${SERVICE_KEY}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=json`;
        if (upkind) url += `&upkind=${upkind}`;
        if (bgnde) url += `&bgnde=${bgnde}`;
        if (endde) url += `&endde=${endde}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`공공데이터 API 오류: ${response.status}`);
        }

        const data = await response.json();
        const items = data.response?.body?.items?.item || [];
        const totalCount = data.response?.body?.totalCount || 0;

        return {
            totalCount,
            items: items.map(item => this.transformAnimalToPost(item))
        };
    },

    /**
     * API 데이터 → ReturnPot 피드 게시물 형식으로 변환
     */
    transformAnimalToPost(item) {
        const sexMap = { M: '수컷', F: '암컷', Q: '미상' };
        const neuterMap = { Y: '중성화 O', N: '중성화 X', U: '미상' };

        // 상태 결정
        const isReturned = item.processState?.includes('반환') || item.processState?.includes('종료');
        const type = isReturned ? 'FOUND' : 'LOST';

        // 설명 생성
        const description = [
            `📍 발견장소: ${item.happenPlace || '정보없음'}`,
            `🐾 품종: ${item.kindFullNm || '미상'}`,
            `🎨 색상: ${item.colorCd || '미상'}`,
            `📏 체중: ${item.weight || '미상'}`,
            `📅 나이: ${item.age || '미상'}`,
            `⚧️ 성별: ${sexMap[item.sexCd] || '미상'} / ${neuterMap[item.neuterYn] || '미상'}`,
            item.specialMark ? `✨ 특이사항: ${item.specialMark}` : '',
            `\n🏥 보호소: ${item.careNm || '미상'}`,
            `📞 연락처: ${item.careTel || '미상'}`,
            `📍 보호소 주소: ${item.careAddr || '미상'}`,
            `\n📋 공고번호: ${item.noticeNo || ''}`,
            `📅 공고기간: ${formatDate(item.noticeSdt)} ~ ${formatDate(item.noticeEdt)}`,
            `📌 상태: ${item.processState || '보호중'}`
        ].filter(Boolean).join('\n');

        return {
            // 원본 API 데이터
            _raw: item,
            _source: 'public_data_animal',
            desertionNo: item.desertionNo,
            // ReturnPot 피드 형식
            type,
            category: 'PET',
            title: `[${item.upKindNm || '동물'}] ${item.kindNm || '품종미상'} - ${item.happenPlace?.split(' ').slice(0, 2).join(' ') || '위치미상'}`,
            description,
            location: item.happenPlace || item.careAddr || '정보없음',
            features: `${item.kindFullNm || ''} / ${item.colorCd || ''} / ${item.weight || ''} / ${item.age || ''}`,
            tags: [
                item.upKindNm || '동물',
                item.kindNm || '',
                item.processState || '보호중',
                '공공데이터'
            ].filter(Boolean),
            imageUrl: item.popfile1 || '',
            imageUrl2: item.popfile2 || '',
            urgent: !isReturned && item.processState === '보호중',
            reward: '',
            happenDt: item.happenDt,
            processState: item.processState,
            careNm: item.careNm,
            careTel: item.careTel
        };
    },

    /**
     * 시도 목록 조회
     */
    async fetchSido() {
        const url = `${BASE_URL}/sido_v2?serviceKey=${SERVICE_KEY}&numOfRows=30&_type=json`;
        const response = await fetch(url);
        const data = await response.json();
        return data.response?.body?.items?.item || [];
    },

    /**
     * 주소 → 좌표 변환 (Nominatim 지오코딩)
     * @param {string} address - 한국어 주소
     * @returns {Promise<{lat: number, lng: number}>}
     */
    async geocodeAddress(address) {
        if (!address) return { lat: 37.5007, lng: 127.0365 };

        // 주소 정제: "구 동 번지" 형태에서 핵심 부분만 추출
        const cleaned = address
            .replace(/\d+-\d+/g, '') // 번지 제거
            .replace(/\d+번?길/g, '') // 길 번호 제거
            .replace(/\(.*\)/g, '')  // 괄호 내용 제거
            .trim();

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&countrycodes=kr&limit=1`;
            const response = await fetch(url, {
                headers: { 'Accept-Language': 'ko' }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }

            // fallback: 시도+시군구만으로 재시도
            const parts = cleaned.split(/\s+/).filter(Boolean);
            if (parts.length >= 2) {
                const shortAddr = parts.slice(0, 2).join(' ');
                const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shortAddr)}&countrycodes=kr&limit=1`;
                const res2 = await fetch(url2, { headers: { 'Accept-Language': 'ko' } });
                const data2 = await res2.json();
                if (data2 && data2.length > 0) {
                    return {
                        lat: parseFloat(data2[0].lat),
                        lng: parseFloat(data2[0].lon)
                    };
                }
            }
        } catch (err) {
            console.warn('지오코딩 실패:', address, err);
        }

        // 최종 fallback: 서울 기본
        return { lat: 37.5007, lng: 127.0365 };
    }
};

function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr || '';
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
}
