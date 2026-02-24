import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Navigation } from 'lucide-react';

const LocationPickerModal = ({ initialLocation, onClose, onSelect }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [mapReady, setMapReady] = useState(!!window.L);
    
    // Default to Gangnam if no initial location
    const [center, setCenter] = useState(initialLocation || { lat: 37.5007, lng: 127.0365 });
    const [addressText, setAddressText] = useState('위치를 불러오는 중...');
    const [isLoading, setIsLoading] = useState(false);

    // Load Leaflet if needed
    useEffect(() => {
        if (!window.L && !document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => setMapReady(true);
            document.head.appendChild(script);
        } else if (window.L) {
             setMapReady(true);
        }
    }, []);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`);
            const data = await res.json();
            
            // Clean up address (Nominatim sometimes adds postcode and country)
            let addr = data.display_name || '선택한 위치';
            addr = addr.replace(/대한민국\s*/, '').replace(/\d{5}\s*/, '').trim();
            setAddressText(addr);
        } catch {
            setAddressText('선택한 위치 (주소 확인 불가)');
        }
    };

    // init map
    useEffect(() => {
        if (!mapReady || !mapRef.current || mapInstanceRef.current) return;
        
        const L = window.L;
        const map = L.map(mapRef.current, {
            center: [center.lat, center.lng],
            zoom: 16,
            zoomControl: false
        });
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const customIcon = L.divIcon({
            className: 'custom-pin',
            html: `<div style="font-size:36px; transform:translateY(-15px); text-shadow:0 3px 6px rgba(0,0,0,0.4);">📍</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });

        const marker = L.marker([center.lat, center.lng], { icon: customIcon, draggable: true }).addTo(map);
        markerRef.current = marker;

        // Perform initial reverse geocode
        reverseGeocode(center.lat, center.lng);

        // When map is clicked, move marker
        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            setCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
        
        // When marker is dragged
        marker.on('dragend', () => {
            const ll = marker.getLatLng();
            setCenter({ lat: ll.lat, lng: ll.lng });
            reverseGeocode(ll.lat, ll.lng);
        });

        mapInstanceRef.current = map;

        // Invalid size workaround for modals
        setTimeout(() => {
            map.invalidateSize();
        }, 300);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [mapReady]); // Only run once when mapReady is true

    const handleConfirm = () => {
        onSelect(center, addressText);
    };
    
    const goToMyLocation = () => {
        if (!navigator.geolocation) return;
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCenter(loc);
                if (mapInstanceRef.current && markerRef.current) {
                    mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 0.8 });
                    markerRef.current.setLatLng([loc.lat, loc.lng]);
                    reverseGeocode(loc.lat, loc.lng);
                }
                setIsLoading(false);
            },
            () => {
                alert('위치 정보를 가져올 수 없습니다.');
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    return createPortal(
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.7)', zIndex:99999, display:'flex', flexDirection:'column', animation: 'fadeIn 0.2s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div style={{ padding:'16px', background:'white', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #EEE' }}>
                <span style={{ fontWeight:'bold', fontSize:'18px' }}>위치 지정하기</span>
                <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24} color="#333" /></button>
            </div>
            <div style={{ flex:1, position:'relative' }}>
                <div ref={mapRef} style={{ width:'100%', height:'100%', backgroundColor: '#F0F0F0' }} />
                
                <div style={{ position:'absolute', top:'16px', left:'16px', right:'16px', zIndex:1000, background:'white', padding:'14px', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>선택된 주소</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>{addressText}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>지도를 터치하거나 핀을 드래그하여 정확한 위치를 지정하세요.</div>
                </div>

                <button 
                    onClick={goToMyLocation}
                    disabled={isLoading}
                    style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000, width: '48px', height: '48px', borderRadius: '24px', backgroundColor: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Navigation size={22} color={isLoading ? "#CCC" : "#1967D2"} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
                </button>
            </div>
            <div style={{ padding:'16px 20px 24px 20px', background:'white', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
                <button 
                    onClick={handleConfirm} 
                    style={{ width:'100%', padding:'16px', background:'#4285F4', color:'white', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer' }}>
                    이 위치 첨부하기
                </button>
            </div>
        </div>
    , document.body);
};

export default LocationPickerModal;
