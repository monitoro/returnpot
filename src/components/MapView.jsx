import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Filter, Zap, MapPin, Eye, Navigation, Layers, X,
    MessageSquare, Clock
} from 'lucide-react';

const MapView = ({ posts = [], formatDateTime }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [activeFilters, setActiveFilters] = useState({ LOST: true, FOUND: true, HUMAN: true, PET: true, ITEM: true });
    const [showFilters, setShowFilters] = useState(false);
    const [showFacilities, setShowFacilities] = useState(true);
    const [showSightingRoute, setShowSightingRoute] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [mapReady, setMapReady] = useState(false);

    const defaultCenter = [37.5007, 127.0365];

    // 맵 데이터
    const mapPosts = [
        { id: 1, type: 'LOST', category: 'HUMAN', title: '70대 어르신을 찾습니다 (긴급)', location: '서울시 강남구 역삼역 인근', lat: 37.5007, lng: 127.0365, urgent: true, createdAt: new Date(Date.now() - 15 * 60000), description: '기억장애 있으시고 회색 셔츠를 입고 계셨습니다.', tags: ['기억장애', '회색셔츠', '강남구'] },
        { id: 2, type: 'LOST', category: 'PET', title: '골든 리트리버를 찾습니다', location: '서울시 강남구 역삼동', lat: 37.4985, lng: 127.0332, urgent: false, createdAt: new Date(Date.now() - 2 * 3600000), description: '노란색 대형견, 매우 친근합니다.', tags: ['노란색', '대형견', '친근함'] },
        { id: 3, type: 'FOUND', category: 'ITEM', title: '갈색 가죽 지갑 습득', location: '서울시 서초구 서초동', lat: 37.4920, lng: 127.0250, urgent: false, createdAt: new Date(Date.now() - 5 * 3600000), description: '브랜드 미상 반지갑, 카드 여러 장 있음.', tags: ['브랜드미상', '반지갑'] },
        { id: 4, type: 'LOST', category: 'PET', title: '검은 고양이 실종', location: '서울시 강남구 대치동', lat: 37.5050, lng: 127.0580, urgent: false, createdAt: new Date(Date.now() - 8 * 3600000), description: '검은색 단모종, 왼쪽 귀에 노란색 태그.', tags: ['검정', '단모종', '대치동'] },
        { id: 5, type: 'FOUND', category: 'PET', title: '갈색 푸들 보호 중', location: '서울시 강남구 역삼동 GS25 근처', lat: 37.4995, lng: 127.0410, urgent: false, createdAt: new Date(Date.now() - 30 * 60000), description: '목줄 없는 갈색 푸들, 현재 가게에서 보호 중.', tags: ['갈색', '푸들', '보호중'] },
        { id: 6, type: 'LOST', category: 'HUMAN', title: '초등학생 하교 후 미귀가', location: '서울시 강남구 개포동', lat: 37.4830, lng: 127.0460, urgent: true, createdAt: new Date(Date.now() - 45 * 60000), description: '초등학교 3학년 남학생, 노란색 가방.', tags: ['초등학생', '개포동', '노란가방'] },
    ];

    const sightingRoute = {
        sightings: [
            { lat: 37.4985, lng: 127.0332, time: '14:00', desc: '실종 위치 (자택)' },
            { lat: 37.4978, lng: 127.0355, time: '14:25', desc: '역삼공원 방향으로 이동 목격' },
            { lat: 37.4960, lng: 127.0380, time: '15:10', desc: '테헤란로 횡단 목격' },
            { lat: 37.4952, lng: 127.0410, time: '15:45', desc: '편의점 앞에서 목격 (최근)' },
        ]
    };

    const facilities = [
        { name: '강남경찰서', lat: 37.5095, lng: 127.0668, emoji: '🚔' },
        { name: '서울동물보호센터', lat: 37.4870, lng: 127.0200, emoji: '🏥' },
        { name: '역삼1동 주민센터', lat: 37.4990, lng: 127.0350, emoji: '🏛️' },
        { name: '강남유실물센터', lat: 37.4975, lng: 127.0285, emoji: '📦' },
    ];

    // Leaflet CDN 로드
    useEffect(() => {
        if (window.L) {
            setMapReady(true);
            return;
        }

        // CSS 로드
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // JS 로드
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setMapReady(true);
        document.head.appendChild(script);

        return () => {
            // cleanup은 하지 않음 (CDN은 계속 캐시)
        };
    }, []);

    // 지도 초기화
    useEffect(() => {
        if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

        const L = window.L;
        const map = L.map(mapRef.current, {
            center: defaultCenter,
            zoom: 14,
            zoomControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // 줌 컨트롤 우하단
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;

        // 약간의 딜레이 후 강제 리사이즈
        setTimeout(() => map.invalidateSize(), 200);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [mapReady]);

    // 마커 업데이트
    const updateMarkers = useCallback(() => {
        const map = mapInstanceRef.current;
        const L = window.L;
        if (!map || !L) return;

        // 기존 마커 제거
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        const filteredPosts = mapPosts.filter(p => activeFilters[p.type] && activeFilters[p.category]);
        const emojiMap = { HUMAN: '👤', PET: '🐾', ITEM: '📦' };

        // 골든 타임 반경
        filteredPosts.filter(p => p.urgent).forEach(p => {
            const circle = L.circle([p.lat, p.lng], {
                radius: 3000,
                color: '#E53935',
                fillColor: '#E53935',
                fillOpacity: 0.06,
                weight: 2,
                dashArray: '8 4'
            }).addTo(map);
            markersRef.current.push(circle);
        });

        // 게시물 마커
        filteredPosts.forEach(post => {
            const isLost = post.type === 'LOST';
            const color = isLost ? '#E53935' : '#43A047';
            const emoji = emojiMap[post.category] || '📍';
            const size = post.urgent ? 44 : 36;

            const icon = L.divIcon({
                className: 'returns-marker',
                html: `<div style="
                    width:${size}px; height:${size}px; border-radius:50%;
                    background:${color}; border:3px solid white;
                    box-shadow:0 3px 10px rgba(0,0,0,0.3);
                    display:flex; align-items:center; justify-content:center;
                    font-size:${post.urgent ? '18px' : '16px'};
                    ${post.urgent ? 'animation:pulse-marker 1.5s infinite;' : ''}
                ">${emoji}</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });

            const marker = L.marker([post.lat, post.lng], { icon }).addTo(map);
            marker.on('click', () => setSelectedPost(post));
            markersRef.current.push(marker);
        });

        // 내 위치
        const myIcon = L.divIcon({
            className: 'returns-marker',
            html: `<div style="
                width:20px; height:20px; border-radius:50%;
                background:#4285F4; border:3px solid white;
                box-shadow:0 0 0 2px #4285F4, 0 2px 8px rgba(66,133,244,0.4);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        const myMarker = L.marker(defaultCenter, { icon: myIcon }).addTo(map);
        myMarker.bindPopup('<strong>내 위치</strong><br/>역삼1동');
        markersRef.current.push(myMarker);

        // 목격 경로
        if (showSightingRoute) {
            const coords = sightingRoute.sightings.map(s => [s.lat, s.lng]);
            const line = L.polyline(coords, {
                color: '#FF9800', weight: 3, dashArray: '6 4', opacity: 0.8
            }).addTo(map);
            markersRef.current.push(line);

            sightingRoute.sightings.forEach((s, i) => {
                const sIcon = L.divIcon({
                    className: 'returns-marker',
                    html: `<div style="
                        width:22px; height:22px; border-radius:50%;
                        background:#FF9800; border:2px solid white;
                        box-shadow:0 2px 6px rgba(0,0,0,0.25);
                        display:flex; align-items:center; justify-content:center;
                        font-size:10px; font-weight:900; color:white;
                    ">${i + 1}</div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const sMarker = L.marker([s.lat, s.lng], { icon: sIcon }).addTo(map);
                sMarker.bindPopup(`<div style="min-width:120px"><div style="font-size:11px;font-weight:700;color:#FF9800">목격 #${i + 1} · ${s.time}</div><div style="font-size:12px;margin-top:2px">${s.desc}</div></div>`);
                markersRef.current.push(sMarker);
            });
        }

        // 시설 마커
        if (showFacilities) {
            facilities.forEach(f => {
                const fIcon = L.divIcon({
                    className: 'returns-marker',
                    html: `<div style="
                        width:30px; height:30px; border-radius:8px;
                        background:white; border:2px solid #ddd;
                        box-shadow:0 2px 6px rgba(0,0,0,0.15);
                        display:flex; align-items:center; justify-content:center;
                        font-size:14px;
                    ">${f.emoji}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                const fMarker = L.marker([f.lat, f.lng], { icon: fIcon }).addTo(map);
                fMarker.bindPopup(`<strong>${f.emoji} ${f.name}</strong>`);
                markersRef.current.push(fMarker);
            });
        }
    }, [activeFilters, showFacilities, showSightingRoute]);

    useEffect(() => {
        if (mapReady && mapInstanceRef.current) {
            updateMarkers();
        }
    }, [mapReady, updateMarkers]);

    const toggleFilter = (key) => {
        setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getTimeText = (post) => {
        if (formatDateTime) return formatDateTime(post.createdAt);
        return '';
    };

    const handleLocateMe = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(defaultCenter, 15, { duration: 0.8 });
        }
    };

    const urgentCount = mapPosts.filter(p => p.urgent && activeFilters[p.type] && activeFilters[p.category]).length;

    return (
        <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 140px)' }}>
            {/* 지도 컨테이너 */}
            <div
                ref={mapRef}
                style={{ width: '100%', height: '100%', backgroundColor: '#e8e8e8' }}
            />

            {/* 로딩 표시 */}
            {!mapReady && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#f0f0f0', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{
                        width: '40px', height: '40px', border: '4px solid #e0e0e0',
                        borderTop: '4px solid var(--primary)', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '14px', color: '#888' }}>지도를 불러오는 중...</span>
                </div>
            )}

            {/* 상단 오버레이: 필터 + 골든타임 알림 */}
            <div style={{
                position: 'absolute', top: '12px', left: '12px', right: '12px',
                zIndex: 1000, display: 'flex', gap: '8px'
            }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '10px 14px', borderRadius: '12px',
                        backgroundColor: 'white', border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', fontWeight: '700',
                        cursor: 'pointer', color: showFilters ? 'var(--primary)' : '#333'
                    }}
                >
                    <Filter size={16} /> 필터
                </button>

                {urgentCount > 0 && (
                    <div style={{
                        flex: 1, padding: '10px 14px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #E53935, #FF6D00)',
                        color: 'white', fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 2px 8px rgba(229,57,53,0.3)',
                    }}>
                        <Zap size={14} fill="currentColor" />
                        골든 타임 {urgentCount}건 수색 중
                    </div>
                )}
            </div>

            {/* 필터 패널 */}
            {showFilters && (
                <div style={{
                    position: 'absolute', top: '60px', left: '12px',
                    zIndex: 1000, backgroundColor: 'white', borderRadius: '14px',
                    padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    minWidth: '220px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#333' }}>상태</span>
                        <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                            <X size={14} color="#999" />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {[
                            { key: 'LOST', label: '분실/실종', color: '#E53935' },
                            { key: 'FOUND', label: '습득/보호', color: '#43A047' }
                        ].map(f => (
                            <button key={f.key} onClick={() => toggleFilter(f.key)}
                                style={{
                                    padding: '5px 12px', borderRadius: '8px',
                                    border: `1.5px solid ${activeFilters[f.key] ? f.color : '#ddd'}`,
                                    backgroundColor: activeFilters[f.key] ? f.color + '15' : '#f9f9f9',
                                    color: activeFilters[f.key] ? f.color : '#aaa',
                                    fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                                }}
                            >{f.label}</button>
                        ))}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', color: '#333' }}>카테고리</div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {[
                            { key: 'HUMAN', label: '👤 사람' },
                            { key: 'PET', label: '🐾 동물' },
                            { key: 'ITEM', label: '📦 물건' }
                        ].map(f => (
                            <button key={f.key} onClick={() => toggleFilter(f.key)}
                                style={{
                                    padding: '5px 10px', borderRadius: '8px',
                                    border: `1.5px solid ${activeFilters[f.key] ? '#0052CC' : '#ddd'}`,
                                    backgroundColor: activeFilters[f.key] ? '#E3F2FD' : '#f9f9f9',
                                    color: activeFilters[f.key] ? '#0052CC' : '#aaa',
                                    fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                                }}
                            >{f.label}</button>
                        ))}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', color: '#333' }}>레이어</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                            <input type="checkbox" checked={showFacilities} onChange={() => setShowFacilities(!showFacilities)} style={{ accentColor: '#0052CC' }} />
                            🏛️ 주요 시설
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                            <input type="checkbox" checked={showSightingRoute} onChange={() => setShowSightingRoute(!showSightingRoute)} style={{ accentColor: '#FF9800' }} />
                            👁️ 목격 제보 경로
                        </label>
                    </div>
                </div>
            )}

            {/* 우측 컨트롤 */}
            <div style={{
                position: 'absolute', right: '12px', bottom: '20px',
                zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
                <button onClick={handleLocateMe}
                    style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        backgroundColor: 'white', border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }} title="내 위치">
                    <Navigation size={20} color="#4285F4" />
                </button>
                <button onClick={() => setShowFacilities(!showFacilities)}
                    style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        backgroundColor: showFacilities ? '#0052CC' : 'white',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }} title="시설 표시">
                    <Layers size={20} color={showFacilities ? 'white' : '#666'} />
                </button>
            </div>

            {/* 하단 카드 / 범례 */}
            {selectedPost ? (
                <div style={{
                    position: 'absolute', bottom: '16px', left: '12px', right: '12px',
                    zIndex: 1000, backgroundColor: 'white', borderRadius: '16px',
                    padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    border: selectedPost.urgent ? '2px solid #E53935' : '1px solid #e0e0e0'
                }}>
                    <button onClick={() => setSelectedPost(null)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                        <X size={18} color="#999" />
                    </button>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', color: 'white',
                            backgroundColor: selectedPost.type === 'LOST' ? '#E53935' : '#43A047'
                        }}>
                            {selectedPost.type === 'LOST' ? '분실/실종' : '습득/보호'}
                        </span>
                        {selectedPost.urgent && (
                            <span style={{
                                fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', color: 'white',
                                backgroundColor: '#FF6D00', display: 'flex', alignItems: 'center', gap: '3px'
                            }}>
                                <Zap size={10} fill="currentColor" /> 골든 타임
                            </span>
                        )}
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', paddingRight: '24px' }}>{selectedPost.title}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>{selectedPost.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                        <MapPin size={12} /> {selectedPost.location}
                        <span style={{ margin: '0 4px' }}>·</span>
                        <Clock size={12} /> {getTimeText(selectedPost)}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {selectedPost.tags?.map(tag => (
                            <span key={tag} style={{ fontSize: '11px', color: '#0052CC', fontWeight: '600' }}>#{tag}</span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            backgroundColor: '#0052CC', color: 'white', fontWeight: '700', fontSize: '13px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                            <MessageSquare size={16} /> 제보하기
                        </button>
                        {selectedPost.urgent && (
                            <button style={{
                                padding: '10px 16px', borderRadius: '10px',
                                border: '2px solid #FF6D00', backgroundColor: '#FFF3E0',
                                color: '#FF6D00', fontWeight: '700', fontSize: '13px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                            }}>
                                <Zap size={16} /> 수색 참여
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{
                    position: 'absolute', bottom: '16px', left: '12px',
                    zIndex: 1000, backgroundColor: 'white', borderRadius: '12px',
                    padding: '10px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    display: 'flex', gap: '12px', fontSize: '11px', color: '#666'
                }}>
                    {[
                        { color: '#E53935', label: '분실' },
                        { color: '#43A047', label: '습득' },
                        { color: '#FF9800', label: '목격경로' },
                        { color: '#4285F4', label: '내 위치' }
                    ].map(item => (
                        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                            {item.label}
                        </span>
                    ))}
                </div>
            )}

            <style>{`
                .returns-marker { background: none !important; border: none !important; }
                .leaflet-control-attribution { font-size: 9px !important; opacity: 0.6; }
                .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
                .leaflet-popup-content { margin: 10px 12px !important; font-family: inherit !important; }
                .leaflet-popup-tip { box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important; }
                .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; border-radius: 10px !important; overflow: hidden; }
                .leaflet-control-zoom a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 16px !important; color: #333 !important; border-bottom: 1px solid #eee !important; }
                .leaflet-control-zoom a:last-child { border-bottom: none !important; }
                @keyframes pulse-marker {
                    0% { box-shadow: 0 0 0 0 rgba(229,57,53,0.4); }
                    70% { box-shadow: 0 0 0 14px rgba(229,57,53,0); }
                    100% { box-shadow: 0 0 0 0 rgba(229,57,53,0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default MapView;
