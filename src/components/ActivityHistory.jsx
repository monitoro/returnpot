import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, MessageSquare, Heart, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/postService';
import { communityService } from '../services/communityService';

const ActivityHistory = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'community'
    const [feedPosts, setFeedPosts] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const feeds = await postService.getUserPosts(user.uid);
                const comms = await communityService.getUserCommunityPosts(user.uid);
                setFeedPosts(feeds);
                setCommunityPosts(comms);
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [user]);

    const renderPostItem = (post, isCommunity) => {
        const dateStr = post.createdAt?.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return (
            <div key={post.id} style={{
                backgroundColor: 'white', borderRadius: '16px', padding: '16px',
                marginBottom: '12px', border: '1px solid #eee'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                        fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px',
                        backgroundColor: isCommunity ? '#E3F2FD' : '#FCE4EC',
                        color: isCommunity ? '#1565C0' : '#C2185B'
                    }}>
                        {post.category || (isCommunity ? '동네생활' : '피드')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#999' }}>{dateStr}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px', lineHeight: '1.4' }}>
                    {post.content}
                </div>
                
                {post.imageUrl || (post.images && post.images.length > 0) ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', color: '#666', marginBottom: '12px'
                    }}>
                        <ImageIcon size={12} /> 첨부된 이미지 있음
                    </div>
                ) : null}

                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f5f5f5', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '12px' }}>
                        <Heart size={14} /> {post.likes || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '12px' }}>
                        <MessageSquare size={14} /> {post.comments || 0}
                    </div>
                    {!isCommunity && post.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '12px' }}>
                            <MapPin size={14} /> {post.location}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', bottom: 0,
            backgroundColor: '#f8f9fa', zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'white', borderBottom: '1px solid var(--border)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} color="var(--primary)" />
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>활동 내역</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <X size={24} color="#333" />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <button
                    onClick={() => setActiveTab('feed')}
                    style={{
                        flex: 1, padding: '16px 0', fontSize: '14px', fontWeight: '700',
                        color: activeTab === 'feed' ? 'var(--primary)' : '#999',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'feed' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    작성한 메인 피드 ({feedPosts.length})
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    style={{
                        flex: 1, padding: '16px 0', fontSize: '14px', fontWeight: '700',
                        color: activeTab === 'community' ? 'var(--primary)' : '#999',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'community' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    작성한 동네생활 ({communityPosts.length})
                </button>
            </div>

            {/* Content List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>
                        불러오는 중...
                    </div>
                ) : (
                    <>
                        {activeTab === 'feed' && (
                            feedPosts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>작성한 피드가 없습니다</div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.5' }}>첫 피드를 작성하고 이웃들에게<br/>도움을 요청해보세요.</p>
                                </div>
                            ) : (
                                feedPosts.map(p => renderPostItem(p, false))
                            )
                        )}
                        {activeTab === 'community' && (
                            communityPosts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>작성한 동네생활 글이 없습니다</div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.5' }}>이웃들과 소통하는 동네생활에<br/>첫 글을 남겨보세요.</p>
                                </div>
                            ) : (
                                communityPosts.map(p => renderPostItem(p, true))
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityHistory;
