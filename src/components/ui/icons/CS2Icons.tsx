// CS2 Gaming Icons - Custom SVG components
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Crosshair Icon - Aim
export function CrosshairIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// Headshot Icon
export function HeadshotIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

// Grenade Icon - Utility
export function GrenadeIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="14" r="7" />
      <path d="M12 7V3" />
      <path d="M9 3h6" />
      <path d="M15 10l-3 4-3-4" />
    </svg>
  );
}

// Flash Icon
export function FlashIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M13 2L4.5 12.5h6l-1 9.5 8.5-11.5h-6l1-8.5z" />
    </svg>
  );
}

// Smoke Icon
export function SmokeIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Bomb Icon - T Side
export function BombIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="14" r="8" />
      <path d="M12 6V2" />
      <path d="M8 2l4 4 4-4" />
      <path d="M12 14l2-2" />
      <circle cx="12" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

// Defuse Icon - CT Side
export function DefuseIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  );
}

// Dollar Icon - Economy
export function EconomyIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M16 10c0-1.5-1.5-2-4-2s-4 .5-4 2 1.5 2 4 2 4 .5 4 2-1.5 2-4 2-4-.5-4-2" />
    </svg>
  );
}

// Clock Icon - Timing
export function TimingIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Brain Icon - Decision
export function DecisionIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
      <path d="M9 18v3" />
      <path d="M15 18v3" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M10 13a2 2 0 0 0 4 0" />
    </svg>
  );
}

// Map Icon - Positioning
export function MapIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

// Kill Icon
export function KillIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 2L2 6" />
      <path d="M22 18l-4 4" />
      <path d="M2 6l16 16" />
      <path d="M22 6L6 22" />
      <path d="M18 2l4 4" />
    </svg>
  );
}

// Death Icon (Skull)
export function DeathIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="10" r="8" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M9 14h6" />
      <path d="M10 14v2" />
      <path d="M14 14v2" />
    </svg>
  );
}

// Trophy Icon
export function TrophyIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// Rank Up Icon
export function RankUpIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 20V10" />
      <path d="M18 14l-6-6-6 6" />
      <path d="M18 8l-6-6-6 6" />
    </svg>
  );
}

// AK47 Icon
export function AK47Icon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M2 12h5l1-2h8l1 2h5v2H2v-2z" />
      <path d="M7 12V8h2v4" />
      <path d="M17 10h4v4h-4z" />
      <path d="M9 14h2v6H9z" />
    </svg>
  );
}

// AWP Icon
export function AWPIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M2 11h18v2H2z" />
      <path d="M20 10h2v4h-2z" />
      <circle cx="18" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M5 11V8h2v3" />
      <path d="M8 13h2v5H8z" />
    </svg>
  );
}

// Fire Icon - for streaks
export function FireIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2c-2 4-6 6-6 10a6 6 0 0 0 12 0c0-4-4-6-6-10z" />
      <path d="M12 12c-1 2-3 3-3 5a3 3 0 0 0 6 0c0-2-2-3-3-5z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// Star Icon
export function StarIcon({ size = 24, className = '', filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Shield Icon - for CT
export function ShieldIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// Sword Icon - for aggression
export function SwordIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  );
}

export const CS2Icons = {
  Crosshair: CrosshairIcon,
  Headshot: HeadshotIcon,
  Grenade: GrenadeIcon,
  Flash: FlashIcon,
  Smoke: SmokeIcon,
  Bomb: BombIcon,
  Defuse: DefuseIcon,
  Economy: EconomyIcon,
  Timing: TimingIcon,
  Decision: DecisionIcon,
  Map: MapIcon,
  Kill: KillIcon,
  Death: DeathIcon,
  Trophy: TrophyIcon,
  RankUp: RankUpIcon,
  AK47: AK47Icon,
  AWP: AWPIcon,
  Fire: FireIcon,
  Star: StarIcon,
  Shield: ShieldIcon,
  Sword: SwordIcon,
};