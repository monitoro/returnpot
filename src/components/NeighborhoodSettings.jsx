import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, ChevronRight, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

const NeighborhoodSettings = ({ currentTown, onSave, onBack }) => {
    const [selectedTown, setSelectedTown] = useState(currentTown);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [nearbyTowns, setNearbyTowns] = useState(['역삼1동', '서초동', '한남동', '삼성동', '압구정동', '성수동']);
    const [isFetchingNearby, setIsFetchingNearby] = useState(false);

    // 컴포넌트 마운트 시 현재 설정된 동네 기반으로 주변 동네 로드
    useEffect(() => {
        if (currentTown) {
            loadNearbyTowns(currentTown);
        }
    }, [currentTown]);

    const loadNearbyTowns = async (townName) => {
        if (!townName) return;
        setIsFetchingNearby(true);
        try {
            const towns = await geminiService.getNearbyTowns(townName);
            if (towns && towns.length > 0) {
                // 현재 동네가 목록에 있으면 제거 (이미 상단에 표시되므로 옵션)
                const filteredTowns = towns.filter(t => t !== townName);
                if (filteredTowns.length > 0) {
                    setNearbyTowns(filteredTowns);
                } else {
                    setNearbyTowns(towns);
                }
            }
        } catch (err) {
            console.error('주변 동네 로드 실패:', err);
        } finally {
            setIsFetchingNearby(false);
        }
    };

    const handleFindCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert('현재 브라우저에서 위치 정보를 지원하지 않습니다.');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    // OSM 리버스 지오코딩 API 호출 (무료, Header에 User-Agent 권장되나 브라우저 기본 허용됨)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const townName = data.address.suburb || data.address.town || data.address.village || data.address.neighbourhood || data.address.city_district;
                        if (townName) {
                            setSelectedTown(townName);
                            loadNearbyTowns(townName);
                        } else {
                            alert('동이름을 정확히 찾을 수 없습니다.');
                        }
                    } else {
                        alert('위치 정보를 가져올 수 없습니다.');
                    }
                } catch (err) {
                    console.error('역지오코딩 실패:', err);
                    alert('현재 위치의 주소를 불러오는데 실패했습니다.');
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.warn('위치 접근 실패:', err);
                alert('위치 정보 접근 권한이 필요합니다.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
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

                    <button 
                        onClick={handleFindCurrentLocation}
                        disabled={isLocating}
                        style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: isLocating ? '#999' : 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '700',
                        cursor: isLocating ? 'wait' : 'pointer'
                    }}>
                        <Navigation size={20} /> {isLocating ? '위치 찾는 중...' : '현재 위치로 찾기'}
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)' }}>
                            {isFetchingNearby ? '주변 동네 탐색 중...' : '근처 동네 직접 선택'}
                        </label>
                        {isFetchingNearby && <Loader2 size={16} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {nearbyTowns.map(town => (
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
