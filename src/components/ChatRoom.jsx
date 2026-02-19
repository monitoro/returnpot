import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Phone, MapPin, Heart } from 'lucide-react';

const ChatRoom = ({ post, onBack }) => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'system', text: `"${post.title}" 관련 채팅방이 개설되었습니다.`, time: '오후 2:30' },
        { id: 2, sender: '동네주민1', text: '방금 그 근처 지나가다가 비슷한 아이 본 것 같아요!', time: '오후 2:31' },
        { id: 3, sender: 'owner', text: '정말인가요? 어느 쪽 방향으로 가고 있었나요?', time: '오후 2:32' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMessage = {
            id: messages.length + 1,
            sender: 'owner',
            text: input,
            time: '방금 전'
        };
        setMessages([...messages, newMessage]);
        setInput('');

        // Simulate auto-reply
        setTimeout(() => {
            const autoReply = {
                id: messages.length + 2,
                sender: '동네주민1',
                text: '서초역 3번 출구 방향에서 공원 쪽으로 뛰어가고 있었어요!',
                time: '방금 전'
            };
            setMessages(prev => [...prev, autoReply]);
        }, 1500);
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
                    <button onClick={onBack} style={{ border: 'none', background: 'none' }}><X size={24} /></button>
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
                <img src={post.imageUrl} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
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
                <button style={{
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
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        alignSelf: msg.sender === 'owner' ? 'flex-end' : (msg.sender === 'system' ? 'center' : 'flex-start'),
                        maxWidth: msg.sender === 'system' ? '100%' : '80%'
                    }}>
                        {msg.sender === 'system' ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-light)', backgroundColor: '#e0e4eb', padding: '4px 12px', borderRadius: '12px' }}>
                                {msg.text}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'owner' ? 'flex-end' : 'flex-start' }}>
                                {msg.sender !== 'owner' && <span style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px', marginLeft: '4px' }}>{msg.sender}</span>}
                                <div style={{
                                    backgroundColor: msg.sender === 'owner' ? 'var(--primary)' : 'white',
                                    color: msg.sender === 'owner' ? 'white' : 'var(--text)',
                                    padding: '10px 14px',
                                    borderRadius: '16px',
                                    borderTopRightRadius: msg.sender === 'owner' ? '2px' : '16px',
                                    borderTopLeftRadius: msg.sender !== 'owner' ? '2px' : '16px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    fontSize: '14px',
                                    lineHeight: '1.4'
                                }}>
                                    {msg.text}
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>{msg.time}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="glass" style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: '#f0f2f5',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '15px'
                    }}
                />
                <button onClick={handleSend} style={{
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
