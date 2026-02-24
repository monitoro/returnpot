import React, { useState, useRef } from 'react';
import { X, Sparkles, Image, Check, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { communityService } from '../services/communityService';
import { postService } from '../services/postService';
import { publicDataService } from '../services/publicDataService';
import { useAuth } from '../contexts/AuthContext';

const AdminDataGenerator = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('community'); // 'community' or 'feed'

    // 커뮤니티 AI 생성 상태
    const [communityCategory, setCommunityCategory] = useState('자유게시판');
    const [generateCount, setGenerateCount] = useState(3);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [communityResults, setCommunityResults] = useState([]);
    const [communityError, setCommunityError] = useState('');

    // 피드 이미지 변환 상태
    const [feedImages, setFeedImages] = useState([]); // [{file, preview, result, status}]
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedError, setFeedError] = useState('');
    const fileInputRef = useRef(null);

    // 공공데이터 상태
    const [publicAnimals, setPublicAnimals] = useState([]);
    const [publicLoading, setPublicLoading] = useState(false);
    const [publicError, setPublicError] = useState('');
    const [publicFilter, setPublicFilter] = useState({ upkind: '', pageNo: 1 });
    const [publicTotalCount, setPublicTotalCount] = useState(0);
    const [publicSelected, setPublicSelected] = useState(new Set());
    const [publicSaving, setPublicSaving] = useState(false);
    const [publicSaved, setPublicSaved] = useState(0);

    const categories = ['자유게시판', '목격제보', '실종방지팁', '찾았어요!'];

    // ── 커뮤니티 AI 글 생성 ──
    const handleGenerateCommunity = async () => {
        setCommunityLoading(true);
        setCommunityError('');
        setCommunityResults([]);

        try {
            for (let i = 0; i < generateCount; i++) {
                const cat = communityCategory === '랜덤'
                    ? categories[Math.floor(Math.random() * categories.length)]
                    : communityCategory;

                // API 호출 간 4초 딜레이 (첫 번째 제외)
                if (i > 0) {
                    await geminiService.delay(1000);
                }

                const data = await geminiService.generateCommunityPost(cat);

                // Firestore에 글 저장
                await communityService.createPost({
                    author: data.post.author,
                    uid: `ai_generated_${Date.now()}_${i}`,
                    category: cat,
                    content: data.post.content,
                    tags: data.post.tags || [],
                    images: [],
                    linkUrl: ''
                });

                // 실시간 결과 업데이트
                setCommunityResults(prev => [...prev, {
                    category: cat,
                    author: data.post.author,
                    content: data.post.content.substring(0, 50) + '...',
                    replyCount: data.replies?.length || 0,
                    status: 'success'
                }]);
            }
        } catch (err) {
            console.error('커뮤니티 글 생성 실패:', err);
            setCommunityError(err.message);
        } finally {
            setCommunityLoading(false);
        }
    };

    // ── 피드 이미지 파일 선택 ──
    const handleFeedImageSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setFeedImages(prev => [...prev, {
                    file,
                    preview: ev.target.result,
                    result: null,
                    status: 'pending' // pending, analyzing, done, error
                }]);
            };
            reader.readAsDataURL(file);
        });
        if (e.target) e.target.value = '';
    };

    // ── 이미지 분석 + 피드 게시물 생성 ──
    const handleAnalyzeAndCreate = async () => {
        setFeedLoading(true);
        setFeedError('');

        const pending = feedImages.filter(img => img.status === 'pending');
        if (pending.length === 0) {
            setFeedError('분석할 이미지가 없습니다.');
            setFeedLoading(false);
            return;
        }

        for (let i = 0; i < feedImages.length; i++) {
            if (feedImages[i].status !== 'pending') continue;

            // API 호출 간 4초 딜레이
            if (i > 0) {
                await geminiService.delay(1000);
            }

            // 분석 중 상태로 변경
            setFeedImages(prev => prev.map((img, idx) =>
                idx === i ? { ...img, status: 'analyzing' } : img
            ));

            try {
                const result = await geminiService.analyzeImageForFeed(feedImages[i].preview);

                // Firestore에 피드 게시물 생성
                await postService.createPost({
                    uid: user.uid,
                    type: result.type || 'LOST',
                    category: result.category || 'PET',
                    title: result.title,
                    description: result.description,
                    location: result.location || '서울시 강남구',
                    features: result.features || '',
                    tags: result.tags || [],
                    reward: result.reward || '',
                    urgent: result.urgent || false,
                    imageUrl: feedImages[i].preview,
                    authorName: '어드민',
                    authorAngelLevel: 5,
                    contact: '',
                    lat: 37.5007 + (Math.random() - 0.5) * 0.02,
                    lng: 127.0365 + (Math.random() - 0.5) * 0.02,
                });

                setFeedImages(prev => prev.map((img, idx) =>
                    idx === i ? { ...img, result, status: 'done' } : img
                ));
            } catch (err) {
                console.error('이미지 분석 실패:', err);
                setFeedImages(prev => prev.map((img, idx) =>
                    idx === i ? { ...img, status: 'error', result: { error: err.message } } : img
                ));
            }
        }
        setFeedLoading(false);
    };

    const removeImage = (index) => {
        setFeedImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 4000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '480px', maxHeight: '85vh',
                backgroundColor: 'white', borderRadius: '20px',
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                {/* 헤더 */}
                <div style={{
                    padding: '18px 20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} />
                        <span style={{ fontSize: '17px', fontWeight: '800' }}>🛠️ 어드민 데이터 생성기</span>
                    </div>
                    <button type="button" onClick={onClose}
                        style={{ border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                        <X size={18} color="white" />
                    </button>
                </div>

                {/* 탭 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    {[
                        { key: 'community', label: '🤖 커뮤니티 AI', icon: Sparkles },
                        { key: 'feed', label: '📷 이미지 변환', icon: Image },
                        { key: 'public', label: '📦 공공데이터', icon: Sparkles }
                    ].map(tab => (
                        <button key={tab.key} type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: '14px', border: 'none',
                                backgroundColor: activeTab === tab.key ? '#f0f4ff' : 'white',
                                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                                color: activeTab === tab.key ? '#667eea' : '#888',
                                fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 콘텐츠 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                    {/* ── 커뮤니티 AI 글 생성 ── */}
                    {activeTab === 'community' && (
                        <div>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
                                Gemini AI가 카테고리에 맞는 자연스러운 커뮤니티 글과 랜덤 답글을 생성합니다.
                            </p>

                            {/* 카테고리 선택 */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '6px', display: 'block' }}>
                                    카테고리
                                </label>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {['랜덤', ...categories].map(cat => (
                                        <button key={cat} type="button"
                                            onClick={() => setCommunityCategory(cat)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px',
                                                border: communityCategory === cat ? '2px solid #667eea' : '1px solid #ddd',
                                                backgroundColor: communityCategory === cat ? '#f0f4ff' : 'white',
                                                color: communityCategory === cat ? '#667eea' : '#666',
                                                fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >{cat}</button>
                                    ))}
                                </div>
                            </div>

                            {/* 생성 개수 */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '6px', display: 'block' }}>
                                    생성 개수
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[1, 3, 5, 10].map(n => (
                                        <button key={n} type="button"
                                            onClick={() => setGenerateCount(n)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '8px',
                                                border: generateCount === n ? '2px solid #667eea' : '1px solid #ddd',
                                                backgroundColor: generateCount === n ? '#f0f4ff' : 'white',
                                                color: generateCount === n ? '#667eea' : '#666',
                                                fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                                            }}
                                        >{n}개</button>
                                    ))}
                                </div>
                            </div>

                            {/* 생성 버튼 */}
                            <button type="button" onClick={handleGenerateCommunity}
                                disabled={communityLoading}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                    background: communityLoading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white', fontSize: '14px', fontWeight: '800',
                                    cursor: communityLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {communityLoading ? (
                                    <><div className="loader-small" /> AI가 글을 작성하는 중...</>
                                ) : (
                                    <><Sparkles size={16} /> {generateCount}개 글 + 답글 생성</>
                                )}
                            </button>

                            {/* 에러 */}
                            {communityError && (
                                <div style={{
                                    marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                                    backgroundColor: '#FFF5F5', border: '1px solid #FC8181',
                                    color: '#C53030', fontSize: '12px',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <AlertCircle size={14} /> {communityError}
                                </div>
                            )}

                            {/* 결과 */}
                            {communityResults.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#333' }}>
                                        ✅ 생성 완료 ({communityResults.length}개)
                                    </div>
                                    {communityResults.map((r, i) => (
                                        <div key={`result-${r.author}-${i}`} style={{
                                            padding: '10px 12px', borderRadius: '8px',
                                            backgroundColor: '#f8f9fa', marginBottom: '6px',
                                            fontSize: '12px', lineHeight: '1.5'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '700', color: '#667eea' }}>[{r.category}]</span>
                                                <span style={{ color: '#4CAF50' }}>
                                                    <Check size={12} /> 저장됨
                                                </span>
                                            </div>
                                            <div style={{ color: '#555', marginTop: '2px' }}>
                                                <strong>{r.author}</strong>: {r.content}
                                            </div>
                                            <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                                                답글 {r.replyCount}개 포함
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 피드 이미지 변환 ── */}
                    {activeTab === 'feed' && (
                        <div>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
                                분실/실종 관련 이미지(전단지, 캡처 등)를 업로드하면 Gemini AI가 분석하여 피드 게시물로 자동 변환합니다.
                            </p>

                            {/* 이미지 업로드 영역 */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                                role="button"
                                tabIndex={0}
                                style={{
                                    border: '2px dashed #ccc', borderRadius: '12px',
                                    padding: '30px', textAlign: 'center', cursor: 'pointer',
                                    marginBottom: '16px', transition: 'border-color 0.2s',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                <Image size={32} color="#bbb" style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#888' }}>
                                    이미지 파일을 클릭하여 선택
                                </div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    여러 장 동시 선택 가능 (당근, 전단지, 사진 등)
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFeedImageSelect}
                                style={{ display: 'none' }}
                            />

                            {/* 선택된 이미지 미리보기 */}
                            {feedImages.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    {feedImages.map((img, i) => (
                                        <div key={`img-${img.file?.name}-${i}`} style={{
                                            display: 'flex', gap: '10px', alignItems: 'center',
                                            padding: '10px', borderRadius: '10px',
                                            backgroundColor: img.status === 'done' ? '#f0fff4' :
                                                img.status === 'error' ? '#fff5f5' :
                                                img.status === 'analyzing' ? '#f0f4ff' : '#f9f9f9',
                                            border: '1px solid',
                                            borderColor: img.status === 'done' ? '#C6F6D5' :
                                                img.status === 'error' ? '#FEB2B2' :
                                                img.status === 'analyzing' ? '#C3DAFE' : '#eee'
                                        }}>
                                            <img src={img.preview} alt="미리보기" style={{
                                                width: '50px', height: '50px', borderRadius: '6px',
                                                objectFit: 'cover'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                {img.status === 'pending' && (
                                                    <span style={{ fontSize: '12px', color: '#888' }}>분석 대기 중</span>
                                                )}
                                                {img.status === 'analyzing' && (
                                                    <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>
                                                        🔍 AI 분석 중...
                                                    </span>
                                                )}
                                                {img.status === 'done' && img.result && (
                                                    <div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#2D3748' }}>
                                                            {img.result.title}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#718096' }}>
                                                            {img.result.type} · {img.result.category} · {img.result.location}
                                                        </div>
                                                    </div>
                                                )}
                                                {img.status === 'error' && (
                                                    <span style={{ fontSize: '12px', color: '#E53E3E' }}>❌ 분석 실패</span>
                                                )}
                                            </div>
                                            {img.status === 'done' && <Check size={18} color="#38A169" />}
                                            {img.status === 'pending' && (
                                                <button type="button" onClick={() => removeImage(i)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                                                    <X size={16} color="#999" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 분석+생성 버튼 */}
                            {feedImages.some(img => img.status === 'pending') && (
                                <button type="button" onClick={handleAnalyzeAndCreate}
                                    disabled={feedLoading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                        background: feedLoading ? '#ccc' : 'linear-gradient(135deg, #38A169, #2F855A)',
                                        color: 'white', fontSize: '14px', fontWeight: '800',
                                        cursor: feedLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {feedLoading ? (
                                        <><div className="loader-small" /> AI가 이미지를 분석하는 중...</>
                                    ) : (
                                        <><Image size={16} /> {feedImages.filter(i => i.status === 'pending').length}개 이미지 분석 + 게시물 생성</>
                                    )}
                                </button>
                            )}

                            {/* 에러 */}
                            {feedError && (
                                <div style={{
                                    marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                                    backgroundColor: '#FFF5F5', border: '1px solid #FC8181',
                                    color: '#C53030', fontSize: '12px',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <AlertCircle size={14} /> {feedError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 공공데이터 유기동물 ── */}
                    {activeTab === 'public' && (
                        <div>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
                                농림축산식품부 유기동물 API에서 데이터를 가져와 피드 게시물로 변환합니다.
                            </p>

                            {/* 필터 */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                {[
                                    { label: '전체', value: '' },
                                    { label: '🐶 개', value: '417000' },
                                    { label: '🐱 고양이', value: '422400' },
                                    { label: '🐾 기타', value: '429900' }
                                ].map(f => (
                                    <button key={f.value} type="button"
                                        onClick={() => setPublicFilter({ ...publicFilter, upkind: f.value, pageNo: 1 })}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px',
                                            border: publicFilter.upkind === f.value ? '2px solid #38A169' : '1px solid #ddd',
                                            backgroundColor: publicFilter.upkind === f.value ? '#f0fff4' : 'white',
                                            color: publicFilter.upkind === f.value ? '#38A169' : '#666',
                                            fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >{f.label}</button>
                                ))}
                            </div>

                            {/* 조회 버튼 */}
                            <button type="button" onClick={async () => {
                                setPublicLoading(true);
                                setPublicError('');
                                try {
                                    const result = await publicDataService.fetchAnimals({
                                        upkind: publicFilter.upkind,
                                        numOfRows: 20,
                                        pageNo: publicFilter.pageNo
                                    });
                                    setPublicAnimals(result.items);
                                    setPublicTotalCount(result.totalCount);
                                    setPublicSelected(new Set());
                                } catch (err) {
                                    setPublicError(err.message);
                                } finally {
                                    setPublicLoading(false);
                                }
                            }} disabled={publicLoading} style={{
                                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                                background: publicLoading ? '#ccc' : 'linear-gradient(135deg, #38A169, #2F855A)',
                                color: 'white', fontSize: '14px', fontWeight: '800',
                                cursor: publicLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginBottom: '12px'
                            }}>
                                {publicLoading ? '데이터 조회 중...' : `🔍 유기동물 조회 (${publicFilter.pageNo}페이지)`}
                            </button>

                            {publicError && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '8px',
                                    backgroundColor: '#FFF5F5', border: '1px solid #FC8181',
                                    color: '#C53030', fontSize: '12px', marginBottom: '12px',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <AlertCircle size={14} /> {publicError}
                                </div>
                            )}

                            {/* 결과 목록 */}
                            {publicAnimals.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', color: '#888' }}>
                                            총 {publicTotalCount.toLocaleString()}건 중 {publicAnimals.length}건 표시
                                        </span>
                                        <button type="button" onClick={() => {
                                            setPublicSelected(publicSelected.size === publicAnimals.length
                                                ? new Set()
                                                : new Set(publicAnimals.map((_, i) => i))
                                            );
                                        }} style={{
                                            padding: '4px 10px', borderRadius: '6px', border: '1px solid #ddd',
                                            backgroundColor: 'white', color: '#666', fontSize: '11px',
                                            fontWeight: '600', cursor: 'pointer'
                                        }}>
                                            {publicSelected.size === publicAnimals.length ? '전체 해제' : '전체 선택'}
                                        </button>
                                    </div>

                                    {/* 동물 카드 목록 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                                        {publicAnimals.map((animal, i) => (
                                            <div key={animal.desertionNo || `animal-${i}`}
                                                onClick={() => {
                                                    setPublicSelected(prev => {
                                                        const next = new Set(prev);
                                                        next.has(i) ? next.delete(i) : next.add(i);
                                                        return next;
                                                    });
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {
                                                    setPublicSelected(prev => {
                                                        const next = new Set(prev);
                                                        next.has(i) ? next.delete(i) : next.add(i);
                                                        return next;
                                                    });
                                                }}}
                                                style={{
                                                    display: 'flex', gap: '10px', padding: '8px',
                                                    borderRadius: '10px', cursor: 'pointer',
                                                    border: publicSelected.has(i) ? '2px solid #38A169' : '1px solid #eee',
                                                    backgroundColor: publicSelected.has(i) ? '#f0fff4' : '#fafafa'
                                                }}
                                            >
                                                {animal.imageUrl ? (
                                                    <img src={animal.imageUrl} alt={animal.title}
                                                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                        🐾
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#2D3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {animal.title}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                                        {animal.location?.split(' ').slice(0, 3).join(' ')}
                                                    </div>
                                                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                                                        <span style={{
                                                            padding: '1px 6px', borderRadius: '4px',
                                                            backgroundColor: animal.processState === '보호중' ? '#FED7D7' : '#C6F6D5',
                                                            color: animal.processState === '보호중' ? '#C53030' : '#2F855A',
                                                            fontWeight: '600'
                                                        }}>
                                                            {animal.processState || '보호중'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '6px',
                                                    border: publicSelected.has(i) ? '2px solid #38A169' : '2px solid #ccc',
                                                    backgroundColor: publicSelected.has(i) ? '#38A169' : 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, alignSelf: 'center', color: 'white', fontSize: '12px'
                                                }}>
                                                    {publicSelected.has(i) ? '✓' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 페이지 이동 */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                                        <button type="button" disabled={publicFilter.pageNo <= 1}
                                            onClick={() => setPublicFilter(f => ({ ...f, pageNo: f.pageNo - 1 }))}
                                            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}
                                        >◀ 이전</button>
                                        <span style={{ padding: '6px 10px', fontSize: '13px', fontWeight: '700', color: '#333' }}>
                                            {publicFilter.pageNo} / {Math.ceil(publicTotalCount / 20) || 1}
                                        </span>
                                        <button type="button"
                                            disabled={publicFilter.pageNo >= Math.ceil(publicTotalCount / 20)}
                                            onClick={() => setPublicFilter(f => ({ ...f, pageNo: f.pageNo + 1 }))}
                                            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}
                                        >다음 ▶</button>
                                    </div>

                                    {/* 선택 저장 버튼 */}
                                    {publicSelected.size > 0 && (
                                        <button type="button" onClick={async () => {
                                            setPublicSaving(true);
                                            setPublicSaved(0);
                                            let saved = 0;
                                            for (const idx of publicSelected) {
                                                const animal = publicAnimals[idx];
                                                if (!animal) continue;
                                                try {
                                                    // 주소 → 좌표 변환 (Nominatim 1초 제한)
                                                    const coords = await publicDataService.geocodeAddress(animal.location);
                                                    await postService.createPost({
                                                        uid: user.uid,
                                                        type: animal.type,
                                                        category: animal.category,
                                                        title: animal.title,
                                                        description: animal.description,
                                                        location: animal.location,
                                                        features: animal.features,
                                                        tags: animal.tags,
                                                        imageUrl: animal.imageUrl,
                                                        urgent: animal.urgent,
                                                        reward: '',
                                                        authorName: '공공데이터',
                                                        authorAngelLevel: 5,
                                                        contact: animal.careTel || '',
                                                        lat: coords.lat,
                                                        lng: coords.lng,
                                                        source: 'public_data_animal',
                                                        sourceId: animal.desertionNo
                                                    });
                                                    saved++;
                                                    setPublicSaved(saved);
                                                    // Nominatim 속도 제한 (초당 1회)
                                                    await new Promise(r => setTimeout(r, 1100));
                                                } catch (err) {
                                                    console.error('저장 실패:', err);
                                                }
                                            }
                                            setPublicSaving(false);
                                            setPublicSelected(new Set());
                                            alert(`${saved}건의 유기동물 데이터가 피드에 저장되었습니다!`);
                                        }} disabled={publicSaving} style={{
                                            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                            background: publicSaving ? '#ccc' : 'linear-gradient(135deg, #38A169, #276749)',
                                            color: 'white', fontSize: '14px', fontWeight: '800',
                                            cursor: publicSaving ? 'not-allowed' : 'pointer',
                                            marginTop: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}>
                                            {publicSaving
                                                ? `저장 중... (${publicSaved}/${publicSelected.size})`
                                                : `✅ 선택한 ${publicSelected.size}건 피드에 저장`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDataGenerator;
