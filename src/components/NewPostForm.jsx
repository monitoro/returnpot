import React, { useState } from 'react';
import { Camera, X, MapPin, Tag, ChevronRight, Check, Zap } from 'lucide-react';

const NewPostForm = ({ onBack, onSubmit }) => {
    const [formData, setFormData] = useState({
        type: 'LOST', // LOST or FOUND
        category: 'PET', // HUMAN, PET, ITEM
        title: '',
        description: '',
        location: '',
        image: null,
        tags: []
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
                analyzeImage();
            };
            reader.readAsDataURL(file);
        }
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

                {/* Image Upload Area */}
                <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#f0f2f5',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    border: '2px dashed var(--border)'
                }}>
                    {formData.image ? (
                        <>
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                                onClick={() => setFormData({ ...formData, image: null, tags: [] })}
                                style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px' }}
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                            <Camera size={48} color="#ccc" />
                            <span style={{ marginTop: '12px', color: '#999' }}>사진을 촬영하거나 선택하세요</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    )}

                    {isAnalyzing && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,82,204,0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white'
                        }}>
                            <div className="loader" style={{ marginBottom: '12px' }}></div>
                            <span style={{ fontWeight: '600' }}>AI 기반 태그 추출 중...</span>
                        </div>
                    )}
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
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="지도를 클릭하거나 주소를 입력하세요"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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

                {/* Submit Button */}
                <button
                    onClick={() => onSubmit(formData)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '18px', marginTop: '32px' }}
                >
                    등록 완료
                </button>
            </div>

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
      `}</style>
        </div>
    );
};

export default NewPostForm;
