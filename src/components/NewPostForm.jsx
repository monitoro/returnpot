import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, MapPin, Tag, ChevronRight, Check, Zap, FileText, Share2, Copy, Download, ExternalLink, MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc } from 'firebase/firestore';
import QRCode from 'qrcode';
import LocationPickerModal from './LocationPickerModal';

const NewPostForm = ({ onBack, onSubmit }) => {
    // 전단지 생성 시 사용될 임시 포스트 ID (QR 목적)
    const [tempPostId] = useState(() => doc(collection(db, 'posts')).id);

    const [formData, setFormData] = useState({
        type: 'LOST',
        category: 'PET',
        title: '',
        description: '',
        location: '',
        images: [],       // 다중 사진 미리보기 (base64)
        imageFiles: [],   // 다중 사진 파일
        tags: [],
        // 전단지용 추가 필드
        petName: '',
        breed: '',
        features: '',
        reward: '',
        contactPhone: '',
        // 추가: 모달에서 선택한 지도 좌표
        selectedCoords: null
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showFlyerModal, setShowFlyerModal] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false); // 추가: 지도 모달 상태
    const [linkCopied, setLinkCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const flyerRef = useRef(null);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const remaining = 5 - formData.images.length;
        const toAdd = files.slice(0, remaining);

        toAdd.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, reader.result],
                    imageFiles: [...prev.imageFiles, file]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imageFiles: prev.imageFiles.filter((_, i) => i !== index),
            tags: index === 0 ? [] : prev.tags
        }));
    };

    const analyzeImage = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            // 카테고리에 따른 지능형 태그 제안
            let suggestedTags = ['강남구', '신속도움요망'];
            if (formData.category === 'HUMAN') {
                suggestedTags = [...suggestedTags, '기억장애', '인상착의확인', '긴급'];
            } else if (formData.category === 'PET') {
                suggestedTags = [...suggestedTags, '골든 리트리버', '노란색'];
            } else { // ITEM
                suggestedTags = [...suggestedTags, '귀중품', '블랙컬러'];
            }

            setFormData(prev => ({
                ...prev,
                tags: suggestedTags,
            }));
            setIsAnalyzing(false);
        }, 2000);
    };

    const handleCopyLink = () => {
        const shareUrl = `https://returnpot.kr/post/share-preview`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }).catch(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const handleSocialShare = (platform) => {
        const shareUrl = encodeURIComponent(`https://returnpot.kr/post/share-preview`);
        const shareText = encodeURIComponent(formData.title || '실종/분실 신고가 등록되었습니다. 도움을 주세요!');
        let url = '';
        switch (platform) {
            case 'kakao':
                url = `https://story.kakao.com/share?url=${shareUrl}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
                break;
            default:
                return;
        }
        window.open(url, '_blank', 'width=600,height=400');
    };

    const handleDownloadFlyer = async () => {
        if (!flyerRef.current) return;

        const W = 600;
        const PAD = 50; // 좌우 패딩
        const contentW = W - PAD * 2; // 실제 컨텐츠 폭

        // === 1단계: 높이 계산 ===
        let calcY = 0;
        calcY += 45;   // 상단 마진 + 로고
        calcY += 55;   // 메인 타이틀
        calcY += 35;   // 서브 배지
        calcY += 300;  // 사진 영역 (패딩 포함)
        calcY += 20;   // 사진-테이블 간격
        calcY += 5 * 40 + 4; // 테이블 5행 (각 40px)
        calcY += 24;   // 테이블-사례금 간격
        if (formData.reward) {
            calcY += 48;   // 사례금 박스
            calcY += 24;   // Reward 영문
        }
        if (formData.contactPhone) {
            calcY += 12;   // 간격
            calcY += 44;   // 연락처 박스
        }
        calcY += 24;   // 간격
        calcY += 70;   // QR 코드 영역
        calcY += 20;   // 하단 마진

        const H = Math.max(820, calcY);
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // === 배경 + 외곽선 ===
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

        let y = 0;

        // ──────────────────────────────
        // 로고 영역
        // ──────────────────────────────
        y += 32;
        const logoBoxSize = 22;
        const logoTotalW = logoBoxSize + 8 + 130; // 박스 + 간격 + 텍스트
        const logoStartX = (W - logoTotalW) / 2;

        ctx.fillStyle = '#2D2D2D';
        roundRect(ctx, logoStartX, y - 2, logoBoxSize, logoBoxSize, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('R', logoStartX + logoBoxSize / 2, y + 13);

        ctx.fillStyle = '#333333';
        ctx.font = '600 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('리턴팟 (Returnpot)', logoStartX + logoBoxSize + 8, y + 13);

        y += 36; // 로고 하단

        // ──────────────────────────────
        // 메인 타이틀
        // ──────────────────────────────
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 32px sans-serif';
        const mainTitle = formData.type === 'LOST'
            ? (formData.category === 'HUMAN' ? '실종자를 찾습니다' : formData.category === 'PET' ? '실종 동물 찾습니다' : '분실물을 찾습니다')
            : '발견 신고';
        ctx.fillText(mainTitle, W / 2, y + 28);
        y += 48;

        // ──────────────────────────────
        // LOST PET 배지
        // ──────────────────────────────
        ctx.font = 'bold 14px sans-serif';
        const badgeText = formData.category === 'HUMAN' ? 'MISSING PERSON' : formData.category === 'PET' ? 'LOST PET' : 'LOST ITEM';
        const badgeTextW = ctx.measureText(badgeText).width;
        const badgePadX = 24;
        const badgeH = 28;
        const badgeTotalW = badgeTextW + badgePadX * 2;

        ctx.fillStyle = '#F5A623';
        roundRect(ctx, W / 2 - badgeTotalW / 2, y, badgeTotalW, badgeH, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, W / 2, y + 19);
        y += badgeH + 16;

        // ──────────────────────────────
        // 사진 (노란 테두리)
        // ──────────────────────────────
        const photoW = 220;
        const photoH = 240;
        const photoBorder = 5;
        const photoX = W / 2 - photoW / 2;
        const photoY = y;

        // 노란 테두리 배경
        ctx.fillStyle = '#F5A623';
        roundRect(ctx, photoX - photoBorder, photoY - photoBorder,
            photoW + photoBorder * 2, photoH + photoBorder * 2, 10);
        ctx.fill();

        // 사진 배경 (회색)
        ctx.fillStyle = '#f5f5f5';
        roundRect(ctx, photoX, photoY, photoW, photoH, 6);
        ctx.fill();

        if (!formData.images[0]) {
            ctx.fillStyle = '#bbb';
            ctx.font = '15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('사진을 등록해주세요', W / 2, photoY + photoH / 2 + 5);
        }

        // 🐾 장식
        if (formData.category === 'PET') {
            const pawX = photoX + photoW + photoBorder + 2;
            const pawY = photoY - photoBorder - 2;
            ctx.fillStyle = '#F5A623';
            ctx.beginPath();
            ctx.arc(pawX, pawY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🐾', pawX, pawY + 4);
        }

        y = photoY + photoH + photoBorder + 20;

        // ──────────────────────────────
        // 정보 테이블
        // ──────────────────────────────
        const tblX = PAD;
        const tblW = contentW;
        const lblW = 90;
        const rH = 38;
        const tblBorderR = 6;
        const rows = [
            { label: '이름', value: formData.petName || formData.title || '-' },
            { label: formData.category === 'HUMAN' ? '인상착의' : formData.category === 'PET' ? '견종/종류' : '품목', value: formData.breed || '-' },
            { label: '특징', value: formData.features || formData.description?.slice(0, 30) || '-' },
            { label: '실종 장소', value: formData.location || '-' },
            { label: '실종 일시', value: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) },
        ];
        const tblH = rH * rows.length;

        // 1) 먼저 각 행의 라벨 배경을 채우기
        rows.forEach((row, i) => {
            const rY = y + i * rH;
            ctx.fillStyle = '#FFF8E7';
            ctx.fillRect(tblX + 1, rY + (i === 0 ? 1 : 0), lblW - 1,
                rH - (i === 0 ? 1 : 0) - (i === rows.length - 1 ? 1 : 0));
        });

        // 2) 행 구분선 (얇은 연한 노란색)
        ctx.strokeStyle = '#F5DFA0';
        ctx.lineWidth = 1;
        for (let i = 0; i < rows.length - 1; i++) {
            const lineY = y + (i + 1) * rH;
            ctx.beginPath();
            ctx.moveTo(tblX + 1, lineY + 0.5);
            ctx.lineTo(tblX + tblW - 1, lineY + 0.5);
            ctx.stroke();
        }

        // 3) 라벨-값 세로 구분선
        ctx.beginPath();
        ctx.moveTo(tblX + lblW + 0.5, y + 1);
        ctx.lineTo(tblX + lblW + 0.5, y + tblH - 1);
        ctx.stroke();

        // 4) 외곽 테두리 (마지막에 그려서 일관된 굵기)
        ctx.strokeStyle = '#F5A623';
        ctx.lineWidth = 2;
        roundRect(ctx, tblX, y, tblW, tblH, tblBorderR);
        ctx.stroke();

        // 5) 텍스트
        rows.forEach((row, i) => {
            const rY = y + i * rH;
            // 라벨
            ctx.fillStyle = '#8B6914';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(row.label, tblX + 14, rY + rH / 2 + 5);

            // 값
            ctx.fillStyle = '#222';
            ctx.font = '600 13px sans-serif';
            const maxValW = tblW - lblW - 28;
            let valText = row.value;
            while (ctx.measureText(valText).width > maxValW && valText.length > 1) {
                valText = valText.slice(0, -1);
            }
            if (valText !== row.value) valText += '…';
            ctx.fillText(valText, tblX + lblW + 14, rY + rH / 2 + 5);
        });

        y += tblH + 20;

        // ──────────────────────────────
        // 사례금
        // ──────────────────────────────
        if (formData.reward) {
            const rewardBoxH = 44;

            // 박스 배경 + 테두리
            ctx.fillStyle = '#FFF8E1';
            roundRect(ctx, tblX, y, tblW, rewardBoxH, 8);
            ctx.fill();
            ctx.strokeStyle = '#F5A623';
            ctx.lineWidth = 2;
            roundRect(ctx, tblX, y, tblW, rewardBoxH, 8);
            ctx.stroke();

            // 사례금 라벨
            ctx.fillStyle = '#8B6914';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('사례금:', tblX + 16, y + rewardBoxH / 2 + 5);

            // 금액 (빨간색, 우측 정렬)
            ctx.fillStyle = '#E74C3C';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(formData.reward, tblX + tblW - 16, y + rewardBoxH / 2 + 6);

            y += rewardBoxH + 6;

            // Reward 영문 텍스트
            ctx.fillStyle = '#D4A017';
            ctx.font = 'italic 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`(Reward: ₩${formData.reward})`, W / 2, y + 10);

            y += 24;
        }

        // ──────────────────────────────
        // 연락처
        // ──────────────────────────────
        if (formData.contactPhone) {
            const contactBoxH = 40;

            ctx.fillStyle = '#EFF6FF';
            roundRect(ctx, tblX, y, tblW, contactBoxH, 8);
            ctx.fill();
            ctx.strokeStyle = '#B8D4F0';
            ctx.lineWidth = 1.5;
            roundRect(ctx, tblX, y, tblW, contactBoxH, 8);
            ctx.stroke();

            ctx.fillStyle = '#0052cc';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`📞 연락처: ${formData.contactPhone}`, W / 2, y + contactBoxH / 2 + 5);

            y += contactBoxH + 16;
        }

        // ──────────────────────────────
        // 실전 QR 코드 (tempPostId 연동)
        // ──────────────────────────────
        // 항상 하단에 배치 (최소 위치 보장)
        y = Math.max(y + 8, H - 78);

        // 구분선
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, y);
        ctx.lineTo(W - PAD, y);
        ctx.stroke();
        y += 14;

        const qrX = PAD;
        const qrSize = 50;

        try {
            const shareUrl = `${window.location.origin}/?postId=${tempPostId}`;
            const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: qrSize * 2, color: { dark: '#333333ff', light: '#00000000' } });
            const qrImg = new Image();
            await new Promise((resolve) => {
                qrImg.onload = resolve;
                qrImg.onerror = resolve;
                qrImg.src = qrDataUrl;
            });
            ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
        } catch (err) {
            console.error('QR생성 실패', err);
            // Fallback: 빈 네모 박스
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(qrX, y, qrSize, qrSize);
        }

        // QR 옆 텍스트
        const qrTextX = qrX + qrSize + 16;
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('스캔하여 제보하기', qrTextX, y + 16);
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.fillText('Scan to Report', qrTextX, y + 32);
        ctx.fillStyle = '#0052cc';
        ctx.font = '600 11px sans-serif';
        ctx.fillText('returnpot.kr', qrTextX, y + 48);

        // ──────────────────────────────
        // 이미지 그리기 & 다운로드
        // ──────────────────────────────
        const generateImageAndDownload = async () => {
            const doDownload = () => {
                const link = document.createElement('a');
                // 다운로드 파일명 지정 로직
                const safeName = (formData.petName || formData.title || '제보').replace(/[/\\?%*:|"<>]/g, '-');
                link.download = `returnpot_${safeName}_전단지.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };

            if (formData.images[0]) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.save();
                        roundRect(ctx, photoX, photoY, photoW, photoH, 6);
                        ctx.clip();
                        // object-fit: cover 방식
                        const imgR = img.width / img.height;
                        const boxR = photoW / photoH;
                        let sx = 0, sy = 0, sw = img.width, sh = img.height;
                        if (imgR > boxR) {
                            sw = img.height * boxR;
                            sx = (img.width - sw) / 2;
                        } else {
                            sh = img.width / boxR;
                            sy = (img.height - sh) / 2;
                        }
                        ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
                        ctx.restore();
                        resolve();
                    };
                    img.onerror = resolve;
                    img.src = formData.images[0];
                });
            }
            // 최종 다운로드 수행 (내용이 캔버스에 모두 그려진 상태)
            doDownload();
        };

        // 이미지 로딩 대기 후 다운로드 실행
        await generateImageAndDownload();
    };

    // ── Canvas 헬퍼 함수 ──
    function roundRect(ctx, x, y, w, h, r) {
        if (r > h / 2) r = h / 2;
        if (r > w / 2) r = w / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

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
            zIndex: 2000,
            overflowY: 'auto',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <div className="glass" style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <button onClick={onBack} className="btn" style={{ padding: '8px' }}>
                    <X size={24} />
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>새 신고 등록</h2>
                <div style={{ width: '40px' }}></div>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Category Selection (HUMAN, PET, ITEM) */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>무엇을 찾으시나요?</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['HUMAN', 'PET', 'ITEM'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFormData({ ...formData, category: cat })}
                                style={{
                                    flex: 1,
                                    padding: '12px 8px',
                                    borderRadius: '12px',
                                    border: formData.category === cat ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    backgroundColor: formData.category === cat ? 'var(--primary-light)' : 'white',
                                    color: formData.category === cat ? 'var(--primary)' : 'var(--text-light)',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat === 'HUMAN' && '실종 아동/성인'}
                                {cat === 'PET' && '반려동물'}
                                {cat === 'ITEM' && '소중한 물건'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Type Selection */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button
                        onClick={() => setFormData({ ...formData, type: 'LOST' })}
                        className={`btn ${formData.type === 'LOST' ? 'btn-secondary' : ''}`}
                        style={{ flex: 1, backgroundColor: formData.type === 'LOST' ? 'var(--secondary)' : 'var(--primary-light)', color: formData.type === 'LOST' ? 'white' : 'var(--primary)' }}
                    >
                        잃어버렸어요
                    </button>
                    <button
                        onClick={() => setFormData({ ...formData, type: 'FOUND' })}
                        className={`btn ${formData.type === 'FOUND' ? 'btn-primary' : ''}`}
                        style={{ flex: 1, backgroundColor: formData.type === 'FOUND' ? '#4CAF50' : 'var(--primary-light)', color: formData.type === 'FOUND' ? 'white' : 'var(--primary)' }}
                    >
                        찾았습니다
                    </button>
                </div>

                {/* Image Upload Area - 다중 사진 */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        📷 사진 ({formData.images.length}/5)
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px'
                    }}>
                        {formData.images.map((img, i) => (
                            <div key={`img-${i}`} style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: i === 0 ? '2px solid var(--primary)' : '1px solid var(--border)'
                            }}>
                                <img src={img} alt={`Preview ${i + 1}`} style={{
                                    width: '100%', height: '100%', objectFit: 'cover'
                                }} />
                                {i === 0 && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        backgroundColor: 'var(--primary)', color: 'white',
                                        fontSize: '10px', fontWeight: '700', textAlign: 'center',
                                        padding: '2px'
                                    }}>대표</div>
                                )}
                                <button type="button"
                                    onClick={() => removeImage(i)}
                                    style={{
                                        position: 'absolute', top: '4px', right: '4px',
                                        backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                                        border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', padding: 0
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {formData.images.length < 5 && (
                            <label style={{
                                aspectRatio: '1',
                                borderRadius: '12px',
                                border: '2px dashed var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <Camera size={28} color="#ccc" />
                                <span style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>사진 추가</span>
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>
                </div>

                {/* AI Tags */}
                {formData.tags.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            <Tag size={16} color="var(--primary)" />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>AI 자동 생성 태그</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {formData.tags.map(tag => (
                                <span key={tag} style={{
                                    backgroundColor: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Check size={12} /> {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>제목</label>
                        <input
                            type="text"
                            placeholder="예: 실종된 골든 리트리버를 찾습니다"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>발견 위치</label>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder="도로명/지번 주소를 입력하거나 지도를 선택하세요"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value, selectedCoords: null })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 36px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        fontSize: '16px'
                                    }}
                                />
                                <MapPin size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMapPicker(true)}
                                style={{
                                    padding: '0 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#E8F0FE',
                                    color: '#1967D2',
                                    border: 'none',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <MapPin size={16} /> 지도 선택
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>상세 설명</label>
                        <textarea
                            placeholder="특징, 당시 상황 등을 자세히 적어주세요"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '16px',
                                minHeight: '100px',
                                resize: 'none'
                            }}
                        ></textarea>
                    </div>

                    {/* 전단지용 추가 정보 */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#FFFDF5',
                        borderRadius: '12px',
                        border: '1px solid #F5DFA0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <FileText size={16} color="#F5A623" />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#B8860B' }}>전단지 추가 정보 (선택)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-light)' }}>이름</label>
                                <input
                                    type="text"
                                    placeholder="예: 메스 (Max)"
                                    value={formData.petName}
                                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-light)' }}>견종/종류</label>
                                <input
                                    type="text"
                                    placeholder="예: 골든 리트리버"
                                    value={formData.breed}
                                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-light)' }}>외형 특징</label>
                            <input
                                type="text"
                                placeholder="예: 안순맘, 파운드컬러 중얼"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-light)' }}>사례금</label>
                                <input
                                    type="text"
                                    placeholder="예: 100만원"
                                    value={formData.reward}
                                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-light)' }}>연락처</label>
                                <input
                                    type="text"
                                    placeholder="010-0000-0000"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Killer Feature: Golden Time Toggle */}
                    <div style={{
                        marginTop: '8px',
                        padding: '16px',
                        backgroundColor: formData.urgent ? '#FFF5F5' : '#F8F9FA',
                        borderRadius: '12px',
                        border: formData.urgent ? '1px solid #FFE3E3' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Zap size={20} color={formData.urgent ? 'var(--secondary)' : 'var(--text-light)'} fill={formData.urgent ? 'var(--secondary)' : 'none'} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: formData.urgent ? 'var(--secondary)' : 'var(--text)' }}>골든 타임 수색 요청</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>반경 3km 내 이웃에게 긴급 알림 발송</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormData({ ...formData, urgent: !formData.urgent })}
                            style={{
                                width: '44px',
                                height: '24px',
                                borderRadius: '12px',
                                backgroundColor: formData.urgent ? 'var(--secondary)' : '#ccc',
                                border: 'none',
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                position: 'absolute',
                                left: formData.urgent ? '22px' : '4px',
                                top: '3px',
                                transition: '0.2s'
                            }}></div>
                        </button>
                    </div>
                </div>

                {/* 전단지 제작 섹션 */}
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#F0F7FF',
                    borderRadius: '12px',
                    border: '1px solid #CCE0FF'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <FileText size={20} color="var(--primary)" />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>전단지 제작</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>등록 정보로 전단지를 자동 생성합니다</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFlyerModal(true)}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={16} />
                        전단지 미리보기 & 다운로드
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* 소셜 공유 섹션 */}
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#FAFBFC',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <Share2 size={20} color="var(--text)" />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>소셜 공유</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>더 많은 사람에게 알려 도움을 받으세요</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {/* 카카오톡 */}
                        <button
                            onClick={() => handleSocialShare('kakao')}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '12px 4px',
                                borderRadius: '12px',
                                border: '1px solid #FAE100',
                                backgroundColor: '#FEF9CD',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                backgroundColor: '#FAE100', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <MessageCircle size={18} color="#3C1E1E" />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#3C1E1E' }}>카카오톡</span>
                        </button>

                        {/* 페이스북 */}
                        <button
                            onClick={() => handleSocialShare('facebook')}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '12px 4px',
                                borderRadius: '12px',
                                border: '1px solid #D4DFEF',
                                backgroundColor: '#EBF0F9',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                backgroundColor: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>f</span>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1877F2' }}>페이스북</span>
                        </button>

                        {/* X (트위터) */}
                        <button
                            onClick={() => handleSocialShare('twitter')}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '12px 4px',
                                borderRadius: '12px',
                                border: '1px solid #D5D5D5',
                                backgroundColor: '#F5F5F5',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>𝕏</span>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#000' }}>X</span>
                        </button>

                        {/* 링크 복사 */}
                        <button
                            onClick={handleCopyLink}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '12px 4px',
                                borderRadius: '12px',
                                border: linkCopied ? '1px solid #4CAF50' : '1px solid var(--border)',
                                backgroundColor: linkCopied ? '#E8F5E9' : '#FAFBFC',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                backgroundColor: linkCopied ? '#4CAF50' : '#6B778C',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}>
                                {linkCopied ? <Check size={18} color="white" /> : <Copy size={18} color="white" />}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: linkCopied ? '#4CAF50' : '#6B778C' }}>
                                {linkCopied ? '복사됨!' : '링크복사'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={async () => {
                        if (isSubmitting) return;
                        setIsSubmitting(true);
                        try {
                            await onSubmit(formData, tempPostId);
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ 
                        width: '100%', padding: '16px', fontSize: '18px', marginTop: '32px',
                        backgroundColor: isSubmitting ? '#90CAF9' : 'var(--primary)',
                        cursor: isSubmitting ? 'wait' : 'pointer'
                    }}
                >
                    {isSubmitting ? '등록 중... (사진 업로드 포함)' : '등록 완료'}
                </button>
            </div>

            {/* 전단지 미리보기 모달 */}
            {showFlyerModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px',
                        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
                    }}>
                        {/* 모달 헤더 */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            position: 'sticky', top: 0, backgroundColor: 'white', borderRadius: '16px 16px 0 0', zIndex: 1
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>📋 전단지 미리보기</h3>
                            <button onClick={() => setShowFlyerModal(false)} style={{
                                border: 'none', background: 'none', cursor: 'pointer', padding: '4px'
                            }}>
                                <X size={22} color="#666" />
                            </button>
                        </div>

                        {/* 전단지 미리보기 - 참고 이미지 스타일 */}
                        <div ref={flyerRef} style={{ padding: '16px' }}>
                            <div style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                fontFamily: "'Noto Sans KR', 'Inter', sans-serif"
                            }}>
                                {/* === 로고 영역 === */}
                                <div style={{
                                    padding: '14px 20px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '6px',
                                        backgroundColor: '#2D2D2D', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: '900', fontSize: '14px'
                                    }}>R</div>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333', letterSpacing: '-0.3px' }}>
                                        리턴팟 <span style={{ color: '#999', fontWeight: '400' }}>(Returnpot)</span>
                                    </span>
                                </div>

                                {/* === 메인 타이틀 === */}
                                <div style={{ textAlign: 'center', padding: '4px 20px 6px' }}>
                                    <div style={{
                                        fontSize: '26px', fontWeight: '900', color: '#1a1a1a',
                                        letterSpacing: '-0.5px', lineHeight: '1.3'
                                    }}>
                                        {formData.type === 'LOST'
                                            ? (formData.category === 'HUMAN' ? '실종자를 찾습니다' : formData.category === 'PET' ? '실종 동물 찾습니다' : '분실물을 찾습니다')
                                            : '발견 신고'
                                        }
                                    </div>
                                    <div style={{
                                        display: 'inline-block',
                                        backgroundColor: '#F5A623',
                                        color: 'white',
                                        padding: '3px 16px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        letterSpacing: '2px',
                                        marginTop: '6px'
                                    }}>
                                        {formData.category === 'HUMAN' ? 'MISSING PERSON' : formData.category === 'PET' ? 'LOST PET' : 'LOST ITEM'}
                                    </div>
                                </div>

                                {/* === 사진 영역 === */}
                                <div style={{
                                    padding: '12px 30px 14px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                }}>
                                    {formData.images.length === 0 && (
                                        <div style={{
                                            width: '65%',
                                            aspectRatio: '3/4',
                                            border: '4px solid #F5A623',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#f8f8f8',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            color: '#ccc'
                                        }}>
                                            <Camera size={36} />
                                            <div style={{ fontSize: '12px', marginTop: '8px', color: '#bbb' }}>사진을 등록해주세요</div>
                                        </div>
                                    )}
                                    {formData.images.length === 1 && (
                                        <div style={{
                                            width: '65%',
                                            aspectRatio: '3/4',
                                            border: '4px solid #F5A623',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            backgroundColor: '#f8f8f8'
                                        }}>
                                            <img src={formData.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {formData.category === 'PET' && (
                                                <div style={{
                                                    position: 'absolute', top: '-6px', right: '-6px',
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    backgroundColor: '#F5A623', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', boxShadow: '0 2px 6px rgba(245,166,35,0.4)'
                                                }}>🐾</div>
                                            )}
                                        </div>
                                    )}
                                    {formData.images.length === 2 && (
                                        <div style={{ display: 'flex', gap: '6px', width: '80%' }}>
                                            {formData.images.map((img, i) => (
                                                <div key={`flyer-img-${i}`} style={{
                                                    flex: 1, aspectRatio: '3/4',
                                                    border: '3px solid #F5A623',
                                                    borderRadius: '8px', overflow: 'hidden'
                                                }}>
                                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formData.images.length >= 3 && (
                                        <div style={{ width: '85%' }}>
                                            <div style={{
                                                aspectRatio: '4/3',
                                                border: '3px solid #F5A623',
                                                borderRadius: '8px', overflow: 'hidden',
                                                marginBottom: '6px'
                                            }}>
                                                <img src={formData.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {formData.images.slice(1, 4).map((img, i) => (
                                                    <div key={`flyer-sub-${i}`} style={{
                                                        flex: 1, aspectRatio: '1',
                                                        border: '2px solid #F5A623',
                                                        borderRadius: '6px', overflow: 'hidden',
                                                        position: 'relative'
                                                    }}>
                                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        {i === 2 && formData.images.length > 4 && (
                                                            <div style={{
                                                                position: 'absolute', inset: 0,
                                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: 'white', fontSize: '16px', fontWeight: '800'
                                                            }}>+{formData.images.length - 4}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* === 정보 테이블 === */}
                                <div style={{ padding: '0 20px 12px' }}>
                                    <div style={{
                                        border: '2px solid #F5A623',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        {[
                                            { label: '이름', value: formData.petName || formData.title || '-' },
                                            { label: formData.category === 'HUMAN' ? '인상착의' : formData.category === 'PET' ? '견종/종류' : '품목', value: formData.breed || '-' },
                                            { label: '특징', value: formData.features || formData.description?.slice(0, 40) || '-' },
                                            { label: '실종 장소', value: formData.location || '-' },
                                            { label: '실종 일시', value: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                        ].map((row, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                borderBottom: i < 4 ? '1px solid #F5DFA0' : 'none',
                                                fontSize: '12px'
                                            }}>
                                                <div style={{
                                                    width: '80px', minWidth: '80px',
                                                    padding: '8px 10px',
                                                    backgroundColor: '#FFF8E7',
                                                    fontWeight: '700',
                                                    color: '#8B6914',
                                                    borderRight: '1px solid #F5DFA0',
                                                    display: 'flex', alignItems: 'center'
                                                }}>
                                                    {row.label}
                                                </div>
                                                <div style={{
                                                    flex: 1, padding: '8px 10px',
                                                    color: '#333',
                                                    fontWeight: '600',
                                                    display: 'flex', alignItems: 'center',
                                                    wordBreak: 'break-all'
                                                }}>
                                                    {row.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* === 사례금 영역 === */}
                                {formData.reward && (
                                    <div style={{ padding: '0 20px 12px' }}>
                                        <div style={{
                                            backgroundColor: '#FFF8E1',
                                            border: '2px solid #F5A623',
                                            borderRadius: '8px',
                                            padding: '12px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#8B6914' }}>사례금:</div>
                                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#D4850A' }}>
                                                소중히 사례하겠습니다 <span style={{ color: '#E74C3C' }}>{formData.reward}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F5A623', fontStyle: 'italic' }}>
                                                (Reward: ₩{formData.reward})
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* === 연락처 === */}
                                {formData.contactPhone && (
                                    <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
                                        <div style={{
                                            backgroundColor: '#F0F7FF',
                                            border: '1px solid #CCE0FF',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            color: '#0052cc'
                                        }}>
                                            📞 연락처: {formData.contactPhone}
                                        </div>
                                    </div>
                                )}

                                {/* === QR 코드 + 하단 === */}
                                <div style={{
                                    padding: '12px 20px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderTop: '1px solid #eee'
                                }}>
                                    {/* QR 코드 (SVG 시뮬레이션) */}
                                    <div style={{
                                        width: '64px', height: '64px', minWidth: '64px',
                                        border: '2px solid #333',
                                        borderRadius: '4px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, 1fr)',
                                        gridTemplateRows: 'repeat(7, 1fr)',
                                        gap: '1px',
                                        padding: '4px',
                                        backgroundColor: 'white'
                                    }}>
                                        {Array.from({ length: 49 }).map((_, i) => {
                                            const row = Math.floor(i / 7);
                                            const col = i % 7;
                                            const isCorner = (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3);
                                            const isCenter = row === 3 && col === 3;
                                            const isPattern = isCorner || isCenter || (i % 3 === 0);
                                            return (
                                                <div key={i} style={{
                                                    backgroundColor: isPattern ? '#333' : '#fff',
                                                    borderRadius: '0.5px'
                                                }} />
                                            );
                                        })}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a', marginBottom: '2px' }}>
                                            스캔하여 제보하기
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', fontWeight: '500' }}>
                                            Scan to Report
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#0052cc', fontWeight: '600', marginTop: '4px' }}>
                                            returnpot.kr
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 모달 액션 버튼 */}
                        <div style={{
                            padding: '16px 20px 24px',
                            display: 'flex', gap: '8px'
                        }}>
                            <button
                                onClick={handleDownloadFlyer}
                                className="btn"
                                style={{
                                    flex: 1, padding: '12px',
                                    backgroundColor: 'var(--primary)', color: 'white',
                                    borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                <Download size={16} />
                                이미지 저장
                            </button>
                            <button
                                onClick={handleCopyLink}
                                className="btn"
                                style={{
                                    flex: 1, padding: '12px',
                                    backgroundColor: '#E8F4FD', color: '#0052CC',
                                    borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                <Share2 size={16} />
                                공유하기
                            </button>
                            <button
                                onClick={() => setShowFlyerModal(false)}
                                className="btn"
                                style={{
                                    flex: 1, padding: '12px',
                                    backgroundColor: '#F0F2F5', color: 'var(--text)',
                                    borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                <X size={16} />
                                닫기
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid #FFF;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
            {showMapPicker && (
                <LocationPickerModal
                    initialLocation={formData.selectedCoords}
                    onClose={() => setShowMapPicker(false)}
                    onSelect={(coords, address) => {
                        setFormData({ ...formData, selectedCoords: coords, location: address });
                        setShowMapPicker(false);
                    }}
                />
            )}
        </div>
    );
};

export default NewPostForm;
