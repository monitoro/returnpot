import React, { useState } from 'react';
import { MapPin, Navigation, Check, ChevronRight } from 'lucide-react';

const NeighborhoodSettings = ({ currentTown, onSave, onBack }) => {
    const [selectedTown, setSelectedTown] = useState(currentTown);
    const [searchQuery, setSearchQuery] = useState('');

    const popularTowns = ['역삼1동', '서초동', '한남동', '삼성동', '압구정동', '성수동'];

    return (
        <div className="glass" style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            height: '100vh',
            backgroundColor: 'var(--background)',
            zIndex: 2500,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <button onClick={onBack} style={{ border: 'none', background: 'none', padding: '8px', cursor: 'pointer' }}>
                    <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginLeft: '8px' }}>내 동네 설정</h2>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <MapPin size={20} color="var(--primary)" />
                        <span style={{ fontWeight: '700', fontSize: '16px' }}>현재 설정된 동네: {selectedTown}</span>
                    </div>

                    <button style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}>
                        <Navigation size={20} /> 현재 위치로 찾기
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-light)' }}>근처 동네 직접 선택</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {popularTowns.map(town => (
                            <button
                                key={town}
                                onClick={() => setSelectedTown(town)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: selectedTown === town ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    backgroundColor: selectedTown === town ? 'var(--primary-light)' : 'white',
                                    color: selectedTown === town ? 'var(--primary)' : 'var(--text)',
                                    fontWeight: selectedTown === town ? '700' : '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                {town} {selectedTown === town && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: '20px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px',
                    color: 'var(--primary)',
                    lineHeight: '1.6'
                }}>
                    <strong>💡 팁</strong><br />
                    동네를 설정하면 해당 지역의 실력 있는 자원봉사자들과 이웃들에게 우선적으로 게시물이 노출되어 회수율이 3배 이상 높아집니다.
                </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={() => onSave(selectedTown)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '18px' }}
                >
                    이 동네로 설정 완료
                </button>
            </div>
        </div>
    );
};

export default NeighborhoodSettings;
