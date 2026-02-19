import React, { useState } from 'react'
import { Map, Search, PlusCircle, Bell, User, MapPin, Grid, MessageCircle, Settings, MessageSquare, Zap, ShieldCheck, Award } from 'lucide-react'
import NewPostForm from './components/NewPostForm'
import CommunityBoard from './components/CommunityBoard'
import ChatRoom from './components/ChatRoom'
import NeighborhoodSettings from './components/NeighborhoodSettings'

import { postService } from './services/postService'

function App() {
    const [mainView, setMainView] = useState('feed') // 'feed', 'community', 'map', 'profile'
    const [view, setView] = useState('list') // 'list' or 'map'
    const [showForm, setShowForm] = useState(false)
    const [showChat, setShowChat] = useState(null) // null or post object
    const [showSettings, setShowSettings] = useState(false)
    const [myTown, setMyTown] = useState('역삼1동')
    const [categoryFilter, setCategoryFilter] = useState('ALL')

    const [posts, setPosts] = useState([
        {
            id: 1,
            type: 'LOST',
            category: 'HUMAN',
            title: '70대 어르신을 찾습니다 (긴급)',
            location: '서울시 강남구 역삼역 인근',
            time: '15분 전',
            imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=800&q=80',
            tags: ['기억장애', '회색셔츠', '강남구'],
            urgent: true,
            authorAngelLevel: 9,
            aiMatchFound: true
        },
        {
            id: 2,
            type: 'LOST',
            category: 'PET',
            title: '골든 리트리버를 찾습니다',
            location: '서울시 강남구 역삼동',
            time: '2시간 전',
            imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
            tags: ['노란색', '대형견', '친근함'],
            authorAngelLevel: 3
        },
        {
            id: 3,
            type: 'FOUND',
            category: 'ITEM',
            title: '갈색 가죽 지갑 습득',
            location: '서울시 서초구 서초동',
            time: '5시간 전',
            imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
            tags: ['브랜드미상', '반지갑'],
            authorAngelLevel: 12,
            aiMatchFound: false
        }
    ])

    // Firebase 실시간 구독
    React.useEffect(() => {
        // 환경 변수가 설정된 경우에만 Firebase 연동
        if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'YOUR_API_KEY') {
            const unsubscribe = postService.subscribePosts((newPosts) => {
                if (newPosts.length > 0) {
                    setPosts(newPosts);
                }
            }, categoryFilter);
            return () => unsubscribe();
        }
    }, [categoryFilter]);

    const filteredPosts = posts.filter(p => categoryFilter === 'ALL' || p.category === categoryFilter);

    const handleCreatePost = async (newPost) => {
        const postToSave = {
            ...newPost,
            authorAngelLevel: 1,
            aiMatchFound: Math.random() > 0.5, // 데모용 랜덤 매칭
            imageUrl: newPost.image || 'https://via.placeholder.com/400x300?text=No+Image'
        }

        // Firebase 연동
        if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'YOUR_API_KEY') {
            try {
                await postService.createPost(postToSave);
            } catch (error) {
                console.error("Firebase 저장 실패, 로컬 상태만 업데이트합니다.", error);
                setPosts([{ ...postToSave, id: Date.now(), time: '방금 전' }, ...posts]);
            }
        } else {
            // Mock 모드
            setPosts([{ ...postToSave, id: Date.now(), time: '방금 전' }, ...posts]);
        }

        setShowForm(false)
    }

    return (
        <div className="container">
            {showForm && <NewPostForm onBack={() => setShowForm(false)} onSubmit={handleCreatePost} />}
            {showChat && <ChatRoom post={showChat} onBack={() => setShowChat(null)} />}
            {showSettings && <NeighborhoodSettings currentTown={myTown} onBack={() => setShowSettings(false)} onSave={(town) => { setMyTown(town); setShowSettings(false); }} />}

            {/* Header */}
            <header className="glass" style={{
                padding: '16px 20px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: 'var(--surface)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '950', color: 'var(--primary)', letterSpacing: '-1px' }}>RETURNS</h1>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Search size={22} color="var(--text)" />
                        <div style={{ position: 'relative' }}>
                            <Bell size={22} color="var(--text)" />
                            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--secondary)', borderRadius: '50%', border: '2px solid white' }}></div>
                        </div>
                    </div>
                </div>

                {/* Neighborhood Selector */}
                <div
                    onClick={() => setShowSettings(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                    <MapPin size={16} color="var(--primary)" />
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{myTown}</span>
                    <Settings size={14} color="var(--text-light)" />
                </div>
            </header>

            {/* Main Content */}
            <main style={{ minHeight: 'calc(100vh - 140px)' }}>
                {mainView === 'feed' && (
                    <section>
                        {/* Category Filter Chips */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            padding: '16px 20px',
                            overflowX: 'auto',
                            backgroundColor: 'var(--background)'
                        }}>
                            {['ALL', 'HUMAN', 'PET', 'ITEM'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: categoryFilter === cat ? 'var(--primary)' : 'white',
                                        color: categoryFilter === cat ? 'white' : 'var(--text-light)',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {cat === 'ALL' && '전체'}
                                    {cat === 'HUMAN' && '사람'}
                                    {cat === 'PET' && '반려동물'}
                                    {cat === 'ITEM' && '물건'}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>실시간 상황판</h2>
                                <div style={{ display: 'flex', backgroundColor: '#eee', borderRadius: '8px', padding: '2px' }}>
                                    <button onClick={() => setView('list')} style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', backgroundColor: view === 'list' ? 'white' : 'transparent', cursor: 'pointer' }}><Grid size={16} /></button>
                                    <button onClick={() => setView('map')} style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', backgroundColor: view === 'map' ? 'white' : 'transparent', cursor: 'pointer' }}><Map size={16} /></button>
                                </div>
                            </div>

                            {/* List View */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {filteredPosts.map(post => (
                                    <div key={post.id} className="premium-card" style={{
                                        overflow: 'hidden',
                                        border: post.urgent ? '2px solid var(--secondary)' : '1px solid var(--border)',
                                        position: 'relative',
                                        transition: 'transform 0.2s'
                                    }}>
                                        {/* Golden Time Mobilization Banner */}
                                        {post.urgent && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                backgroundColor: 'var(--secondary)',
                                                color: 'white',
                                                padding: '6px 12px',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '12px',
                                                fontWeight: '900'
                                            }}>
                                                <Zap size={14} fill="currentColor" />
                                                골든 타임 수색 모드 활성화 (반경 3km 알림 발송됨)
                                            </div>
                                        )}

                                        <div style={{ position: 'relative' }}>
                                            <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '220px', objectFit: 'cover', marginTop: post.urgent ? '30px' : '0' }} />

                                            {/* AI Matching Status Badge */}
                                            {post.aiMatchChecking && (
                                                <div className="glass" style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: 'var(--primary)' }}>
                                                    <div className="loader-small"></div> AI 매칭 분석 중...
                                                </div>
                                            )}
                                            {post.aiMatchFound && (
                                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0, 82, 204, 0.4)' }}>
                                                    <ShieldCheck size={14} /> AI 지능형 매칭 발견!
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <span style={{
                                                        backgroundColor: post.type === 'LOST' ? 'var(--secondary)' : '#4CAF50',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {post.type === 'LOST' ? '분실/실종' : '습득/보호'}
                                                    </span>

                                                    {/* Returns Angel Level Badge */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#FFF9C4', color: '#FBC02D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', border: '1px solid #FDD835' }}>
                                                        <Award size={12} /> Angel Lvl.{post.authorAngelLevel}
                                                    </div>
                                                </div>
                                                <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>{post.time}</span>
                                            </div>

                                            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '6px', lineHeight: '1.4' }}>{post.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-light)', fontSize: '14px', marginBottom: '12px' }}>
                                                <MapPin size={14} /> {post.location}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {post.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>#{tag}</span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setShowChat(post)}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '8px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '13px',
                                                        boxShadow: '0 4px 8px rgba(0, 82, 204, 0.2)'
                                                    }}
                                                >
                                                    <MessageSquare size={16} /> 제보하기
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {mainView === 'community' && (
                    <section>
                        <div style={{ padding: '24px 20px 8px 20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>커뮤니티 광장</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}><strong>{myTown}</strong> 이웃들과 정보를 나누세요.</p>
                        </div>
                        <CommunityBoard />
                    </section>
                )}
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowForm(true)}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 6px 16px rgba(0, 82, 204, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 500
                }}
            >
                <PlusCircle size={32} />
            </button>

            {/* Bottom Nav */}
            <nav className="bottom-nav glass" style={{
                borderTop: '1px solid var(--border)',
                padding: '0 10px'
            }}>
                {[
                    { id: 'feed', icon: Grid, label: '피드' },
                    { id: 'map', icon: MapPin, label: '지도' },
                    { id: 'community', icon: MessageCircle, label: '커뮤니티' },
                    { id: 'profile', icon: User, label: '정보' }
                ].map(item => (
                    <div
                        key={item.id}
                        onClick={() => setMainView(item.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            color: mainView === item.id ? 'var(--primary)' : 'var(--text-light)',
                            cursor: 'pointer'
                        }}
                    >
                        <item.icon size={22} strokeWidth={mainView === item.id ? 2.5 : 2} />
                        <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: mainView === item.id ? '800' : '500' }}>{item.label}</span>
                    </div>
                ))}
            </nav>

            <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    )
}

export default App
