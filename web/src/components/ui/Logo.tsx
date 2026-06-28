'use client';

import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: 32, text: 'text-sm' },
  md: { img: 48, text: 'text-base' },
  lg: { img: 72, text: 'text-lg' },
  xl: { img: 120, text: 'text-xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt={APP_NAME}
        width={s.img}
        height={s.img}
        className="object-contain"
        priority
      />
      {showText && (
        <div className={`text-center font-extrabold text-brand-primary leading-tight tracking-wide ${s.text}`}>
          <div>DIGITALIZED</div>
          <div>PLANTATION</div>
        </div>
      )}
    </div>
  );
}

export function LogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/logo.png" alt={APP_NAME} width={36} height={36} className="object-contain" />
      <span className="font-bold text-white text-sm leading-tight hidden lg:block">
        DIGITALIZED<br />PLANTATION
      </span>
    </div>
  );
}
