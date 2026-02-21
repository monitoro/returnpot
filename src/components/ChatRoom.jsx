import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Phone, MapPin, Heart } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

const ChatRoom = ({ post, onBack }) => {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    // Firestore 실시간 메시지 구독
    useEffect(() => {
        if (!post?.id) return;
        setLoading(true);
        const unsubscribe = chatService.subscribeMessages(post.id, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [post?.id]);

    // 새 메시지가 오면 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const formatTime = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? '오후' : '오전';
        const h12 = h % 12 || 12;
        return `${ampm} ${h12}:${m}`;
    };

    const handleSend = async () => {
        if (!input.trim() || !user) return;
        const text = input.trim();
        setInput('');
        try {
            await chatService.sendMessage(post.id, {
                uid: user.uid,
                senderName: profile?.nickname || '익명',
                text
            });
        } catch (err) {
            console.error('메시지 전송 실패:', err);
            alert('메시지 전송에 실패했습니다.');
        }
    };

    return (
        <div className="glass" style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            height: '100vh',
            backgroundColor: '#f5f7fb',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div className="glass" style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--surface)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '16px' }}>정보 교환 대화방</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{post.title}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Phone size={20} color="var(--text-light)" />
                </div>
            </div>

            {/* Info Card */}
            <div style={{ padding: '12px', backgroundColor: 'white', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src={post.imageUrl} alt={post.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>실시간 위치 제보 중</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}><MapPin size={10} style={{ verticalAlign: 'middle' }} /> {post.location}</div>
                </div>
                {post.aiMatchFound && (
                    <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900' }}>
                        AI 매칭 발견
                    </div>
                )}
            </div>

            {/* Return Pot (Killer Feature: Donation) */}
            <div style={{
                padding: '12px 20px',
                backgroundColor: '#FFF5F5',
                borderBottom: '1px solid #FFE3E3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={16} color="var(--secondary)" fill="var(--secondary)" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>리턴 포트 (사례금 기부)</span>
                </div>
                <button type="button" style={{
                    border: '1px solid var(--secondary)',
                    backgroundColor: 'white',
                    color: 'var(--secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer'
                }}>
                    기부하기
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '40px 0' }}>
                        메시지를 불러오는 중...
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '40px 0' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                        첫 메시지를 보내보세요!<br />
                        <span style={{ fontSize: '11px' }}>이 게시물에 관한 정보를 공유할 수 있습니다.</span>
                    </div>
                )}

                {messages.map(msg => {
                    const isMe = msg.uid === user?.uid;
                    return (
                        <div key={msg.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                {!isMe && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px', marginLeft: '4px' }}>
                                        {msg.senderName || '익명'}
                                    </span>
                                )}
                                <div style={{
                                    backgroundColor: isMe ? 'var(--primary)' : 'white',
                                    color: isMe ? 'white' : 'var(--text)',
                                    padding: '10px 14px',
                                    borderRadius: '16px',
                                    borderTopRightRadius: isMe ? '2px' : '16px',
                                    borderTopLeftRadius: isMe ? '16px' : '2px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.text}
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="glass" style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend();
                    }}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: '#f0f2f5',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '15px'
                    }}
                />
                <button type="button" onClick={handleSend} style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '22px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;
