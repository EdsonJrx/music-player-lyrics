import React, { useRef } from 'react'

interface MusicProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (newTime: number) => void
}

const MusicProgressBar: React.FC<MusicProgressBarProps> = ({ currentTime, duration, onSeek }) => {
  const barRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current || duration === 0) return

    const { left, width } = barRef.current.getBoundingClientRect()
    const percent = (e.clientX - left) / width
    const newTime = percent * duration

    onSeek(newTime)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={barRef}
      className="relative w-full h-2 rounded bg-[#949494]"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div
        className="h-full rounded bg-white hover:bg-[#3be477] transition-colors duration-200"
        style={{ width: `${progressPercent}%` }}
      />
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ pointerEvents: 'all', zIndex: 10 }}
        onPointerDown={handleSeek}
      />
    </div>
  )
}

export default MusicProgressBar
