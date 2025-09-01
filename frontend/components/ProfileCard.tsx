'use client'

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import "./ProfileCard.css";
import { UserAvatar } from "./UserAvatar";
import { Avatar as OnchainAvatar } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

const DEFAULT_BEHIND_GRADIENT =
  "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";

const DEFAULT_INNER_GRADIENT =
  "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const ANIMATION_CONFIG = {
  SMOOTH_DURATION: 600,
  INITIAL_DURATION: 1500,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);

const round = (value: number, precision = 3) =>
  parseFloat(value.toFixed(precision));

const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
) =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

interface ProfileCardProps {
  address?: string
  basename?: string
  username?: string
  totalScore?: number
  baseScore?: number
  securityScore?: number
  avatarUrl?: string
  iconUrl?: string
  grainUrl?: string
  behindGradient?: string
  innerGradient?: string
  showBehindGradient?: boolean
  className?: string
  enableTilt?: boolean
  enableMobileTilt?: boolean
  mobileTiltSensitivity?: number
  onContactClick?: () => void
  profile?: {
    username: string
    avatar: string
    useBasenameProfile: boolean
    basename?: string
    basenameAvatar?: string
  }
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  address = "0x1234...5678",
  basename,
  username,
  totalScore = 0,
  baseScore = 0,
  securityScore = 0,
  avatarUrl = "/default-avatar.svg",
  iconUrl = "/logo.png",
  grainUrl,
  behindGradient,
  innerGradient,
  showBehindGradient = true,
  className = "",
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  onContactClick,
  profile,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  // Determine display name - EXACTLY like dashboard layout.tsx getUserDisplayName()
  const displayName = useMemo(() => {
    // First check profile data (like layout.tsx)
    if (profile?.useBasenameProfile && profile?.basename && profile.basename.trim()) {
      return profile.basename.trim();
    }
    if (profile?.username && profile.username.trim()) {
      const cleanUsername = profile.username.trim();
      return cleanUsername.length > 20 ? `${cleanUsername.substring(0, 17)}...` : cleanUsername;
    }
    // Then check direct props (fallback)
    if (basename && basename.trim()) return basename.trim();
    if (username && username.trim()) {
      const cleanUsername = username.trim();
      return cleanUsername.length > 20 ? `${cleanUsername.substring(0, 17)}...` : cleanUsername;
    }
    // Show address if no name available (like layout.tsx)
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return "User";
  }, [basename, username, profile, address]);

  // Enhanced debug logging to see what profile data we're getting
  useEffect(() => {
    console.log('🔍 ProfileCard Debug:', { 
      profile, 
      address, 
      basename, 
      username,
      hasProfile: !!profile,
      profileKeys: profile ? Object.keys(profile) : [],
      profileValues: profile ? Object.values(profile) : []
    });
  }, [profile, address, basename, username]);

  const showVerification = Boolean(profile?.useBasenameProfile && profile?.basename && profile.basename.trim()) || Boolean(basename && basename.trim());

  // Get the correct avatar URL - EXACTLY like dashboard layout.tsx
  const finalAvatarUrl = useMemo(() => {
    console.log('Avatar Debug:', { profile, avatarUrl });
    // Check if profile has valid avatar data (like layout.tsx)
    if (profile?.useBasenameProfile && profile?.basenameAvatar && profile.basenameAvatar.trim()) {
      console.log('Using basenameAvatar:', profile.basenameAvatar);
      return profile.basenameAvatar.trim();
    }
    if (profile?.avatar && profile.avatar.trim() && profile.avatar !== '/default-avatar.svg') {
      console.log('Using profile avatar:', profile.avatar);
      return profile.avatar.trim();
    }
    // Fallback to avatarUrl prop (which comes from dashboard page)
    console.log('Using avatarUrl prop:', avatarUrl);
    return avatarUrl || '/default-avatar.svg';
  }, [profile, avatarUrl]);

  const animationHandlers = useMemo(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;

    const updateCardTransform = (
      offsetX: number,
      offsetY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const width = card.clientWidth;
      const height = card.clientHeight;

      const percentX = clamp((100 / width) * offsetX);
      const percentY = clamp((100 / height) * offsetY);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };

      Object.entries(properties).forEach(([property, value]) => {
        wrap.style.setProperty(property, value);
      });
    };

    const createSmoothAnimation = (
      duration: number,
      startX: number,
      startY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const startTime = performance.now();
      const targetX = wrap.clientWidth / 2;
      const targetY = wrap.clientHeight / 2;

      const animationLoop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration);
        const easedProgress = easeInOutCubic(progress);

        const currentX = adjust(easedProgress, 0, 1, startX, targetX);
        const currentY = adjust(easedProgress, 0, 1, startY, targetY);

        updateCardTransform(currentX, currentY, card, wrap);

