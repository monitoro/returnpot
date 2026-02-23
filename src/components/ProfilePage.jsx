import React, { useState } from 'react';
import {
    User, Award, Shield, Star, Zap, MapPin, Eye, Heart,
    Target, TrendingUp, ChevronRight, Lock, CheckCircle,
    Crown, Medal, Flame, Compass, Search as SearchIcon, Clock, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = ({ myTown }) => {
    const { user, profile, isAnonymous, signOut, signInWithGoogle } = useAuth();
    const [activeTab, setActiveTab] = useState('badges');

    // 비로그인(익명) 사용자인 경우 로그인 유도 화면
    if (isAnonymous) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
                    backgroundColor: '#E3F2FD',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <User size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>로그인이 필요합니다</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                    로그인하면 나만의 프로필, 뱃지, 레벨 등<br />다양한 기능을 이용할 수 있습니다.
                </p>
                <button
                    type="button"
                    onClick={async () => {
                        try { await signInWithGoogle(); } catch (e) { console.error(e); }
                    }}
                    style={{
                        padding: '14px 32px', borderRadius: '12px',
                        border: 'none', backgroundColor: 'var(--primary)',
                        color: 'white', fontSize: '16px', fontWeight: '700',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)'
                    }}
                >
                    Google 로그인
                </button>
            </div>
        );
    }

    // 사용자 레벨 시스템 (profile에서 실제 데이터 가져오기)
    const userProfile = {
        nickname: profile?.nickname || user?.displayName || '사용자',
        town: myTown || '역삼1동',
        level: profile?.angelLevel || 1,
        exp: profile?.exp || 0,
        nextLevelExp: profile?.nextLevelExp || 50,
        angelLevel: profile?.angelLevel || 1,
        totalPosts: profile?.totalPosts || 0,
        totalReports: profile?.totalReports || 0,
        totalFound: profile?.totalFound || 0,
        joinDate: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : '-',
        currentTitle: profile?.currentTitle || 'neighborhood_guardian',
        goldenTimeParticipation: profile?.goldenTimeParticipation || 0,
        communityPosts: profile?.communityPosts || 0,
        likesReceived: profile?.likesReceived || 0
    };

    const expPercent = Math.round((userProfile.exp / userProfile.nextLevelExp) * 100);

    // 레벨 단계 정보
    const levelInfo = [
        { level: 1, name: '새싹 이웃', minExp: 0, color: '#8BC34A' },
        { level: 2, name: '관심 이웃', minExp: 50, color: '#4CAF50' },
        { level: 3, name: '적극 이웃', minExp: 100, color: '#00BCD4' },
        { level: 4, name: '믿음 이웃', minExp: 150, color: '#2196F3' },
        { level: 5, name: '열정 파수꾼', minExp: 200, color: '#3F51B5' },
        { level: 6, name: '동네 수호자', minExp: 300, color: '#9C27B0' },
        { level: 7, name: '엔젤 파인더', minExp: 400, color: '#E91E63' },
        { level: 8, name: '전설의 수색대', minExp: 600, color: '#FF5722' },
        { level: 9, name: '지역 영웅', minExp: 900, color: '#FF9800' },
        { level: 10, name: '리턴즈 마스터', minExp: 1500, color: '#FFC107' },
    ];

    const currentLevelInfo = levelInfo.find(l => l.level === userProfile.level) || levelInfo[0];

    // 직함 시스템 - profile 데이터 기반 동적 계산
    const titles = [
        {
            id: 'neighborhood_guardian',
            name: '우리동네 보안관',
            icon: Shield,
            description: '골든 타임 수색 3회 이상 참여',
            requirement: '골든 타임 수색 3회 참여',
            unlocked: userProfile.goldenTimeParticipation >= 3,
            equipped: userProfile.currentTitle === 'neighborhood_guardian',
            color: '#0052CC',
            bgColor: '#E3F2FD'
        },
        {
            id: 'golden_time_hero',
            name: '골든 타임 영웅',
            icon: Zap,
            description: '골든 타임 수색으로 실종자 발견 기여',
            requirement: '수색 참여 후 실종자 발견 1회',
            unlocked: userProfile.totalFound >= 1 && userProfile.goldenTimeParticipation >= 1,
            equipped: userProfile.currentTitle === 'golden_time_hero',
            color: '#FF6D00',
            bgColor: '#FFF3E0'
        },
        {
            id: 'night_watcher',
            name: '심야 파수꾼',
            icon: Eye,
            description: '야간 시간대(22~06시) 제보 5회 이상',
            requirement: '야간 제보 5회',
            unlocked: false,
            color: '#311B92',
            bgColor: '#EDE7F6'
        },
        {
            id: 'pet_detective',
            name: '펫 탐정',
            icon: SearchIcon,
            description: '반려동물 관련 제보 10회 이상',
            requirement: '반려동물 제보 10회',
            unlocked: userProfile.totalPosts >= 10,
            equipped: userProfile.currentTitle === 'pet_detective',
            color: '#1B5E20',
            bgColor: '#E8F5E9'
        },
        {
            id: 'community_star',
            name: '커뮤니티 스타',
            icon: Star,
            description: '커뮤니티 게시글 좋아요 100개 달성',
            requirement: '좋아요 100개 달성',
            unlocked: userProfile.likesReceived >= 100,
            equipped: userProfile.currentTitle === 'community_star',
            color: '#F9A825',
            bgColor: '#FFFDE7'
        },
        {
            id: 'town_legend',
            name: '동네 전설',
            icon: Crown,
            description: '레벨 10 달성 + 습득물 반환 5회',
            requirement: 'Lv.10 + 반환 5회',
            unlocked: userProfile.angelLevel >= 10 && userProfile.totalFound >= 5,
            equipped: userProfile.currentTitle === 'town_legend',
            color: '#B71C1C',
            bgColor: '#FFEBEE'
        }
    ];

    // 뱃지 시스템 - profile 데이터 기반 동적 계산
    const badges = [
        {
            id: 'first_post',
            name: '첫 번째 외침',
            description: '첫 게시글 등록',
            icon: '📢',
            unlocked: userProfile.totalPosts >= 1,
            progress: Math.min(userProfile.totalPosts, 1),
            total: 1,
            rarity: 'common'
        },
        {
            id: 'helper',
            name: '따뜻한 이웃',
            description: '제보 댓글 10회 작성',
            icon: '🤝',
            unlocked: userProfile.totalReports >= 10,
            progress: Math.min(userProfile.totalReports, 10),
            total: 10,
            rarity: 'common'
        },
        {
            id: 'golden_time_3',
            name: '수색대원',
            description: '골든 타임 수색 3회 참여',
            icon: '🔦',
            unlocked: userProfile.goldenTimeParticipation >= 3,
            progress: Math.min(userProfile.goldenTimeParticipation, 3),
            total: 3,
            rarity: 'uncommon'
        },
        {
            id: 'found_pet',
            name: '기적의 재회',
            description: '실종 동물 찾기 성공 기여',
            icon: '🐾',
            unlocked: userProfile.totalFound >= 1,
            progress: Math.min(userProfile.totalFound, 1),
            total: 1,
            rarity: 'rare'
        },
        {
            id: 'community_active',
            name: '수다왕',
            description: '커뮤니티 글 20개 작성',
            icon: '💬',
            unlocked: userProfile.communityPosts >= 20,
            progress: Math.min(userProfile.communityPosts, 20),
            total: 20,
            rarity: 'uncommon'
        },
        {
            id: 'streak_7',
            name: '7일 연속 출석',
            description: '7일 연속 앱 사용',
            icon: '🔥',
            unlocked: false,
            progress: 0,
            total: 7,
            rarity: 'uncommon'
        },
        {
            id: 'golden_time_10',
            name: '골든 타임 베테랑',
            description: '골든 타임 수색 10회 참여',
            icon: '⚡',
            unlocked: userProfile.goldenTimeParticipation >= 10,
            progress: Math.min(userProfile.goldenTimeParticipation, 10),
            total: 10,
            rarity: 'rare'
        },
        {
            id: 'angel_level_5',
            name: '천사의 날개',
            description: '엔젤 레벨 5 이상 달성',
            icon: '👼',
            unlocked: userProfile.angelLevel >= 5,
            progress: Math.min(userProfile.angelLevel, 5),
            total: 5,
            rarity: 'rare'
        },
        {
            id: 'item_return_5',
            name: '습득물 요정',
            description: '습득물 반환 5회 완료',
            icon: '🧚',
            unlocked: userProfile.totalFound >= 5,
            progress: Math.min(userProfile.totalFound, 5),
            total: 5,
            rarity: 'rare'
        },
        {
            id: 'perfect_month',
            name: '이달의 수호자',
            description: '한 달간 제보 + 수색 + 커뮤니티 활동 모두 참여',
            icon: '🏆',
            unlocked: false,
            progress: 0,
            total: 1,
            rarity: 'epic'
        },
        {
            id: 'legend_finder',
            name: '전설의 파인더',
            description: '실종자/동물 10회 이상 찾기 기여',
            icon: '🌟',
            unlocked: userProfile.totalFound >= 10,
            progress: Math.min(userProfile.totalFound, 10),
            total: 10,
            rarity: 'legendary'
        },
        {
            id: 'district_hero',
            name: '우리 동네 영웅',
            description: '같은 동네에서 50회 이상 활동',
            icon: '🦸',
            unlocked: (userProfile.totalPosts + userProfile.totalReports + userProfile.communityPosts) >= 50,
            progress: Math.min(userProfile.totalPosts + userProfile.totalReports + userProfile.communityPosts, 50),
            total: 50,
            rarity: 'epic'
        }
    ];

    const rarityColors = {
        common: { bg: '#F5F5F5', border: '#E0E0E0', text: '#757575', label: '일반' },
        uncommon: { bg: '#E8F5E9', border: '#81C784', text: '#2E7D32', label: '고급' },
        rare: { bg: '#E3F2FD', border: '#64B5F6', text: '#1565C0', label: '희귀' },
        epic: { bg: '#F3E5F5', border: '#BA68C8', text: '#7B1FA2', label: '영웅' },
        legendary: { bg: '#FFF8E1', border: '#FFD54F', text: '#F57F17', label: '전설' }
    };

    // 활동 통계
    const activityStats = [
        { label: '게시글', value: userProfile.totalPosts, icon: Target, color: '#0052CC' },
        { label: '제보', value: userProfile.totalReports, icon: Eye, color: '#00BFA5' },
        { label: '찾기 성공', value: userProfile.totalFound, icon: CheckCircle, color: '#4CAF50' },
        { label: '골든 타임', value: userProfile.goldenTimeParticipation, icon: Zap, color: '#FF6D00' },
    ];

    const equippedTitle = titles.find(t => t.equipped);

    return (
        <div style={{ padding: '0 0 120px 0' }}>
            {/* 프로필 카드 */}
            <div style={{
                margin: '20px', padding: '24px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #0052CC 0%, #2196F3 50%, #00BCD4 100%)',
                color: 'white', position: 'relative', overflow: 'hidden'
            }}>
                {/* 배경 장식 */}
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20px', left: '40%',
                    width: '80px', height: '80px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.06)'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', position: 'relative' }}>
                    {/* 아바타 */}
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <User size={28} />
                        {/* 레벨 배지 */}
                        <div style={{
                            position: 'absolute', bottom: '-4px', right: '-4px',
                            width: '24px', height: '24px', borderRadius: '50%',
                            backgroundColor: currentLevelInfo.color,
                            border: '2px solid white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: '900'
                        }}>
                            {userProfile.level}
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{userProfile.nickname}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                            <MapPin size={12} /> {userProfile.town}
                        </div>
                        {/* 착용 중인 직함 */}
                        {equippedTitle && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                marginTop: '6px', padding: '3px 10px', borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: '700'
                            }}>
                                <equippedTitle.icon size={12} /> {equippedTitle.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* 레벨 프로그레스 */}
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', opacity: 0.9 }}>
                        <span>Lv.{userProfile.level} {currentLevelInfo.name}</span>
                        <span>{userProfile.exp} / {userProfile.nextLevelExp} EXP</span>
                    </div>
                    <div style={{
                        width: '100%', height: '8px', borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${expPercent}%`, height: '100%', borderRadius: '4px',
                            background: 'linear-gradient(90deg, #FFD54F, #FFA726)',
                            transition: 'width 0.5s ease',
                            boxShadow: '0 0 8px rgba(255,213,79,0.5)'
                        }} />
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                        다음 레벨까지 {userProfile.nextLevelExp - userProfile.exp} EXP
                    </div>
                </div>
            </div>

            {/* 활동 통계 */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
                margin: '0 20px 16px'
            }}>
                {activityStats.map(stat => (
                    <div key={stat.label} style={{
                        textAlign: 'center', padding: '12px 4px',
                        borderRadius: '12px', backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid var(--border)'
                    }}>
                        <stat.icon size={18} color={stat.color} style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '18px', fontWeight: '900', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '600' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* 탭 전환 */}
            <div style={{
                display: 'flex', margin: '0 20px', borderRadius: '10px',
                backgroundColor: '#f0f0f0', padding: '3px', gap: '3px'
            }}>
                {[
                    { key: 'badges', label: '🏅 뱃지' },
                    { key: 'titles', label: '🛡️ 직함' },
                    { key: 'level', label: '📊 레벨' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '8px 0', borderRadius: '8px',
                            border: 'none', fontSize: '13px', fontWeight: '700',
                            backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
                            color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-light)',
                            cursor: 'pointer',
                            boxShadow: activeTab === tab.key ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 뱃지 탭 */}
            {activeTab === 'badges' && (
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            획득 <strong style={{ color: 'var(--primary)' }}>{badges.filter(b => b.unlocked).length}</strong> / {badges.length}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {badges.map(badge => {
                            const rarity = rarityColors[badge.rarity];
                            const progressPct = Math.min(100, Math.round((badge.progress / badge.total) * 100));
                            return (
                                <div key={badge.id} style={{
                                    padding: '14px 8px', borderRadius: '14px',
                                    backgroundColor: badge.unlocked ? rarity.bg : '#fafafa',
                                    border: `1.5px solid ${badge.unlocked ? rarity.border : '#e8e8e8'}`,
                                    textAlign: 'center', position: 'relative',
                                    opacity: badge.unlocked ? 1 : 0.6,
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}>
                                    {/* 잠금 아이콘 */}
                                    {!badge.unlocked && (
                                        <div style={{
                                            position: 'absolute', top: '6px', right: '6px'
                                        }}>
                                            <Lock size={10} color="#bbb" />
                                        </div>
                                    )}
                                    {/* 등급 표시 */}
                                    <div style={{
                                        position: 'absolute', top: '5px', left: '5px',
                                        fontSize: '8px', fontWeight: '800',
                                        color: rarity.text, backgroundColor: 'rgba(255,255,255,0.8)',
                                        padding: '1px 5px', borderRadius: '4px'
                                    }}>
                                        {rarity.label}
                                    </div>

                                    <div style={{ fontSize: '28px', marginBottom: '6px', filter: badge.unlocked ? 'none' : 'grayscale(1)' }}>
                                        {badge.icon}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '2px', color: badge.unlocked ? rarity.text : '#999' }}>
                                        {badge.name}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#999', marginBottom: '6px', lineHeight: '1.3' }}>
                                        {badge.description}
                                    </div>

                                    {/* 진행 바 */}
                                    {!badge.unlocked && (
                                        <div>
                                            <div style={{
                                                width: '100%', height: '4px', borderRadius: '2px',
                                                backgroundColor: '#e0e0e0', overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${progressPct}%`, height: '100%',
                                                    borderRadius: '2px',
                                                    backgroundColor: rarity.border
                                                }} />
                                            </div>
                                            <div style={{ fontSize: '9px', color: '#aaa', marginTop: '3px' }}>
                                                {badge.progress}/{badge.total}
                                            </div>
                                        </div>
                                    )}
                                    {badge.unlocked && (
                                        <div style={{
                                            fontSize: '9px', color: rarity.text, fontWeight: '700',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px'
                                        }}>
                                            <CheckCircle size={10} /> 획득 완료
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 직함 탭 */}
            {activeTab === 'titles' && (
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>
                        획득한 직함을 프로필에 장착할 수 있습니다.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {titles.map(title => (
                            <div key={title.id} style={{
                                padding: '14px 16px', borderRadius: '14px',
                                backgroundColor: title.unlocked ? title.bgColor : '#fafafa',
                                border: title.equipped ? `2px solid ${title.color}` : `1px solid ${title.unlocked ? title.color + '40' : '#e8e8e8'}`,
                                display: 'flex', alignItems: 'center', gap: '12px',
                                opacity: title.unlocked ? 1 : 0.5,
                                position: 'relative',
                                cursor: title.unlocked ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}>
                                {/* 착용 중 표시 */}
                                {title.equipped && (
                                    <div style={{
                                        position: 'absolute', top: '-8px', right: '10px',
                                        backgroundColor: title.color, color: 'white',
                                        padding: '2px 8px', borderRadius: '8px',
                                        fontSize: '9px', fontWeight: '800'
                                    }}>
                                        착용 중
                                    </div>
                                )}

                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    backgroundColor: title.unlocked ? title.color : '#ccc',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <title.icon size={22} color="white" />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: title.unlocked ? title.color : '#999' }}>
                                        {title.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                        {title.description}
                                    </div>
                                    {!title.unlocked && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                                            marginTop: '4px', fontSize: '10px', color: '#bbb', fontWeight: '600'
                                        }}>
                                            <Lock size={10} /> {title.requirement}
                                        </div>
                                    )}
                                </div>

                                {title.unlocked && !title.equipped && (
                                    <button style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: `1px solid ${title.color}`,
                                        backgroundColor: 'white',
                                        color: title.color,
                                        fontSize: '11px', fontWeight: '700',
                                        cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}>
                                        장착
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 레벨 탭 */}
            {activeTab === 'level' && (
                <div style={{ padding: '16px 20px' }}>
                    {/* 현재 레벨 카드 */}
                    <div style={{
                        padding: '20px', borderRadius: '14px', marginBottom: '16px',
                        backgroundColor: currentLevelInfo.color + '10',
                        border: `1.5px solid ${currentLevelInfo.color}30`
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 8px',
                                backgroundColor: currentLevelInfo.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 4px 16px ${currentLevelInfo.color}40`
                            }}>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{userProfile.level}</span>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: currentLevelInfo.color }}>{currentLevelInfo.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                                현재 {userProfile.exp} EXP · 다음 레벨까지 {userProfile.nextLevelExp - userProfile.exp} EXP
                            </div>
                        </div>

                        {/* EXP 획득 방법 */}
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>EXP 획득 방법</div>
                            {[
                                { action: '게시글 작성', exp: '+10 EXP' },
                                { action: '제보 댓글 작성', exp: '+5 EXP' },
                                { action: '골든 타임 수색 참여', exp: '+30 EXP' },
                                { action: '실종자/물건 찾기 기여', exp: '+50 EXP' },
                                { action: '커뮤니티 활동 (글/댓글)', exp: '+5 EXP' },
                                { action: '출석 체크', exp: '+3 EXP' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 0',
                                    borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none',
                                    fontSize: '12px'
                                }}>
                                    <span style={{ color: '#555' }}>{item.action}</span>
                                    <span style={{ color: currentLevelInfo.color, fontWeight: '700' }}>{item.exp}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 전체 레벨 로드맵 */}
                    <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>레벨 로드맵</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {levelInfo.map((lvl, i) => {
                            const reached = userProfile.level >= lvl.level;
                            const isCurrent = userProfile.level === lvl.level;
                            return (
                                <div key={lvl.level} style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                                    {/* 타임라인 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: reached ? lvl.color : '#e0e0e0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: '900', color: 'white',
                                            border: isCurrent ? '3px solid white' : 'none',
                                            boxShadow: isCurrent ? `0 0 0 2px ${lvl.color}, 0 2px 8px ${lvl.color}60` : 'none',
                                            flexShrink: 0
                                        }}>
                                            {lvl.level}
                                        </div>
                                        {i < levelInfo.length - 1 && (
                                            <div style={{
                                                width: '2px', flex: 1, minHeight: '20px',
                                                backgroundColor: reached ? lvl.color : '#e0e0e0'
                                            }} />
                                        )}
                                    </div>

                                    {/* 정보 */}
                                    <div style={{
                                        flex: 1, paddingBottom: '12px',
                                        opacity: reached ? 1 : 0.5
                                    }}>
                                        <div style={{
                                            fontSize: '13px', fontWeight: '700',
                                            color: reached ? lvl.color : '#999',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {lvl.name}
                                            {isCurrent && (
                                                <span style={{
                                                    fontSize: '9px', backgroundColor: lvl.color, color: 'white',
                                                    padding: '1px 6px', borderRadius: '6px', fontWeight: '800'
                                                }}>
                                                    현재
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                                            {lvl.minExp} EXP 필요
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 하단 메뉴 */}
            <div style={{ padding: '0 20px' }}>
                {[
                    { label: '활동 내역', desc: '나의 게시글과 제보 기록', icon: Clock },
                    { label: '설정', desc: '알림 · 계정 · 개인정보', icon: Compass },
                ].map((menu, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 0',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer'
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            backgroundColor: 'var(--primary-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <menu.icon size={18} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '700' }}>{menu.label}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{menu.desc}</div>
                        </div>
                        <ChevronRight size={18} color="var(--text-light)" />
                    </div>
                ))}
            </div>

            {/* 가입일 + 로그아웃 */}
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>
                    가입일: {userProfile.joinDate} · {user?.email || '이메일 미설정'}
                </div>
                <button
                    type="button"
                    onClick={signOut}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '10px 24px', borderRadius: '10px',
                        border: '1px solid #e0e0e0', backgroundColor: 'white',
                        color: '#e53935', fontSize: '14px', fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={16} />
                    로그아웃
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
