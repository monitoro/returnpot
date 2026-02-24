import React, { useState, useEffect } from 'react'
import { Map, Search, PlusCircle, Bell, User, MapPin, Grid, MessageCircle, Settings, MessageSquare, Zap, ShieldCheck, Award, Edit3, LogOut, Trash2, CheckSquare, Square, X, CheckCircle, Heart, Eye, Share2 } from 'lucide-react'
import NewPostForm from './components/NewPostForm'
import CommunityBoard from './components/CommunityBoard'
import ChatRoom from './components/ChatRoom'
import NeighborhoodSettings from './components/NeighborhoodSettings'
import ProfilePage from './components/ProfilePage'
import MapView from './components/MapView'
import AdminDataGenerator from './components/AdminDataGenerator'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './contexts/AuthContext'
import { postService } from './services/postService'
import { storageService } from './services/storageService'
import { authService } from './services/authService'
import { chatService } from './services/chatService'


function App() {
    const { user, profile, loading, error, isAuthenticated, isAnonymous, isAdmin, signInAnonymous, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut } = useAuth();
    const [mainView, setMainView] = useState('feed') // 'feed', 'community', 'map', 'profile'
    const [view, setView] = useState('list') // 'list' or 'map'
    const [showForm, setShowForm] = useState(false)
    const [showChat, setShowChat] = useState(null) // null or post object
    const [showSettings, setShowSettings] = useState(false)
    const [showPostDetail, setShowPostDetail] = useState(null) // null or post object
    const [myTown, setMyTown] = useState('역삼1동')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    // 어드민 다중 선택 삭제
    const [selectMode, setSelectMode] = useState(false)
    const [selectedPosts, setSelectedPosts] = useState(new Set())
    const [showAdminGenerator, setShowAdminGenerator] = useState(false)
    const [confirmAction, setConfirmAction] = useState(null) // 커스텀 확인 팝업 상태

    // Firestore Data
    const [posts, setPosts] = useState([])
    const [loadingPosts, setLoadingPosts] = useState(true)
    const [likedPosts, setLikedPosts] = useState(new Set()) // 좋아요한 게시물 ID
    const [viewedPosts, setViewedPosts] = useState(new Set()) // 조회된 게시물 ID (중복 방지)

    // 피드 상세 모달 내 댓글 상태
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [likedComments, setLikedComments] = useState(new Set()) // 좋아요한 댓글 ID

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

    // 피드 상세 팝업 댓글 실시간 구독 (모달이 열릴 때만)
    useEffect(() => {
        if (!showPostDetail || !showPostDetail.id) return;
        
        const unsubscribe = chatService.subscribeComments(showPostDetail.id, (msgs) => {
            setComments(msgs);
            if (user && !isAnonymous) {
                msgs.forEach(async (msg) => {
                    const liked = await chatService.checkCommentLiked(showPostDetail.id, msg.id, user.uid);
                    if (liked) {
                        setLikedComments(prev => new Set(prev).add(msg.id));
                    }
                });
            }
        });
        
        return () => unsubscribe();
    }, [showPostDetail, user, isAnonymous]);

    const filteredPosts = posts.filter(p => categoryFilter === 'ALL' || p.category === categoryFilter);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlPostId = params.get('postId');
        if (urlPostId) {
            postService.getPost(urlPostId).then(post => {
                if (post) {
                    setShowPostDetail(post);
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }).catch(console.error);
        }
    }, []);

    const handleShare = (e, post) => {
        if (e) e.stopPropagation();
        const shareUrl = `${window.location.origin}/?postId=${post.id}`;
        if (navigator.share) {
            navigator.share({
                title: post.title || '제보',
                text: post.description ? post.description.slice(0, 50) + '...' : '도움을 주세요.',
                url: shareUrl,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('공유 링크가 클립보드에 복사되었습니다.');
            });
        }
    };

    const handleCreatePost = async (newPost, tempPostId) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            // 다중 이미지 업로드
            const uploadedImageUrls = [];
            if (newPost.imageFiles && newPost.imageFiles.length > 0) {
                for (const file of newPost.imageFiles) {
                    try {
                        const url = await storageService.uploadImage(file, 'posts');
                        uploadedImageUrls.push(url);
                    } catch (imgErr) {
                        console.error("이미지 업로드 실패:", imgErr);
                    }
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
                imageUrl: uploadedImageUrls[0] || null,
                images: uploadedImageUrls,
                lat: 37.5007 + (Math.random() - 0.5) * 0.02,
                lng: 127.0365 + (Math.random() - 0.5) * 0.02,
                views: 0,
                likes: 0,
                comments: 0,
                aiMatchChecking: false,
                aiMatchFound: false
            };

            await postService.createPost(postToSave, tempPostId);

            // 통계 + 경험치 갱신
            try {
                await authService.incrementStat(user.uid, 'totalPosts');
                await authService.addExp(user.uid, 10); // 게시글 등록 +10 EXP
            } catch (e) { console.error('통계 갱신 실패:', e); }
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
                onEmailSignUp={signUpWithEmail}
                onEmailSignIn={signInWithEmail}
                loading={loading}
                error={error}
            />
        );
    }

    // 어드민 게시물 삭제 (단건)
    const handleDeletePost = (postId, postTitle) => {
        if (!isAdmin) return;
        setConfirmAction({
            message: `"${postTitle}" 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            confirmText: '삭제',
            onConfirm: async () => {
                try {
                    await postService.deletePost(postId);
                } catch (err) {
                    console.error('삭제 실패:', err);
                    alert('삭제에 실패했습니다: ' + err.message);
                }
            }
        });
    };

    // 어드민 다중 삭제
    const handleBulkDelete = () => {
        if (selectedPosts.size === 0) return;
        setConfirmAction({
            message: `선택한 ${selectedPosts.size}개 게시물을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            confirmText: '삭제',
            onConfirm: async () => {
                try {
                    for (const postId of selectedPosts) {
                        await postService.deletePost(postId);
                    }
                    setSelectedPosts(new Set());
                    setSelectMode(false);
                } catch (err) {
                    console.error('다중 삭제 실패:', err);
                    alert('삭제 중 오류가 발생했습니다.');
                }
            }
        });
    };

    // 체크박스 토글
    const togglePostSelection = (postId) => {
        setSelectedPosts(prev => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    // 의뢰종료 처리
    const handleCloseCase = (postId) => {
        setConfirmAction({
            message: '의뢰를 종료하시겠습니까?\n종료 후에는 되돌릴 수 없습니다.',
            confirmText: '종료',
            onConfirm: async () => {
                try {
                    await postService.updatePostStatus(postId, 'RETURNED');
                    // 의뢰종료 통계 + 경험치
                    if (user) {
                        await authService.incrementStat(user.uid, 'totalFound');
                        await authService.addExp(user.uid, 30); // 의뢰종료 +30 EXP
                    }
                } catch (err) {
                    console.error('의뢰종료 실패:', err);
                    alert('의뢰종료에 실패했습니다.');
                }
            }
        });
    };

    // 상세보기 열기 (조회수 증가 + 좋아요 확인 + 댓글 구독)
    const openPostDetail = async (post) => {
        setShowPostDetail(post);
        // 조회수 증가 (세션 내 중복 방지)
        if (!viewedPosts.has(post.id)) {
            try {
                await postService.incrementViews(post.id);
                setViewedPosts(prev => new Set(prev).add(post.id));
            } catch (e) { console.error(e); }
        }
        // 댓글 구독을 위해 아래 useEffect를 사용하므로 여기서는 초기화만.
        setComments([]);
        setNewComment('');
        
        // 좋아요 여부 확인
        if (user && !isAnonymous) {
            try {
                const liked = await postService.checkLiked(post.id, user.uid);
                if (liked) setLikedPosts(prev => new Set(prev).add(post.id));
            } catch (e) { console.error(e); }
        }
    };

    const closePostDetail = () => {
        setShowPostDetail(null);
    };

    // 댓글 작성
    const handleCommentSubmit = async (postId) => {
        if (!newComment.trim() || isAnonymous) {
            if (isAnonymous) alert('댓글 작성은 로그인이 필요합니다.');
            return;
        }
        try {
            await chatService.sendComment(postId, {
                uid: user.uid,
                senderName: profile?.nickname || `이웃${user.uid.slice(0, 4)}`,
                text: newComment.trim()
            });
            await postService.incrementComments(postId);
            setNewComment('');
        } catch (e) { console.error('댓글 전송 실패:', e); }
    };

    // 댓글 좋아요 토글
    const handleCommentLike = async (postId, messageId) => {
        if (!user || isAnonymous) {
            alert('로그인이 필요합니다.');
            return;
        }
        const isLiked = await chatService.toggleCommentLike(postId, messageId, user.uid);
        setLikedComments(prev => {
            const next = new Set(prev);
            if (isLiked) next.add(messageId);
            else next.delete(messageId);
            return next;
        });
    };

    // 좋아요 토글
    const handleToggleLike = async (postId) => {
        if (!user || isAnonymous) {
            alert('좋아요는 로그인이 필요합니다.');
            return;
        }
        try {
            const isLiked = await postService.toggleLike(postId, user.uid);
            setLikedPosts(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(postId);
                else next.delete(postId);
                return next;
            });
            // 좋아요한 경우 게시물 작성자에게 likesReceived 증가 + 나에게 경험치
            if (isLiked) {
                const likedPost = posts.find(p => p.id === postId);
                if (likedPost && likedPost.uid && likedPost.uid !== user.uid) {
                    try {
                        await authService.incrementStat(likedPost.uid, 'likesReceived');
                    } catch (e) { console.error(e); }
                }
                try { await authService.addExp(user.uid, 2); } catch (e) { console.error(e); }
            }
        } catch (e) { console.error(e); }
    };

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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Search size={22} color="var(--text)" />
                        <div style={{ position: 'relative' }}>
                            <Bell size={22} color="var(--text)" />
                            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--secondary)', borderRadius: '50%', border: '2px solid white' }}></div>
                        </div>
                        {isAnonymous ? (
                            <button
                                type="button"
                                onClick={() => {
                                    alert("로그인이 필요합니다.\n로그인 화면으로 이동합니다.");
                                    signOut();
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '6px 12px', borderRadius: '20px',
                                    border: '1.5px solid var(--primary)',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    fontSize: '12px', fontWeight: '700',
                                    cursor: 'pointer', whiteSpace: 'nowrap'
                                }}
                            >
                                <LogOut size={14} />
                                로그인
                            </button>
                        ) : (
                            <div
                                onClick={() => setMainView('profile')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    cursor: 'pointer', padding: '4px 8px 4px 4px',
                                    borderRadius: '20px', backgroundColor: 'var(--primary-light)',
                                    border: '1px solid rgba(0, 82, 204, 0.15)'
                                }}
                            >
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    backgroundColor: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={14} color="white" />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                                    {profile?.nickname || '사용자'}
                                </span>
                            </div>
                        )}
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
                            display: 'flex', gap: '8px', padding: '16px 20px',
                            overflowX: 'auto', backgroundColor: 'var(--background)'
                        }}>
                            {['ALL', 'HUMAN', 'PET', 'ITEM'].map(cat => (
                                <button key={cat} type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', border: 'none',
                                        backgroundColor: categoryFilter === cat ? 'var(--primary)' : 'white',
                                        color: categoryFilter === cat ? 'white' : 'var(--text-light)',
                                        fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer'
                                    }}
                                >
                                    {cat === 'ALL' && '전체'}{cat === 'HUMAN' && '사람'}{cat === 'PET' && '반려동물'}{cat === 'ITEM' && '물건'}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>실시간 상황판</h2>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {isAdmin && (
                                        <button type="button" onClick={() => { setSelectMode(!selectMode); setSelectedPosts(new Set()); }}
                                            style={{
                                                padding: '4px 10px', borderRadius: '6px', border: '1px solid',
                                                borderColor: selectMode ? '#e53935' : '#bbb',
                                                backgroundColor: selectMode ? '#FFEBEE' : 'white',
                                                color: selectMode ? '#e53935' : '#666',
                                                fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '3px'
                                            }}
                                        >
                                            {selectMode ? <><X size={12} /> 취소</> : <><CheckSquare size={12} /> 선택</>}
                                        </button>
                                    )}
                                    <div style={{ display: 'flex', backgroundColor: '#eee', borderRadius: '8px', padding: '2px' }}>
                                        <button type="button" onClick={() => setView('list')} style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', backgroundColor: view === 'list' ? 'white' : 'transparent', cursor: 'pointer' }}><Grid size={16} /></button>
                                        <button type="button" onClick={() => setView('map')} style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', backgroundColor: view === 'map' ? 'white' : 'transparent', cursor: 'pointer' }}><Map size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* 어드민 다중 삭제 바 */}
                            {selectMode && selectedPosts.size > 0 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 16px', borderRadius: '10px', marginBottom: '12px',
                                    backgroundColor: '#FFEBEE', border: '1px solid #e53935'
                                }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#c62828' }}>
                                        {selectedPosts.size}개 선택됨
                                    </span>
                                    <button type="button" onClick={handleBulkDelete}
                                        style={{
                                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                                            backgroundColor: '#e53935', color: 'white',
                                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Trash2 size={14} /> 일괄 삭제
                                    </button>
                                </div>
                            )}

                            {/* List View */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredPosts.map(post => {
                                    const isReturned = post.status === 'RETURNED';
                                    const isMyPost = user && post.uid === user.uid;
                                    return (
                                    <div key={post.id} className="premium-card" style={{
                                        overflow: 'hidden',
                                        border: isReturned ? '1px solid #bbb' : (post.urgent ? '2px solid var(--secondary)' : '1px solid var(--border)'),
                                        position: 'relative',
                                        transition: 'transform 0.2s',
                                        opacity: isReturned ? 0.8 : 1,
                                        cursor: selectMode ? 'pointer' : 'default'
                                    }}
                                    onClick={() => {
                                        if (selectMode) { togglePostSelection(post.id); return; }
                                    }}
                                    >
                                        {/* 선택 모드 체크박스 */}
                                        {selectMode && (
                                            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 20 }}>
                                                {selectedPosts.has(post.id)
                                                    ? <CheckSquare size={22} color="#e53935" fill="#FFCDD2" />
                                                    : <Square size={22} color="#999" />}
                                            </div>
                                        )}

                                        {/* Golden Time Banner */}
                                        {post.urgent && !isReturned && (
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0,
                                                backgroundColor: 'var(--secondary)', color: 'white',
                                                padding: '4px 12px', zIndex: 10,
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '11px', fontWeight: '900'
                                            }}>
                                                <Zap size={12} fill="currentColor" />
                                                골든 타임 수색 모드 (반경 3km 알림 발송)
                                            </div>
                                        )}

                                        {/* 이미지 + RETURNED 오버레이 */}
                                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => {
                                            if (selectMode) return;
                                            e.stopPropagation();
                                            openPostDetail(post);
                                        }}>
                                            <img src={post.imageUrl} alt={post.title} style={{
                                                width: '100%', height: '160px', objectFit: 'cover',
                                                marginTop: (post.urgent && !isReturned) ? '26px' : '0',
                                                filter: isReturned ? 'grayscale(100%)' : 'none'
                                            }} />
                                            {post.images && post.images.length > 1 && (
                                                <div style={{
                                                    position: 'absolute', bottom: '8px', right: '8px',
                                                    backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                                                    padding: '2px 8px', borderRadius: '10px',
                                                    fontSize: '11px', fontWeight: '700'
                                                }}>
                                                    📷 {post.images.length}
                                                </div>
                                            )}

                                            {/* RETURNED 사선 텍스트 오버레이 */}
                                            {isReturned && (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        transform: 'rotate(-25deg)',
                                                        fontSize: '42px', fontWeight: '950', letterSpacing: '6px',
                                                        color: 'rgba(76, 175, 80, 0.7)',
                                                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                                        border: '4px solid rgba(76, 175, 80, 0.7)',
                                                        padding: '4px 20px', borderRadius: '8px',
                                                        backgroundColor: 'rgba(255,255,255,0.4)',
                                                        userSelect: 'none'
                                                    }}>
                                                        RETURNED
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Matching Status Badge */}
                                            {!isReturned && post.aiMatchChecking && (
                                                <div className="glass" style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', color: 'var(--primary)' }}>
                                                    <div className="loader-small"></div> AI 매칭 분석 중...
                                                </div>
                                            )}
                                            {!isReturned && post.aiMatchFound && (
                                                <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', boxShadow: '0 3px 8px rgba(0, 82, 204, 0.4)' }}>
                                                    <ShieldCheck size={12} /> AI 매칭 발견
                                                </div>
                                            )}
                                        </div>

                                        {/* 카드 내용 (클릭 시 상세보기) */}
                                        <div style={{ padding: '12px', cursor: selectMode ? 'default' : 'pointer' }} onClick={(e) => {
                                            if (selectMode) return;
                                            e.stopPropagation();
                                            setShowPostDetail(post);
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    {isReturned && (
                                                        <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>✅ 종료</span>
                                                    )}
                                                    <span style={{
                                                        backgroundColor: post.type === 'LOST' ? 'var(--secondary)' : '#4CAF50',
                                                        color: 'white', padding: '2px 6px', borderRadius: '4px',
                                                        fontSize: '10px', fontWeight: 'bold'
                                                    }}>
                                                        {post.type === 'LOST' ? '분실/실종' : '습득/보호'}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#FFF9C4', color: '#FBC02D', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', border: '1px solid #FDD835' }}>
                                                        <Award size={10} /> Lv.{post.authorAngelLevel}
                                                    </div>
                                                </div>
                                                <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>{formatDateTime(post.createdAt || post.time)}</span>
                                            </div>

                                            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', lineHeight: '1.3', textDecoration: isReturned ? 'line-through' : 'none', color: isReturned ? '#999' : 'inherit' }}>{post.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-light)', fontSize: '12px', marginBottom: '8px' }}>
                                                <MapPin size={12} /> {post.location}
                                            </div>

                                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                                    {post.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600', backgroundColor: '#E3F2FD', padding: '4px 8px', borderRadius: '12px' }}>#{tag}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {!selectMode && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center', marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                                                        <button type="button" onClick={(e) => handleShare(e, post)}
                                                            style={{
                                                                padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '3px',
                                                                fontSize: '11px', fontWeight: '700', borderRadius: '6px',
                                                                border: '1px solid #E3F2FD', backgroundColor: '#E3F2FD',
                                                                color: '#1976D2', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Share2 size={12} /> 공유
                                                        </button>
                                                        {/* 관리자 또는 본인 게시물 의뢰종료 */}
                                                        {(isMyPost || isAdmin) && !isReturned && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleCloseCase(post.id); }}
                                                                style={{
                                                                    padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '3px',
                                                                    fontSize: '11px', fontWeight: '700', borderRadius: '6px',
                                                                    border: '1px solid #4CAF50', backgroundColor: '#E8F5E9',
                                                                    color: '#2E7D32', cursor: 'pointer'
                                                                }}
                                                            >
                                                                <CheckCircle size={12} /> 의뢰종료
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <button type="button" onClick={() => handleDeletePost(post.id, post.title)}
                                                                style={{
                                                                    padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '3px',
                                                                    fontSize: '11px', fontWeight: '700', borderRadius: '6px',
                                                                    border: '1px solid #e53935', backgroundColor: '#FFEBEE',
                                                                    color: '#e53935', cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Trash2 size={12} /> 삭제
                                                            </button>
                                                        )}
                                                        {!isReturned && (
                                                            <button type="button" onClick={() => setShowChat(post)}
                                                                className="btn btn-primary"
                                                                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', boxShadow: '0 2px 6px rgba(0, 82, 204, 0.2)' }}
                                                            >
                                                                <MessageSquare size={14} /> 제보
                                                            </button>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                        {/* 통계: 좋아요·조회수·댓글 */}
                                        <div style={{
                                            display: 'flex', gap: '12px', padding: '6px 12px',
                                            borderTop: '1px solid var(--border)', fontSize: '12px',
                                            color: 'var(--text-light)', alignItems: 'center'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                                                onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id); }}>
                                                <Heart size={13} fill={likedPosts.has(post.id) ? '#e53935' : 'none'}
                                                    color={likedPosts.has(post.id) ? '#e53935' : '#999'} />
                                                {post.likes || 0}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Eye size={13} /> {post.views || 0}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <MessageSquare size={13} /> {post.comments || 0}
                                            </span>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {mainView === 'map' && (
                    <MapView posts={filteredPosts} formatDateTime={formatDateTime} onShowChat={setShowChat} />
                )}

                {mainView === 'community' && (
                    <section>
                        <div style={{ padding: '24px 20px 8px 20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>커뮤니티 광장</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}><strong>{myTown}</strong> 이웃들과 정보를 나누세요.</p>
                        </div>
                        <CommunityBoard formatDateTime={formatDateTime} isAnonymous={isAnonymous} signOut={signOut} isAdmin={isAdmin} />
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

            {/* 피드 상세보기 모달 */}
            {showPostDetail && (() => {
                const post = showPostDetail;
                const isReturned = post.status === 'RETURNED';
                const isMyPost = user && post.uid === user.uid;
                return (
                <div style={{
                    position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }} onClick={closePostDetail}>
                    <div style={{
                        width: '100%', maxWidth: '500px', maxHeight: '90vh',
                        backgroundColor: 'white', borderRadius: '20px 20px 0 0',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', padding: 0
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* 고정 헤더 (드래그 핸들 + 닫기 버튼) */}
                        <div style={{ flexShrink: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '4px' }}>
                            <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#ddd' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px' }}>
                                <button type="button" onClick={closePostDetail}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                                    <X size={22} color="#999" />
                                </button>
                            </div>
                        </div>

                        {/* 스크롤 본문 */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                            {/* 이미지 */}
                            <div style={{ position: 'relative' }}>
                            {/* 대표 이미지 */}
                            <img src={post.imageUrl} alt={post.title} style={{
                                width: '100%', maxHeight: '300px', objectFit: 'contain',
                                backgroundColor: '#f0f0f0',
                                filter: isReturned ? 'grayscale(100%)' : 'none'
                            }} />
                            {isReturned && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{
                                        transform: 'rotate(-25deg)', fontSize: '48px', fontWeight: '950',
                                        letterSpacing: '6px', color: 'rgba(76,175,80,0.7)',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                        border: '4px solid rgba(76,175,80,0.7)',
                                        padding: '6px 24px', borderRadius: '8px',
                                        backgroundColor: 'rgba(255,255,255,0.4)'
                                    }}>RETURNED</div>
                                </div>
                            )}
                        </div>
                        {/* 추가 이미지들 */}
                        {post.images && post.images.length > 1 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: post.images.length === 2 ? '1fr' : 'repeat(2, 1fr)',
                                gap: '4px', padding: '4px'
                            }}>
                                {post.images.slice(1).map((imgUrl, i) => (
                                    <img key={`detail-img-${i}`} src={imgUrl} alt={`${post.title} ${i + 2}`} style={{
                                        width: '100%', maxHeight: '200px', objectFit: 'contain',
                                        backgroundColor: '#f0f0f0', borderRadius: '4px'
                                    }} />
                                ))}
                            </div>
                        )}

                        {/* 상세 정보 */}
                        <div style={{ padding: '20px' }}>
                            {/* 상태 뱃지 */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {isReturned && (
                                    <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>✅ 의뢰 종료</span>
                                )}
                                <span style={{
                                    backgroundColor: post.type === 'LOST' ? 'var(--secondary)' : '#4CAF50',
                                    color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'
                                }}>
                                    {post.type === 'LOST' ? '분실/실종' : '습득/보호'}
                                </span>
                                <span style={{ backgroundColor: '#E3F2FD', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                                    {post.category === 'HUMAN' ? '사람' : post.category === 'PET' ? '반려동물' : '물건'}
                                </span>
                            </div>

                            {/* 제목 */}
                            <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px', lineHeight: '1.4',
                                textDecoration: isReturned ? 'line-through' : 'none', color: isReturned ? '#999' : 'inherit'
                            }}>{post.title}</h2>

                            {/* 위치 + 시간 */}
                            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-light)', fontSize: '13px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={14} /> {post.location}
                                </div>
                                <div>{formatDateTime(post.createdAt || post.time)}</div>
                            </div>

                            {/* 설명 */}
                            {post.description && (
                                <div style={{
                                    padding: '14px', borderRadius: '12px', backgroundColor: '#F8F9FA',
                                    fontSize: '14px', lineHeight: '1.7', marginBottom: '16px',
                                    color: '#333', whiteSpace: 'pre-wrap'
                                }}>
                                    {post.description}
                                </div>
                            )}

                            {/* 특징/사례금 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {post.features && (
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                        <span style={{ fontWeight: '700', color: '#555', minWidth: '50px' }}>특징</span>
                                        <span style={{ color: '#333' }}>{post.features}</span>
                                    </div>
                                )}
                                {post.reward && (
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                        <span style={{ fontWeight: '700', color: '#555', minWidth: '50px' }}>사례금</span>
                                        <span style={{ color: '#e53935', fontWeight: '700' }}>{post.reward}</span>
                                    </div>
                                )}
                                {post.contact && (
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                        <span style={{ fontWeight: '700', color: '#555', minWidth: '50px' }}>연락처</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{post.contact}</span>
                                    </div>
                                )}
                            </div>

                            {/* 태그 */}
                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    {post.tags.map(tag => (
                                        <span key={tag} style={{
                                            padding: '4px 10px', borderRadius: '12px',
                                            backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                                            fontSize: '12px', fontWeight: '600'
                                        }}>#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* 작성자 정보 */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '12px', borderRadius: '12px', backgroundColor: '#F8F9FA',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    backgroundColor: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{post.authorName || '익명'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                                        천사 레벨 Lv.{post.authorAngelLevel || 1}
                                    </div>
                                </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* 좋아요 버튼 */}
                                <button type="button" onClick={() => handleToggleLike(post.id)}
                                    style={{
                                        padding: '12px 16px', borderRadius: '12px',
                                        border: likedPosts.has(post.id) ? '1px solid #e53935' : '1px solid var(--border)',
                                        backgroundColor: likedPosts.has(post.id) ? '#FFEBEE' : 'white',
                                        color: likedPosts.has(post.id) ? '#e53935' : '#666',
                                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}>
                                    <Heart size={16} fill={likedPosts.has(post.id) ? '#e53935' : 'none'} />
                                    {post.likes || 0}
                                </button>
                                <button type="button" onClick={(e) => handleShare(e, post)}
                                                            style={{
                                                                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                                                backgroundColor: '#E3F2FD', color: '#1976D2',
                                                                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                                            }}>
                                                            <Share2 size={16} /> 공유
                                                        </button>
                                {(isMyPost || isAdmin) && !isReturned && (
                                    <button type="button" onClick={() => { handleCloseCase(post.id); closePostDetail(); }}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                            backgroundColor: '#E8F5E9', color: '#2E7D32',
                                            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}>
                                        <CheckCircle size={16} /> 의뢰종료
                                    </button>
                                )}
                                {!isReturned && (
                                    <button type="button" onClick={() => { setShowChat(post); closePostDetail(); }}
                                        className="btn btn-primary"
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}>
                                        <MessageSquare size={16} /> 제보하기
                                    </button>
                                )}
                            </div>
                            {/* 통계 */}
                            <div style={{
                                display: 'flex', gap: '16px', marginTop: '12px',
                                padding: '10px', borderRadius: '8px', backgroundColor: '#f8f9fa',
                                fontSize: '13px', color: 'var(--text-light)'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Eye size={14} /> 조회 {post.views || 0}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Heart size={14} /> 좋아요 {post.likes || 0}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MessageSquare size={14} /> 댓글 {post.comments || 0}
                                </span>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                            {/* 댓글 섹션 */}
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>댓글 ({comments.length})</h3>
                                {comments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: '14px' }}>
                                        아직 댓글이 없습니다.<br/>첫 번째 덧글을 남겨주세요!
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {comments.map(comment => (
                                            <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    backgroundColor: '#e6efff', color: '#0052cc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    <User size={16} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{comment.senderName}</span>
                                                        <span style={{ fontSize: '11px', color: '#999' }}>{formatDateTime(comment.createdAt)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#333', marginTop: '4px', wordBreak: 'break-all' }}>
                                                        {comment.text}
                                                    </div>
                                                    <div style={{ marginTop: '6px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCommentLike(post.id, comment.id)}
                                                            style={{
                                                                background: 'none', border: 'none', padding: 0,
                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                color: likedComments.has(comment.id) ? '#e53935' : '#888',
                                                                fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                                            }}>
                                                            <Heart size={14} fill={likedComments.has(comment.id) ? '#e53935' : 'none'} />
                                                            좋아요 {comment.likes || 0}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div> {/* 댓글 섹션 div 끝 */}
                        </div> {/* 상세 정보 div 끝 */}
                        </div> {/* 스크롤 본문 div 끝 */}
                        
                        {/* 하단 고정 댓글 입력창 */}
                        {!isReturned && (
                            <div style={{
                                flexShrink: 0,
                                padding: '12px 16px',
                                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                                backgroundColor: 'white',
                                borderTop: '1px solid #eee'
                            }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={isAnonymous ? "로그인 후 댓글을 작성할 수 있습니다." : "이웃에게 따뜻한 말을 남겨주세요."}
                                        disabled={isAnonymous}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e0e0e0',
                                            fontSize: '14px', resize: 'none', minHeight: '44px',
                                            backgroundColor: isAnonymous ? '#f5f5f5' : 'white'
                                        }}
                                        rows={1}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCommentSubmit(post.id)}
                                        disabled={!newComment.trim() || isAnonymous}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: 'none',
                                            backgroundColor: !newComment.trim() || isAnonymous ? '#e0e0e0' : 'var(--primary)',
                                            color: 'white', cursor: !newComment.trim() || isAnonymous ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                );
            })()}

            {/* 어드민 데이터 생성기 */}
            {showAdminGenerator && <AdminDataGenerator onClose={() => setShowAdminGenerator(false)} />}

            {/* 어드민 전용 데이터 생성 FAB */}
            {isAdmin && mainView === 'feed' && (
                <button
                    type="button"
                    onClick={() => setShowAdminGenerator(true)}
                    style={{
                        position: 'fixed', bottom: '164px', right: '24px',
                        width: '48px', height: '48px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white', display: 'flex', justifyContent: 'center',
                        alignItems: 'center', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
                        fontSize: '18px', zIndex: 100
                    }}
                    title="어드민 데이터 생성"
                >🛠️</button>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => {
                    console.log('FAB Clicked! isAnonymous:', isAnonymous, 'user:', user);
                    if (isAnonymous) {
                        alert("제보글 등록은 로그인이 필요합니다.\n로그인 화면으로 이동합니다.");
                        signOut();
                    } else {
                        setShowForm(true);
                    }
                }}
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
            {/* 커스텀 확인 팝업 (window.confirm 대체) */}
            {confirmAction && (
                <div style={{
                    position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setConfirmAction(null)}>
                    <div className="glass" style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '16px',
                        width: '80%', maxWidth: '320px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', gap: '20px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontSize: '15px', fontWeight: '800', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                            {confirmAction.message}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#f0f0f0', color: '#666', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>취소</button>
                            <button onClick={async () => {
                                await confirmAction.onConfirm();
                                setConfirmAction(null);
                            }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: confirmAction.confirmText === '삭제' ? '#e53935' : 'var(--primary)', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>{confirmAction.confirmText || '확인'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
