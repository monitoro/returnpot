import React, { useState } from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal, User, Tag } from 'lucide-react';

const CommunityBoard = () => {
    const [activeCategory, setActiveCategory] = useState('전체');

    const categories = ['전체', '자유게시판', '목격제보', '실종방지팁', '찾았어요!'];

    const [posts, setPosts] = useState([
        {
            id: 1,
            author: '강아지천사',
            category: '실종방지팁',
            content: '반려견 산책 시 하네스 버클 확인은 필수입니다! 최근에 버클이 풀려서 고생하신 분들이 많다고 하네요.',
            time: '10분 전',
            likes: 12,
            comments: 5,
            tags: ['산책매너', '안전']
        },
        {
            id: 2,
            author: '동네주민A',
            category: '목격제보',
            content: '역삼동 GS25 근처에서 목줄 없는 강아지가 혼자 돌아다니는 걸 봤어요. 갈색 푸들인 것 같습니다.',
            time: '30분 전',
            likes: 8,
            comments: 3,
            tags: ['역삼동', '목격']
        },
        {
            id: 3,
            author: '행운의주인',
            category: '찾았어요!',
            content: '여러분 덕분에 저희 집 고양이를 무사히 찾았습니다! 공유해주신 모든 분들께 감사드려요 ㅠㅠ',
            time: '1시간 전',
            likes: 45,
            comments: 12,
            tags: ['감사합니다', '무사히']
        }
    ]);

    const filteredPosts = activeCategory === '전체'
        ? posts
        : posts.filter(p => p.category === activeCategory);

    return (
        <div style={{ padding: '0 0 100px 0' }}>
            {/* Category Chips */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '16px 20px',
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
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--primary-light)',
                            color: activeCategory === cat ? 'white' : 'var(--primary)',
                            fontWeight: '600',
                            fontSize: '14px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Post List */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map(post => (
                    <div key={post.id} className="premium-card" style={{ padding: '20px' }}>
                        {/* Post Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '18px',
                                    backgroundColor: 'var(--primary-light)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <User size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: '700' }}>{post.author}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{post.time} • {post.category}</div>
                                </div>
                            </div>
                            <MoreHorizontal size={20} color="var(--text-light)" />
                        </div>

                        {/* Content */}
                        <div style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                            {post.content}
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {post.tags.map(tag => (
                                <span key={tag} style={{ color: 'var(--primary)', fontSize: '13px' }}>#{tag}</span>
                            ))}
                        </div>

                        {/* Interactions */}
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '16px'
                        }}>
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                cursor: 'pointer'
                            }}>
                                <Heart size={18} /> {post.likes}
                            </button>
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                cursor: 'pointer'
                            }}>
                                <MessageSquare size={18} /> {post.comments}
                            </button>
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                marginLeft: 'auto',
                                cursor: 'pointer'
                            }}>
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommunityBoard;
