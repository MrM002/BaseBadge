'use client'

import Image from 'next/image'

interface UserAvatarProps {
  src: string
  alt: string
  size?: number
  className?: string
  showSizeHint?: boolean
  showStatusDot?: boolean
  showBasenameBadge?: boolean
}

export function UserAvatar({ src, alt, size = 60, className = '', showSizeHint = false, showStatusDot = true, showBasenameBadge = false }: UserAvatarProps) {
  let finalSrc = src || '/default-avatar.svg'
  let useNativeImg = false

  // Handle ipfs:// URIs by rewriting to gateway URL and using native <img>
  if (finalSrc.startsWith('ipfs://')) {
    const cleaned = finalSrc.replace('ipfs://', '').replace(/^ipfs\//, '')
    finalSrc = `https://ipfs.io/ipfs/${cleaned}`
    useNativeImg = true
  }

  const isSVG = finalSrc.endsWith('.svg') || finalSrc.startsWith('data:image/svg')

  // Wrapper styles ensure perfect circle crop
  const wrapperStyle: React.CSSProperties = { width: `${size}px`, height: `${size}px` }
  const innerCircleClasses = `rounded-full overflow-hidden border-2 border-gamefi-yellow/50 w-full h-full`
  const sizeHint = showSizeHint ? (
    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
      {`${size} × ${size} px`}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
    </div>
  ) : null

  // Use native <img> for SVGs, gateway URLs, data URIs, or non-http sources to avoid next/image domain config
  if (useNativeImg || isSVG || !(finalSrc.startsWith('http://') || finalSrc.startsWith('https://') || finalSrc.startsWith('/'))) {
    return (
      <div className={`group relative inline-block ${className}`} style={wrapperStyle}>
        <div className={innerCircleClasses}>
          <img
            src={finalSrc}
            alt={alt}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg' }}
            className="w-full h-full object-cover"
          />
        </div>
        {sizeHint}
        {showStatusDot && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gamefi-black"></div>
        )}
        {showBasenameBadge && (
          <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-gamefi-black flex items-center justify-center shadow-md">
            <span className="text-white text-[10px] leading-none">✓</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`group relative inline-block ${className}`} style={wrapperStyle}>
      <div className={innerCircleClasses}>
        <Image
          src={finalSrc}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      {sizeHint}
      {showStatusDot && (
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gamefi-black"></div>
      )}
      {showBasenameBadge && (
        <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-gamefi-black flex items-center justify-center shadow-md">
          <span className="text-white text-[10px] leading-none">✓</span>
        </div>
      )}
    </div>
  )
}