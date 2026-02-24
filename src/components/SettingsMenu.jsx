import React, { useState } from 'react';
import { X, Bell, Moon, FileText, Delete, LogOut, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const SettingsMenu = ({ onClose, signOut }) => {
    const { user } = useAuth();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            await authService.deleteAccount(user);
            alert("회원 탈퇴가 완료되었습니다.");
            onClose();
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                alert("보안을 위해 재로그인 후 다시 시도해주세요.");
            } else {
                alert("회원 탈퇴에 실패했습니다.");
            }
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', bottom: 0,
            backgroundColor: 'var(--bg-color)', zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--border)', backgroundColor: 'white'
            }}>
                <div style={{ fontSize: '18px', fontWeight: '800' }}>설정</div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <X size={24} color="#333" />
                </button>
            </div>

            {/* Content (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* 서비스 설정 */}
                    <section>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#666', marginBottom: '12px' }}>서비스 설정</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <div style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid #eee'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Bell size={20} color="#555" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>푸시 알림 수신</span>
                                </div>
                                <div 
                                    onClick={() => setPushEnabled(!pushEnabled)}
                                    style={{
                                        width: '44px', height: '24px', borderRadius: '12px',
                                        backgroundColor: pushEnabled ? 'var(--primary)' : '#e0e0e0',
                                        position: 'relative', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                                        position: 'absolute', top: '2px', left: pushEnabled ? '22px' : '2px',
                                        transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </div>
                            <div style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Moon size={20} color="#555" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>다크 모드</span>
                                </div>
                                <div 
                                    onClick={() => setDarkMode(!darkMode)}
                                    style={{
                                        width: '44px', height: '24px', borderRadius: '12px',
                                        backgroundColor: darkMode ? '#333' : '#e0e0e0',
                                        position: 'relative', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                                        position: 'absolute', top: '2px', left: darkMode ? '22px' : '2px',
                                        transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 이용 안내 */}
                    <section>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#666', marginBottom: '12px' }}>이용 안내</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <div style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid #eee', cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FileText size={20} color="#555" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>서비스 이용약관</span>
                                </div>
                                <ChevronRight size={18} color="#aaa" />
                            </div>
                            <div style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FileText size={20} color="#555" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>개인정보 처리방침</span>
                                </div>
                                <ChevronRight size={18} color="#aaa" />
                            </div>
                        </div>
                    </section>

                    {/* 계정 관리 */}
                    <section>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#666', marginBottom: '12px' }}>계정 관리</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <div 
                                onClick={() => {
                                    signOut();
                                    onClose();
                                }}
                                style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid #eee', cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <LogOut size={20} color="#555" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>로그아웃</span>
                                </div>
                            </div>
                            <div 
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e53935' }}>
                                    <Delete size={20} color="#e53935" />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>회원 탈퇴</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* 회원 탈퇴 컨펌 모달 */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                        width: '100%', maxWidth: '320px', animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '24px',
                                backgroundColor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AlertTriangle size={24} color="#e53935" />
                            </div>
                        </div>
                        <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>정말로 탈퇴하시겠습니까?</h3>
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
                            탈퇴 시 모든 데이터(포인트, 게시글, 댓글 등)가 즉시 삭제되며 복구할 수 없습니다.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #ccc',
                                    backgroundColor: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                    backgroundColor: '#e53935', color: 'white', fontWeight: '700', fontSize: '15px',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1
                                }}
                            >
                                {isDeleting ? '처리 중...' : '탈퇴하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsMenu;
