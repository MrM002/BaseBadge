'use client'

interface HighlightBaseProps {
  text: string
  className?: string
}

// Renders the word "Base" inside the provided text in blue, preserving other content
export default function HighlightBase({ text, className }: HighlightBaseProps) {
  const parts = text.split(/(Base)/g)
  return (
    <span className={className}>
      {parts.map((p, i) => p === 'Base' ? (
        <span key={i} className="text-gamefi-blue">Base</span>
      ) : (
        <span key={i}>{p}</span>
      ))}
    </span>
  )
}


