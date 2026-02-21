import React, { useState, useEffect } from 'react'
import { Map, Search, PlusCircle, Bell, User, MapPin, Grid, MessageCircle, Settings, MessageSquare, Zap, ShieldCheck, Award, Edit3, LogOut } from 'lucide-react'
import NewPostForm from './components/NewPostForm'
import CommunityBoard from './components/CommunityBoard'
import ChatRoom from './components/ChatRoom'
import NeighborhoodSettings from './components/NeighborhoodSettings'
import ProfilePage from './components/ProfilePage'
import MapView from './components/MapView'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './contexts/AuthContext'
import { postService } from './services/postService'
import { storageService } from './services/storageService'


function App() {
    const { user, profile, loading, error, isAuthenticated, isAnonymous, signInAnonymous, signInWithGoogle, signOut } = useAuth();
    const [mainView, setMainView] = useState('feed') // 'feed', 'community', 'map', 'profile'
    const [view, setView] = useState('list') // 'list' or 'map'
    const [showForm, setShowForm] = useState(false)
    const [showChat, setShowChat] = useState(null) // null or post object
    const [showSettings, setShowSettings] = useState(false)
    const [myTown, setMyTown] = useState('역삼1동')
    const [categoryFilter, setCategoryFilter] = useState('ALL')

    // Firestore Data
    const [posts, setPosts] = useState([])
    const [loadingPosts, setLoadingPosts] = useState(true)

    // 날짜시간 포맷 함수
    const formatDateTime = (dateInput) => {
        if (!dateInput) return '';
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '';
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return '방금 전';
        if (diffMin < 60) return `${diffMin}분 전`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour}시간 전`;
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        if (date.getFullYear() === now.getFullYear()) {
            return `${month}/${day} ${hours}:${minutes}`;
        }
        return `${date.getFullYear()}.${month}.${day} ${hours}:${minutes}`;
    };

    // 실시간 포스트 구독
    useEffect(() => {
        setLoadingPosts(true);
        const unsubscribe = postService.subscribePosts((newPosts) => {
            setPosts(newPosts);
            setLoadingPosts(false);
        }, { category: categoryFilter });

        return () => unsubscribe();
    }, [categoryFilter]);

    const filteredPosts = posts.filter(p => categoryFilter === 'ALL' || p.category === categoryFilter);

    const handleCreatePost = async (newPost) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            let uploadedImageUrl = null;

            if (newPost.imageFile) {
                try {
                    uploadedImageUrl = await storageService.uploadImage(newPost.imageFile, 'posts');
                } catch (imgErr) {
                    console.error("이미지 업로드 실패:", imgErr);
                }
            }

            const postToSave = {
                type: newPost.type || 'LOST',
                category: newPost.category || 'PET',
                status: 'ACTIVE',
                title: newPost.title || '',
                description: newPost.description || '',
                location: newPost.location || '',
                tags: newPost.tags || [],
                urgent: newPost.urgent || false,
                uid: user.uid,
                authorNickname: profile?.nickname || '익명',
                authorAngelLevel: profile?.angelLevel || 1,
                imageUrl: uploadedImageUrl || null,
                lat: 37.5007 + (Math.random() - 0.5) * 0.02,
                lng: 127.0365 + (Math.random() - 0.5) * 0.02,
                views: 0,
                likes: 0,
                comments: 0,
                aiMatchChecking: false,
                aiMatchFound: false
            };

            await postService.createPost(postToSave);

            // 알림창 렌더링 블로킹 이슈 해결: alert 대신 즉시 화면 전환
            console.log("새로운 제보 등록 완료:", postToSave.id);
            setShowForm(false);
            setMainView('feed');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error("게시물 등록 실패:", error);
            alert("게시물 등록에 실패했습니다: " + error.message);
        }
    }

    // 로딩 중 스플래시
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(180deg, #0052CC 0%, #1976D2 100%)',
                color: 'white', gap: '16px'
            }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                </div>
                <span style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>ReturnPot</span>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // 미인증 → 로그인 화면
    if (!isAuthenticated) {
        return (
            <LoginScreen
                onAnonymousLogin={signInAnonymous}
                onGoogleLogin={signInWithGoogle}
                loading={loading}
                error={error}
            />
        );
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: '950', color: 'var(--primary)', letterSpacing: '-1px' }}>ReturnPot</h1>
                    </div>
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
            <main style={{ minHeight: 'calc(100vh - 140px)', paddingBottom: '80px' }}>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                                padding: '4px 12px',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '11px',
                                                fontWeight: '900'
                                            }}>
                                                <Zap size={12} fill="currentColor" />
                                                골든 타임 수색 모드 (반경 3km 알림 발송)
                                            </div>
                                        )}

                                        <div style={{ position: 'relative' }}>
                                            <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '160px', objectFit: 'cover', marginTop: post.urgent ? '26px' : '0' }} />

                                            {/* AI Matching Status Badge */}
                                            {post.aiMatchChecking && (
                                                <div className="glass" style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', color: 'var(--primary)' }}>
                                                    <div className="loader-small"></div> AI 매칭 분석 중...
                                                </div>
                                            )}
                                            {post.aiMatchFound && (
                                                <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', boxShadow: '0 3px 8px rgba(0, 82, 204, 0.4)' }}>
                                                    <ShieldCheck size={12} /> AI 매칭 발견
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <span style={{
                                                        backgroundColor: post.type === 'LOST' ? 'var(--secondary)' : '#4CAF50',
                                                        color: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {post.type === 'LOST' ? '분실/실종' : '습득/보호'}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#FFF9C4', color: '#FBC02D', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', border: '1px solid #FDD835' }}>
                                                        <Award size={10} /> Lv.{post.authorAngelLevel}
                                                    </div>
                                                </div>
                                                <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>{formatDateTime(post.createdAt || post.time)}</span>
                                            </div>

                                            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', lineHeight: '1.3' }}>{post.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-light)', fontSize: '12px', marginBottom: '8px' }}>
                                                <MapPin size={12} /> {post.location}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {(post.tags || []).slice(0, 3).map(tag => (
                                                        <span key={tag} style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600' }}>#{tag}</span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setShowChat(post)}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '6px 12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px',
                                                        boxShadow: '0 2px 6px rgba(0, 82, 204, 0.2)'
                                                    }}
                                                >
                                                    <MessageSquare size={14} /> 제보
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {mainView === 'map' && (
                    <MapView posts={filteredPosts} formatDateTime={formatDateTime} />
                )}

                {mainView === 'community' && (
                    <section>
                        <div style={{ padding: '24px 20px 8px 20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>커뮤니티 광장</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}><strong>{myTown}</strong> 이웃들과 정보를 나누세요.</p>
                        </div>
                        <CommunityBoard formatDateTime={formatDateTime} />
                    </section>
                )}

                {mainView === 'profile' && (
                    <section>
                        <div style={{ padding: '20px 20px 4px 20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>내 정보</h2>
                        </div>
                        <ProfilePage myTown={myTown} />
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
                    width: '56px',
                    height: '56px',
                    borderRadius: '28px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: mainView === 'feed' ? 'flex' : 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 6px 16px rgba(0, 82, 204, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 500
                }}
            >
                <PlusCircle size={28} />
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
