// components/logo.tsx
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizes = {
  sm: { width: 32, height: 32, text: 'text-lg' },
  md: { width: 40, height: 40, text: 'text-xl' },
  lg: { width: 48, height: 48, text: 'text-2xl' }
};

export default function Logo({ 
  size = 'md', 
  showText = true, 
  href = '/',
  className = ''
}: LogoProps) {
  const { width, height, text } = sizes[size];
  
  const LogoContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect x="4" y="4" width="14" height="14" rx="2" fill="#2563EB"/>
        <rect x="22" y="4" width="14" height="14" rx="2" fill="#2563EB"/>
        <rect x="4" y="22" width="14" height="14" rx="2" fill="#2563EB"/>
        <rect x="22" y="22" width="14" height="14" rx="2" fill="#2563EB"/>
        <path d="M8 8L8 12L14 10L8 8Z" fill="white"/>
        <circle cx="29" cy="11" r="2" fill="white"/>
        <rect x="8" y="26" width="6" height="6" fill="white"/>
        <path d="M25 25L33 33M33 25L25 33" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      
      {showText && (
        <span className={`${text} font-bold text-gray-900`}>
          Budget Analyzer
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}