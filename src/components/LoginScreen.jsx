import React, { useState } from 'react';
import { Shield, Zap, MapPin, Users, ChevronRight, Eye, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const LoginScreen = ({ onAnonymousLogin, onGoogleLogin, onEmailSignUp, onEmailSignIn, loading, error }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [localError, setLocalError] = useState('');

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

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        if (password.length < 6) {
            setLocalError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (isSignUp && !nickname) {
            setLocalError('닉네임을 입력해주세요.');
            return;
        }

        setIsLoggingIn(true);
        try {
            if (isSignUp) {
                await onEmailSignUp(email, password, nickname);
            } else {
                await onEmailSignIn(email, password);
            }
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/email-already-in-use') setLocalError('이미 가입된 이메일입니다.');
            else if (code === 'auth/invalid-email') setLocalError('유효하지 않은 이메일 형식입니다.');
            else if (code === 'auth/user-not-found') setLocalError('등록되지 않은 이메일입니다.');
            else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setLocalError('비밀번호가 올바르지 않습니다.');
            else setLocalError(err.message || '오류가 발생했습니다.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSocialComingSoon = (name) => {
        alert(`${name} 로그인은 준비 중입니다.`);
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
            <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
                <div style={{ margin: '0 0 16px 0', padding: '16px' }}>
                    <img src="/logo.png" alt="ReturnPot Logo" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', borderRadius: '16px' }} />
                </div>
                <h1 style={{
                    fontSize: '36px', fontWeight: '950', color: 'white',
                    letterSpacing: '-1.5px', marginBottom: '6px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    ReturnPot
                </h1>
                <p style={{
                    fontSize: '14px', color: 'rgba(255,255,255,0.85)',
                    fontWeight: '500', lineHeight: '1.5'
                }}>
                    소중한 것들을 위한 통합 실종/분실 플랫폼
                </p>
            </div>

            {/* 기능 하이라이트 */}
            {!showEmailForm && (
                <div style={{
                    display: 'flex', gap: '20px', marginBottom: '32px',
                    justifyContent: 'center', flexWrap: 'wrap'
                }}>
                    {[
                        { icon: Zap, label: '골든 타임\n수색' },
                        { icon: MapPin, label: '실시간\n위치 추적' },
                        { icon: Users, label: '이웃 간\n협력' },
                        { icon: Eye, label: 'AI\n매칭' },
                    ].map((item, i) => (
                        <div key={i} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(6px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 4px'
                            }}>
                                <item.icon size={20} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '600', whiteSpace: 'pre-line', lineHeight: '1.3' }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* 로그인 버튼 영역 */}
            <div style={{
                width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
                {/* 이메일 폼 */}
                {showEmailForm ? (
                    <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '14px',
                            padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', color: '#333', textAlign: 'center' }}>
                                {isSignUp ? '회원가입' : '이메일 로그인'}
                            </h3>

                            {isSignUp && (
                                <div style={{ marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="닉네임"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px',
                                            border: '1.5px solid #e0e0e0', fontSize: '14px',
                                            outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '10px' }}>
                                <input
                                    type="email"
                                    placeholder="이메일"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                                        border: '1.5px solid #e0e0e0', fontSize: '14px',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <input
                                    type="password"
                                    placeholder="비밀번호 (6자 이상)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                                        border: '1.5px solid #e0e0e0', fontSize: '14px',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {localError && (
                                <div style={{
                                    padding: '8px 12px', borderRadius: '8px',
                                    backgroundColor: '#FFEBEE', color: '#c62828',
                                    fontSize: '12px', marginBottom: '10px', textAlign: 'center'
                                }}>
                                    {localError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '10px',
                                    border: 'none', backgroundColor: 'var(--primary, #0052CC)',
                                    color: 'white', fontSize: '15px', fontWeight: '700',
                                    cursor: isLoggingIn ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                                {isLoggingIn ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
                                    style={{
                                        border: 'none', background: 'none', color: '#0052CC',
                                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => { setShowEmailForm(false); setLocalError(''); }}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '14px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white', fontSize: '14px', fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ← 다른 방법으로 로그인
                        </button>
                    </form>
                ) : (
                    <>
                        {/* Google 로그인 */}
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={isLoggingIn}
                            style={{
                                width: '100%', padding: '14px 20px', borderRadius: '14px',
                                border: 'none', backgroundColor: 'white',
                                color: '#333', fontSize: '15px', fontWeight: '700',
                                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                opacity: isLoggingIn ? 0.7 : 1, transition: 'all 0.2s'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google로 시작하기
                        </button>

                        {/* 이메일 로그인 */}
                        <button
                            type="button"
                            onClick={() => setShowEmailForm(true)}
                            disabled={isLoggingIn}
                            style={{
                                width: '100%', padding: '14px 20px', borderRadius: '14px',
                                border: 'none', backgroundColor: 'rgba(255,255,255,0.9)',
                                color: '#555', fontSize: '15px', fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s'
                            }}
                        >
                            <Mail size={20} color="#555" />
                            이메일로 시작하기
                        </button>

                        {/* 소셜 로그인 (준비 중) */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { name: '카카오톡', color: '#FEE500', textColor: '#191919', label: '카카오' },
                                { name: 'Facebook', color: '#1877F2', textColor: 'white', label: 'Facebook' },
                                { name: 'X', color: '#000', textColor: 'white', label: 'X' },
                            ].map((social) => (
                                <button
                                    key={social.name}
                                    type="button"
                                    onClick={() => handleSocialComingSoon(social.name)}
                                    style={{
                                        flex: 1, padding: '10px 4px', borderRadius: '10px',
                                        border: 'none', backgroundColor: social.color,
                                        color: social.textColor, fontSize: '11px', fontWeight: '700',
                                        cursor: 'pointer', opacity: 0.7
                                    }}
                                >
                                    {social.label}
                                </button>
                            ))}
                        </div>

                        {/* 구분선 */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            margin: '4px 0', opacity: 0.5
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'white' }} />
                            <span style={{ color: 'white', fontSize: '12px' }}>또는</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'white' }} />
                        </div>

                        {/* 익명 로그인 */}
                        <button
                            type="button"
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
                                opacity: isLoggingIn ? 0.7 : 1, transition: 'all 0.2s'
                            }}
                        >
                            <Users size={20} />
                            로그인 없이 둘러보기
                        </button>
                    </>
                )}
            </div>

            {/* 로딩/에러 */}
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
                    처리 중...
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

            <p style={{
                marginTop: '24px', fontSize: '11px',
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
