# 📋 리턴즈 (Returns) — 실제 구현 및 배포 계획서

## 📊 현재 상태 요약

### ✅ UI 구현 완료
| 탭 | 컴포넌트 | 상태 |
|---|---|:---:|
| 피드 | App.jsx (feed) | ✅ Mock 데이터 |
| 지도 | MapView.jsx | ✅ Leaflet CDN + Mock 마커 |
| 커뮤니티 | CommunityBoard.jsx | ✅ Mock 데이터, 글쓰기 모달 |
| 정보 | ProfilePage.jsx | ✅ Mock 데이터 (레벨/뱃지/직함) |

### ✅ 인프라 구축 완료
- Firebase 프로젝트: `returnpot-ce52f`
- Firestore, Storage, Auth 초기화됨
- `.env` 설정 완료

### 🔴 아직 미구현 (Mock/하드코딩 상태)
- 실제 Firestore CRUD 연동
- 사용자 인증 (로그인/회원가입)
- 이미지 업로드 (Firebase Storage)
- 게시물 실시간 구독
- 프로필/뱃지/레벨 Firestore 연동
- 커뮤니티 게시물 Firestore 연동
- 빌드 & 배포

---

## 🚀 구현 단계 (Phase)

### Phase 1: 인증 시스템 🔐
> **목표**: 사용자가 로그인/로그아웃할 수 있는 기본 인증 구현

**작업 항목:**
1. **익명 인증 + Google 인증** 구현
   - `src/services/authService.js` 생성
   - 익명 로그인 (첫 진입 시 자동)
   - Google 소셜 로그인 (선택)
2. **사용자 프로필 Firestore 연동**
   - `users` 컬렉션 생성
   - 닉네임, 동네, 레벨, EXP, 뱃지 저장
3. **AuthContext 전역 상태**
   - 로그인 상태 관리
   - Protected Route 적용

**파일 변경:**
- `src/services/authService.js` (신규)
- `src/contexts/AuthContext.jsx` (신규)
- `src/components/ProfilePage.jsx` (수정)
- `src/App.jsx` (수정)

---

### Phase 2: 게시물 CRUD 연동 📝
> **목표**: 피드/커뮤니티 게시물을 Firestore에 실제 저장하고 실시간 로드

**작업 항목:**
1. **피드 게시물 (posts 컬렉션)**
   - `postService.js` 확장: CRUD + 실시간 구독
   - 게시물 작성 시 Firestore 저장
   - 카테고리별 필터링 쿼리
   - 게시물 상태 관리 (ACTIVE/RESOLVED)
2. **커뮤니티 게시물 (community_posts 컬렉션)**
   - `src/services/communityService.js` 생성
   - 좋아요 (liked_by 배열 또는 서브컬렉션)
   - 댓글 서브컬렉션
3. **Firestore 인덱스 설정**
   - category + createdAt 복합 인덱스
   - community_posts용 인덱스

**파일 변경:**
- `src/services/postService.js` (수정)
- `src/services/communityService.js` (신규)
- `src/components/CommunityBoard.jsx` (수정)
- `src/App.jsx` (수정)

---

### Phase 3: 이미지 업로드 📸
> **목표**: 게시물에 실제 사진을 업로드하고 표시

**작업 항목:**
1. **Firebase Storage 업로드**
   - `src/services/storageService.js` 생성
   - 클라이언트 측 이미지 압축 (WebP 변환)
   - 업로드 진행률 표시
   - 최대 4장 업로드
2. **이미지 URL Firestore 연동**
   - 게시물에 imageUrls 배열 저장
   - 커뮤니티 게시물에도 연동

**파일 변경:**
- `src/services/storageService.js` (신규)
- `src/components/NewPostForm.jsx` (수정)
- `src/components/CommunityBoard.jsx` (수정)

---

### Phase 4: 지도 실시간 연동 🗺️
> **목표**: Firestore 게시물을 지도에 실시간 마커로 표시

**작업 항목:**
1. **Firestore 게시물 → 지도 마커 연동**
   - 위치 정보가 있는 게시물만 마커 표시
   - 실시간 업데이트
2. **위치 정보 입력 개선**
   - 게시물 작성 시 위치 선택 기능
   - Geolocation API로 현재 위치 자동 입력
3. **골든 타임 알림 UI**
   - urgent 게시물 실시간 반영

**파일 변경:**
- `src/components/MapView.jsx` (수정)
- `src/components/NewPostForm.jsx` (수정)

---

### Phase 5: 프로필 & 게임화 시스템 🏅
> **목표**: 레벨/뱃지/직함을 실제 활동 데이터와 연동

**작업 항목:**
1. **EXP 시스템 실제 구현**
   - 활동별 EXP 적립 로직
   - 레벨업 자동 처리
2. **뱃지 해금 조건 체크**
   - 자동 뱃지 해금 로직
3. **직함 장착 Firestore 연동**
   - 현재 직함 저장/변경

**파일 변경:**
- `src/services/profileService.js` (신규)
- `src/components/ProfilePage.jsx` (수정)

---

### Phase 6: Firestore 보안 규칙 🛡️
> **목표**: 프로덕션 보안 규칙 설정

**규칙:**
- 인증된 사용자만 게시물 작성 가능
- 본인 게시물만 수정/삭제 가능
- 프로필은 본인만 수정 가능
- 읽기는 인증된 사용자 모두 가능

---

### Phase 7: 빌드 & 배포 🌐
> **목표**: Firebase Hosting으로 프로덕션 배포

**작업 항목:**
1. **빌드 최적화**
   - `vite build` 프로덕션 빌드
   - 불필요 패키지 제거 (react-leaflet 등)
   - 번들 사이즈 분석
2. **Firebase Hosting 설정**
   - `firebase init hosting`
   - `firebase.json` 설정 (SPA rewrite)
   - 커스텀 도메인 (선택)
3. **배포**
   - `firebase deploy`
   - 배포 URL 확인

---

## ⏰ 예상 작업 순서
```
Phase 1 (인증) → Phase 2 (게시물 CRUD) → Phase 3 (이미지)
→ Phase 4 (지도 연동) → Phase 5 (프로필) → Phase 6 (보안) → Phase 7 (배포)
```

## 🎯 우선 즉시 실행: Phase 1 + Phase 7(배포 준비)
인증 시스템을 먼저 구축하면서, 동시에 현재 UI만으로도 배포 가능한 상태를 만듦.
