import React, { useState } from 'react';
import { Shield, Zap, MapPin, Users, ChevronRight, Eye } from 'lucide-react';

const LoginScreen = ({ onAnonymousLogin, onGoogleLogin, loading, error }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleAnonymous = async () => {
        setIsLoggingIn(true);
        try {
            await onAnonymousLogin();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoggingIn(true);
        try {
            await onGoogleLogin();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0052CC 0%, #1976D2 40%, #E3F2FD 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', position: 'relative', overflow: 'hidden'
        }}>
            {/* 배경 장식 */}
            <div style={{
                position: 'absolute', top: '80px', right: '-40px',
                width: '200px', height: '200px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)'
            }} />
            <div style={{
                position: 'absolute', bottom: '120px', left: '-60px',
                width: '250px', height: '250px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.04)'
            }} />

            {/* 로고 영역 */}
            <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative' }}>
                <div style={{ margin: '0 0 24px 0', padding: '16px' }}>
                    <img src="/logo.png" alt="ReturnPot Logo" style={{ width: '100px', height: '100px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', borderRadius: '20px' }} />
                </div>
                <h1 style={{
                    fontSize: '40px', fontWeight: '950', color: 'white',
                    letterSpacing: '-1.5px', marginBottom: '8px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)', fontFamily: '"Inter", sans-serif'
                }}>
                    ReturnPot
                </h1>
                <p style={{
                    fontSize: '15px', color: 'rgba(255,255,255,0.85)',
                    fontWeight: '500', lineHeight: '1.5'
                }}>
                    세상의 모든 소중한 것들을 위한
                    <br />통합 실종/분실 관리 플랫폼
                </p>
            </div>

            {/* 기능 하이라이트 */}
            <div style={{
                display: 'flex', gap: '20px', marginBottom: '40px',
                justifyContent: 'center', flexWrap: 'wrap'
            }}>
                {[
                    { icon: Zap, label: '골든 타임\n수색' },
                    { icon: MapPin, label: '실시간\n위치 추적' },
                    { icon: Users, label: '이웃 간\n협력' },
                    { icon: Eye, label: 'AI\n매칭' },
                ].map((item, i) => (
                    <div key={i} style={{
                        textAlign: 'center', color: 'rgba(255,255,255,0.9)'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(6px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 6px'
                        }}>
                            <item.icon size={22} />
                        </div>
                        <span style={{
                            fontSize: '11px', fontWeight: '600', whiteSpace: 'pre-line', lineHeight: '1.3'
                        }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 로그인 버튼들 */}
            <div style={{
                width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
                {/* Google 로그인 */}
                <button
                    onClick={handleGoogle}
                    disabled={isLoggingIn}
                    style={{
                        width: '100%', padding: '14px 20px', borderRadius: '14px',
                        border: 'none', backgroundColor: 'white',
                        color: '#333', fontSize: '15px', fontWeight: '700',
                        cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        opacity: isLoggingIn ? 0.7 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google로 시작하기
                    <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
                </button>

                {/* 익명 로그인 */}
                <button
                    onClick={handleAnonymous}
                    disabled={isLoggingIn}
                    style={{
                        width: '100%', padding: '14px 20px', borderRadius: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        color: 'white', fontSize: '15px', fontWeight: '700',
                        cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        opacity: isLoggingIn ? 0.7 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    <Users size={20} />
                    로그인 없이 둘러보기
                    <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                </button>
            </div>

            {/* 로딩/에러 표시 */}
            {isLoggingIn && (
                <div style={{
                    marginTop: '20px', display: 'flex', alignItems: 'center',
                    gap: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '13px'
                }}>
                    <div style={{
                        width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    로그인 중...
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: '16px', padding: '10px 16px', borderRadius: '10px',
                    backgroundColor: 'rgba(229,57,53,0.2)', border: '1px solid rgba(229,57,53,0.4)',
                    color: 'white', fontSize: '12px', maxWidth: '340px', textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            {/* 하단 텍스트 */}
            <p style={{
                marginTop: '32px', fontSize: '11px',
                color: 'rgba(255,255,255,0.5)', textAlign: 'center'
            }}>
                시작하면 서비스 이용약관 및 개인정보처리방침에 동의합니다.
            </p>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoginScreen;