        if (progress < 1) {
          rafId = requestAnimationFrame(animationLoop);
        }
      };

      rafId = requestAnimationFrame(animationLoop);
    };

    return {
      updateCardTransform,
      createSmoothAnimation,
      cancelAnimation: () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(
        event.clientX - rect.left,
        event.clientY - rect.top,
        card,
        wrap
      );
    },
    [animationHandlers]
  );

  const handlePointerEnter = useCallback(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap || !animationHandlers) return;

    animationHandlers.cancelAnimation();
    wrap.classList.add("active");
    card.classList.add("active");
  }, [animationHandlers]);

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      animationHandlers.createSmoothAnimation(
        ANIMATION_CONFIG.SMOOTH_DURATION,
        (event as any).offsetX,
        (event as any).offsetY,
        card,
        wrap
      );
      wrap.classList.remove("active");
      card.classList.remove("active");
    },
    [animationHandlers]
  );

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      const { beta, gamma } = event;
      if (!beta || !gamma) return;

      animationHandlers.updateCardTransform(
        card.clientHeight / 2 + gamma * mobileTiltSensitivity,
        card.clientWidth / 2 + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
        card,
        wrap
      );
    },
    [animationHandlers, mobileTiltSensitivity]
  );

  useEffect(() => {
    if (!enableTilt || !animationHandlers) return;

    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap) return;

    const pointerMoveHandler = handlePointerMove;
    const pointerEnterHandler = handlePointerEnter;
    const pointerLeaveHandler = handlePointerLeave;
    const deviceOrientationHandler = handleDeviceOrientation;

    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== 'https:') return;
      if (typeof (window as any).DeviceMotionEvent?.requestPermission === 'function') {
        (window as any).DeviceMotionEvent
          .requestPermission()
          .then((state: string) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', deviceOrientationHandler);
            }
          })
          .catch((err: any) => console.error(err));
      } else {
        window.addEventListener('deviceorientation', deviceOrientationHandler);
      }
    };

    card.addEventListener("pointerenter", pointerEnterHandler as any);
    card.addEventListener("pointermove", pointerMoveHandler as any);
    card.addEventListener("pointerleave", pointerLeaveHandler as any);
    card.addEventListener("click", handleClick);

    const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;

    animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
    animationHandlers.createSmoothAnimation(
      ANIMATION_CONFIG.INITIAL_DURATION,
      initialX,
      initialY,
      card,
      wrap
    );

    return () => {
      card.removeEventListener("pointerenter", pointerEnterHandler as any);
      card.removeEventListener("pointermove", pointerMoveHandler as any);
      card.removeEventListener("pointerleave", pointerLeaveHandler as any);
      card.removeEventListener("click", handleClick);
      window.removeEventListener('deviceorientation', deviceOrientationHandler);
      animationHandlers.cancelAnimation();
    };
  }, [
    enableTilt,
    enableMobileTilt,
    animationHandlers,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handleDeviceOrientation,
  ]);

  const cardStyle = useMemo(
    () =>
    ({
      "--icon": iconUrl ? `url(${iconUrl})` : "none",
      "--grain": grainUrl ? `url(${grainUrl})` : "none",
      "--behind-gradient": showBehindGradient
        ? (behindGradient ?? DEFAULT_BEHIND_GRADIENT)
        : "none",
      "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
    } as React.CSSProperties),
    [iconUrl, grainUrl, showBehindGradient, behindGradient, innerGradient]
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div
      ref={wrapRef}
      className={`pc-card-wrapper ${className}`.trim()}
      style={cardStyle}
    >
      <section ref={cardRef} className="pc-card">
        <div className="pc-inside">
          {/* Removed all front light effects (pc-shine & pc-glare) */}
          
          {/* User Profile Section */}
          <div className="pc-content pc-profile-section">
            <div className="pc-avatar-container">
              {profile?.basename && !profile?.basenameAvatar ? (
                <div className="relative inline-block">
                  <OnchainAvatar address={address as `0x${string}`} chain={base} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-white text-[10px] leading-none">✓</span>
                  </div>
                </div>
              ) : (
                <UserAvatar
                  src={profile?.basename ? (profile?.basenameAvatar || profile?.avatar) : profile?.avatar || ''}
                  alt="Profile"
                  size={90}
                  showStatusDot={false}
                  showBasenameBadge={!!profile?.basename}
                />
              )}
            </div>
            
            <div className="pc-user-name">
              {displayName}
            </div>
          </div>

          {/* Score Section */}
          <div className="pc-content pc-score-section">
            <h3 className="pc-score-title">Last Score</h3>
            
            <div className="pc-score-item">
              <span className="pc-score-label">Total Score:</span>
              <span className={`pc-score-value ${getScoreColor(totalScore)}`}>
                {totalScore}
              </span>
            </div>
            
                         <div className="pc-score-item">
               <span className="pc-score-label">Base Score:</span>
               <span className={`pc-score-value ${getScoreColor(baseScore)}`}>
                 {baseScore}
               </span>
             </div>
             
             <div className="pc-score-item">
               <span className="pc-score-label">Security Score:</span>
               <span className={`pc-score-value ${getScoreColor(securityScore)}`}>
                 {securityScore}
               </span>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);

export default ProfileCard;
