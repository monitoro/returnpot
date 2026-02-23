import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal, User, Edit3, X, Send, Camera, Image, Link2, Play, ExternalLink, Trash2 } from 'lucide-react';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// YouTube URL에서 비디오 ID 추출
const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// URL 감지 (일반 링크)
const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
};

const CommunityBoard = ({ formatDateTime, isAnonymous, signOut, isAdmin }) => {
    const { user, profile } = useAuth();
    const [activeCategory, setActiveCategory] = useState('전체');
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [newPost, setNewPost] = useState({ category: '자유게시판', content: '', tags: '', images: [], linkUrl: '' });
    const fileInputRef = useRef(null);
    // 어드민 다중선택
    const [selectMode, setSelectMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState(new Set());

    const categories = ['전체', '자유게시판', '목격제보', '실종방지팁', '찾았어요!'];

    // Firestore 실시간 구독
    const [posts, setPosts] = useState([]);
    useEffect(() => {
        const unsubscribe = communityService.subscribePosts((newPosts) => {
            setPosts(newPosts);
        });
        return () => unsubscribe();
    }, []);

    const filteredPosts = activeCategory === '전체'
        ? posts
        : posts.filter(p => p.category === activeCategory);

    const handleLike = async (postId) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        try {
            await communityService.toggleLike(postId, post.likes, post.liked);
        } catch (err) {
            console.error('좋아요 실패:', err);
        }
    };

    // 개별 삭제
    const handleDeletePost = async (postId) => {
        if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
        try {
            await communityService.deletePost(postId);
        } catch (err) {
            console.error('삭제 실패:', err);
            alert('삭제에 실패했습니다.');
        }
    };

    // 다중 삭제
    const handleBulkDelete = async () => {
        if (selectedPosts.size === 0) return;
        if (!window.confirm(`${selectedPosts.size}개의 게시글을 삭제하시겠습니까?`)) return;
        try {
            const promises = Array.from(selectedPosts).map(id => communityService.deletePost(id));
            await Promise.all(promises);
            setSelectedPosts(new Set());
            setSelectMode(false);
        } catch (err) {
            console.error('일괄 삭제 실패:', err);
            alert('일부 게시글 삭제에 실패했습니다.');
        }
    };

    const toggleSelect = (postId) => {
        setSelectedPosts(prev => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    // 이미지 선택
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (newPost.images.length + files.length > 4) {
            alert('이미지는 최대 4장까지 첨부할 수 있습니다.');
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewPost(prev => ({ ...prev, images: [...prev.images, ev.target.result] }));
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    // 이미지 삭제
    const removeImage = (index) => {
        setNewPost(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // 내용에서 URL 자동 감지
    const handleContentChange = (text) => {
        setNewPost(prev => {
            const detected = extractUrl(text);
            return { ...prev, content: text, linkUrl: detected || prev.linkUrl };
        });
    };

    // 링크 URL 수동 입력
    const handleLinkInput = (url) => {
        setNewPost(prev => ({ ...prev, linkUrl: url }));
    };

    const handleSubmitPost = async () => {
        if (!newPost.content.trim()) return;
        const tagsArr = newPost.tags.split(',').map(t => t.trim()).filter(Boolean);
        try {
            await communityService.createPost({
                author: profile?.nickname || '익명',
                uid: user?.uid || null,
                category: newPost.category,
                content: newPost.content.trim(),
                tags: tagsArr.length > 0 ? tagsArr : ['새글'],
                images: newPost.images,
                linkUrl: newPost.linkUrl
            });
            setNewPost({ category: '자유게시판', content: '', tags: '', images: [], linkUrl: '' });
            setShowWriteModal(false);
            // 통계 + 경험치 갱신
            if (user?.uid) {
                try {
                    await authService.incrementStat(user.uid, 'communityPosts');
                    await authService.addExp(user.uid, 5);
                } catch (e) { console.error(e); }
            }
        } catch (err) {
            console.error('글 작성 실패:', err);
            alert('글 작성에 실패했습니다.');
        }
    };

    const displayTime = (post) => {
        if (formatDateTime) return formatDateTime(post.createdAt || post.time);
        return post.time || '';
    };

    // YouTube 미리보기 컴포넌트
    const LinkPreview = ({ url }) => {
        if (!url) return null;
        const ytId = extractYouTubeId(url);

        if (ytId) {
            return (
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{
                        borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)',
                        marginTop: '8px', backgroundColor: '#000', position: 'relative', cursor: 'pointer'
                    }}>
                        <img
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt="YouTube thumbnail"
                            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                        />
                        {/* Play 버튼 오버레이 */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '54px', height: '54px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,0,0,0.85)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            <Play size={24} color="white" fill="white" style={{ marginLeft: '3px' }} />
                        </div>
                        <div style={{
                            padding: '10px 12px', backgroundColor: '#1a1a1a',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <div style={{
                                width: '20px', height: '14px', borderRadius: '3px',
                                backgroundColor: '#FF0000', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Play size={8} color="white" fill="white" />
                            </div>
                            <span style={{ fontSize: '12px', color: '#ccc', flex: 1 }}>YouTube 동영상</span>
                            <ExternalLink size={12} color="#888" />
                        </div>
                    </div>
                </a>
            );
        }

        // 일반 링크 미리보기
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                    borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)',
                    marginTop: '8px', padding: '12px 14px', backgroundColor: '#f8f9fa',
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    transition: 'background 0.2s'
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        backgroundColor: 'var(--primary-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Link2 size={18} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {url.replace(/^https?:\/\//, '').split('/')[0]}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {url}
                        </div>
                    </div>
                    <ExternalLink size={14} color="var(--text-light)" />
                </div>
            </a>
        );
    };

    // 이미지 그리드 컴포넌트
    const ImageGrid = ({ images }) => {
        if (!images || images.length === 0) return null;
        const count = images.length;

        if (count === 1) {
            return (
                <div style={{ marginTop: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={images[0]} alt="" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }} />
                </div>
            );
        }

        if (count === 2) {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                    {images.map((img, i) => <img key={i} src={img} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />)}
                </div>
            );
        }

        if (count === 3) {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto', gap: '4px', marginTop: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={images[0]} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', gridRow: '1 / 3' }} />
                    <img src={images[1]} alt="" style={{ width: '100%', height: '98px', objectFit: 'cover', display: 'block' }} />
                    <img src={images[2]} alt="" style={{ width: '100%', height: '98px', objectFit: 'cover', display: 'block' }} />
                </div>
            );
        }

        // 4장 이상
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                {images.slice(0, 4).map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                        {i === 3 && count > 4 && (
                            <div style={{
                                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '20px', fontWeight: '800'
                            }}>
                                +{count - 4}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: '0 0 100px 0', position: 'relative' }}>
            {/* Category Chips */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 20px',
                overflowX: 'auto',
                backgroundColor: 'var(--background)',
                position: 'sticky',
                top: '60px',
                zIndex: 90
            }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--primary-light)',
                            color: activeCategory === cat ? 'white' : 'var(--primary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* 어드민 선택모드 컨트롤 */}
            {isAdmin && (
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', padding: '0 20px 4px',
                    gap: '8px'
                }}>
                    <button type="button" onClick={() => {
                        setSelectMode(!selectMode);
                        if (selectMode) setSelectedPosts(new Set());
                    }} style={{
                        padding: '4px 12px', borderRadius: '6px',
                        border: selectMode ? '1px solid #e53935' : '1px solid #ddd',
                        backgroundColor: selectMode ? '#FFEBEE' : 'white',
                        color: selectMode ? '#e53935' : '#666',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                    }}>
                        {selectMode ? '✕ 취소' : '☑ 선택'}
                    </button>
                    {selectMode && (
                        <button type="button" onClick={() => {
                            const allIds = new Set(filteredPosts.map(p => p.id));
                            setSelectedPosts(selectedPosts.size === filteredPosts.length ? new Set() : allIds);
                        }} style={{
                            padding: '4px 12px', borderRadius: '6px',
                            border: '1px solid #ddd', backgroundColor: 'white',
                            color: '#666', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            {selectedPosts.size === filteredPosts.length ? '전체 해제' : '전체 선택'}
                        </button>
                    )}
                </div>
            )}

            {/* Post List */}
            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredPosts.map(post => (
                    <div key={post.id} className="premium-card" style={{
                        padding: '14px',
                        border: selectMode && selectedPosts.has(post.id) ? '2px solid #e53935' : undefined,
                        position: 'relative'
                    }}>
                        {/* 선택모드 체크박스 */}
                        {selectMode && (
                            <button type="button" onClick={() => toggleSelect(post.id)} style={{
                                position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                                width: '24px', height: '24px', borderRadius: '6px',
                                border: selectedPosts.has(post.id) ? '2px solid #e53935' : '2px solid #ccc',
                                backgroundColor: selectedPosts.has(post.id) ? '#e53935' : 'white',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '14px', fontWeight: '700'
                            }}>
                                {selectedPosts.has(post.id) ? '✓' : ''}
                            </button>
                        )}
                        {/* Post Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '16px',
                                    backgroundColor: 'var(--primary-light)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                }}>
                                    <User size={16} color="var(--primary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>{post.author}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{displayTime(post)} · {post.category}</div>
                                </div>
                            </div>
                            <MoreHorizontal size={18} color="var(--text-light)" style={{ cursor: 'pointer' }} />
                        </div>

                        {/* Content */}
                        <div style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {post.content}
                        </div>

                        {/* 이미지 그리드 */}
                        <ImageGrid images={post.images} />

                        {/* 링크 미리보기 */}
                        <LinkPreview url={post.linkUrl} />

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            {post.tags.map(tag => (
                                <span key={tag} style={{ color: 'var(--primary)', fontSize: '12px' }}>#{tag}</span>
                            ))}
                        </div>

                        {/* Interactions */}
                        <div style={{
                            display: 'flex', gap: '16px',
                            borderTop: '1px solid var(--border)', paddingTop: '10px'
                        }}>
                            <button
                                onClick={() => {
                                    if (isAnonymous) {
                                        alert("좋아요는 로그인이 필요합니다.\n로그인 화면으로 이동합니다.");
                                        signOut();
                                        return;
                                    }
                                    handleLike(post.id);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    backgroundColor: 'transparent', border: 'none',
                                    color: post.liked ? '#E74C3C' : 'var(--text-light)',
                                    cursor: 'pointer', fontSize: '13px',
                                    fontWeight: post.liked ? '700' : '400'
                                }}
                            >
                                <Heart size={16} fill={post.liked ? '#E74C3C' : 'none'} /> {post.likes}
                            </button>
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                backgroundColor: 'transparent', border: 'none',
                                color: 'var(--text-light)', cursor: 'pointer', fontSize: '13px'
                            }}>
                                <MessageSquare size={16} /> {post.comments}
                            </button>
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                backgroundColor: 'transparent', border: 'none',
                                color: 'var(--text-light)', marginLeft: 'auto', cursor: 'pointer'
                            }}>
                                <Share2 size={16} />
                            </button>
                            {isAdmin && !selectMode && (
                                <button
                                    type="button"
                                    onClick={() => handleDeletePost(post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '3px',
                                        backgroundColor: '#FFEBEE', border: '1px solid #e53935',
                                        borderRadius: '6px', color: '#e53935',
                                        cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                                        padding: '4px 8px'
                                    }}
                                >
                                    <Trash2 size={12} /> 삭제
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 다중 삭제 하단 바 */}
            {selectMode && selectedPosts.size > 0 && (
                <div style={{
                    position: 'fixed', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
                    width: '90%', maxWidth: '440px', padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #E53935, #C62828)',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', zIndex: 200,
                    boxShadow: '0 6px 20px rgba(229,57,53,0.4)'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>
                        {selectedPosts.size}개 선택됨
                    </span>
                    <button type="button" onClick={handleBulkDelete} style={{
                        padding: '8px 20px', borderRadius: '8px',
                        border: '2px solid white', backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white', fontWeight: '800', fontSize: '13px',
                        cursor: 'pointer'
                    }}>
                        🗑️ 일괄 삭제
                    </button>
                </div>
            )}

            {/* 글쓰기 FAB */}
            <button
                onClick={() => {
                    if (isAnonymous) {
                        alert("커뮤니티 글쓰기는 로그인이 필요합니다.\n로그인 화면으로 이동합니다.");
                        signOut();
                    } else {
                        setShowWriteModal(true);
                    }
                }}
                style={{
                    position: 'fixed', bottom: '100px', right: '24px',
                    width: '56px', height: '56px', borderRadius: '28px',
                    backgroundColor: 'var(--primary)', color: 'white',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 6px 16px rgba(0, 82, 204, 0.3)',
                    border: 'none', cursor: 'pointer', zIndex: 500
                }}
            >
                <Edit3 size={24} />
            </button>

            {/* 글쓰기 모달 */}
            {showWriteModal && (
                <div
                    onClick={(e) => { if (e.target === e.currentTarget) setShowWriteModal(false); }}
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px 20px 0 0',
                        width: '100%', maxWidth: '480px', padding: '20px',
                        maxHeight: '85vh', overflowY: 'auto',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        {/* 모달 헤더 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>글쓰기</h3>
                            <button onClick={() => setShowWriteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <X size={24} color="#666" />
                            </button>
                        </div>

                        {/* 카테고리 선택 */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px', display: 'block' }}>카테고리</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {categories.filter(c => c !== '전체').map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewPost({ ...newPost, category: cat })}
                                        style={{
                                            padding: '5px 12px', borderRadius: '16px',
                                            border: newPost.category === cat ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            backgroundColor: newPost.category === cat ? 'var(--primary-light)' : 'white',
                                            color: newPost.category === cat ? 'var(--primary)' : 'var(--text)',
                                            fontWeight: '600', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 내용 입력 */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px', display: 'block' }}>내용</label>
                            <textarea
                                placeholder="이웃들에게 나누고 싶은 이야기를 적어주세요..."
                                value={newPost.content}
                                onChange={(e) => handleContentChange(e.target.value)}
                                style={{
                                    width: '100%', minHeight: '120px', padding: '12px',
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    fontSize: '15px', lineHeight: '1.6', resize: 'none',
                                    outline: 'none', fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* 사진 첨부 영역 */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)' }}>
                                    사진 첨부 ({newPost.images.length}/4)
                                </label>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={newPost.images.length >= 4}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: newPost.images.length >= 4 ? '#f0f0f0' : 'white',
                                        color: newPost.images.length >= 4 ? '#bbb' : 'var(--primary)',
                                        fontSize: '12px', fontWeight: '600', cursor: newPost.images.length >= 4 ? 'default' : 'pointer'
                                    }}
                                >
                                    <Camera size={14} /> 사진 추가
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* 첨부된 이미지 미리보기 */}
                            {newPost.images.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {newPost.images.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                onClick={() => removeImage(i)}
                                                style={{
                                                    position: 'absolute', top: '3px', right: '3px',
                                                    width: '20px', height: '20px', borderRadius: '50%',
                                                    backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                                                    border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 링크 입력 */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px', display: 'block' }}>
                                영상/링크 URL (선택)
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', flex: 1,
                                    border: '1px solid var(--border)', borderRadius: '10px', padding: '0 12px',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <Link2 size={14} color="var(--text-light)" />
                                    <input
                                        type="text"
                                        placeholder="https://youtube.com/..."
                                        value={newPost.linkUrl}
                                        onChange={(e) => handleLinkInput(e.target.value)}
                                        style={{
                                            flex: 1, padding: '10px 0', border: 'none',
                                            fontSize: '13px', outline: 'none', backgroundColor: 'transparent'
                                        }}
                                    />
                                    {newPost.linkUrl && (
                                        <button
                                            onClick={() => setNewPost(prev => ({ ...prev, linkUrl: '' }))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                        >
                                            <X size={14} color="#999" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* 링크 미리보기 */}
                            {newPost.linkUrl && <LinkPreview url={newPost.linkUrl} />}
                        </div>

                        {/* 태그 입력 */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px', display: 'block' }}>태그 (쉼표로 구분)</label>
                            <input
                                type="text"
                                placeholder="예: 역삼동, 목격담"
                                value={newPost.tags}
                                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                                    border: '1px solid var(--border)', fontSize: '13px', outline: 'none'
                                }}
                            />
                        </div>

                        {/* 등록 버튼 */}
                        <button
                            onClick={handleSubmitPost}
                            disabled={!newPost.content.trim()}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px',
                                border: 'none',
                                backgroundColor: newPost.content.trim() ? 'var(--primary)' : '#ddd',
                                color: newPost.content.trim() ? 'white' : '#999',
                                fontWeight: '800', fontSize: '16px',
                                cursor: newPost.content.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', transition: 'all 0.2s'
                            }}
                        >
                            <Send size={18} /> 등록하기
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default CommunityBoard;
