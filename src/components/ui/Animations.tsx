'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { CrosshairIcon } from './icons/CS2Icons';

// CS2 Themed Loading Spinner
interface CS2LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'crosshair' | 'ring' | 'dots';
}

export function CS2Loader({ size = 'md', text, variant = 'crosshair' }: CS2LoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cs2-accent"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`text-gray-400 ${textSizes[size]} animate-pulse`}>{text}</p>
        )}
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full border-2 border-gray-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cs2-accent animate-spin" />
        </div>
        {text && (
          <p className={`text-gray-400 ${textSizes[size]} animate-pulse`}>{text}</p>
        )}
      </div>
    );
  }

  // Crosshair variant (default)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <CrosshairIcon
          className="text-cs2-accent animate-spin-slow"
          size={size === 'sm' ? 24 : size === 'md' ? 40 : 64}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cs2-accent animate-pulse" />
        </div>
      </div>
      {text && (
        <p className={`text-gray-400 ${textSizes[size]} animate-pulse`}>{text}</p>
      )}
    </div>
  );
}

// Animated Number Counter
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  startOnView?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  startOnView = true,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) {
      animateValue();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          animateValue();
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated, startOnView]);

  const animateValue = () => {
    const start = 0;
    const end = value;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-expo)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(start + (end - start) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Circular Progress Ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showPercentage?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#ff6b00',
  bgColor = '#1f2937',
  showPercentage = true,
  className = '',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className="text-lg font-bold text-white">
            {Math.round(progress)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Gaming Toast Notification
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  icon?: ReactNode;
  duration?: number;
  onClose?: () => void;
}

const TOAST_STYLES = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    icon: 'ℹ',
  },
  achievement: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-400/50',
    text: 'text-amber-400',
    icon: '🏆',
  },
};

export function Toast({
  message,
  type = 'info',
  icon,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const styles = TOAST_STYLES[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-3
        px-4 py-3 rounded-xl
        ${styles.bg}
        border ${styles.border}
        shadow-lg
        ${isLeaving ? 'animate-fade-out' : 'animate-slide-in-right'}
        transition-all duration-300
      `}
    >
      <span className={`text-lg ${styles.text}`}>
        {icon || styles.icon}
      </span>
      <p className="text-white text-sm font-medium">{message}</p>
      {type === 'achievement' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  );
}

// Glow Wrapper Component
interface GlowWrapperProps {
  children: ReactNode;
  color?: 'accent' | 'ct' | 't' | 'win' | 'loss';
  intensity?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

const GLOW_COLORS = {
  accent: 'hover:shadow-glow-md',
  ct: 'hover:shadow-glow-ct',
  t: 'hover:shadow-glow-t',
  win: 'hover:shadow-glow-win',
  loss: 'hover:shadow-glow-loss',
};

export function GlowWrapper({
  children,
  color = 'accent',
  active = true,
  className = '',
}: GlowWrapperProps) {
  return (
    <div
      className={`
        transition-all duration-300
        ${active ? GLOW_COLORS[color] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Fade In View Component
interface FadeInViewProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeInView({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: FadeInViewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    none: '',
  };

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directionClasses[direction]}`}
        ${className}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Pulse Indicator (for live/active status)
interface PulseIndicatorProps {
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const PULSE_COLORS = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  accent: 'bg-cs2-accent',
};

export function PulseIndicator({
  color = 'green',
  size = 'md',
  label,
}: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full ${PULSE_COLORS[color]}`} />
        <div
          className={`
            absolute inset-0 rounded-full ${PULSE_COLORS[color]}
            animate-ping opacity-75
          `}
        />
      </div>
      {label && <span className="text-sm text-gray-400">{label}</span>}
    </div>
  );
}

// Typing Effect for Text
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  className = '',
  onComplete,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setIsTyping(true);
      let index = 0;

      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-cs2-accent animate-pulse ml-0.5" />
      )}
    </span>
  );
}

// Stagger Children Animation
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  className = '',
}: StaggerContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={`
                transition-all duration-500 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: `${index * staggerDelay}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

// Hover Tilt Card Effect
interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  scale?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 10,
  scale = 1.02,
  className = '',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * maxTilt;
    const tiltY = ((centerX - x) / centerX) * maxTilt;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Skeleton Loading Placeholder
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  rounded = 'md',
  className = '',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`
        bg-gray-700/50
        animate-pulse
        ${roundedClasses[rounded]}
        ${className}
      `}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Card Skeleton for Stats
export function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 space-y-3">
      <Skeleton width={80} height={14} />
      <Skeleton width={120} height={32} />
      <Skeleton width={60} height={12} />
    </div>
  );
}