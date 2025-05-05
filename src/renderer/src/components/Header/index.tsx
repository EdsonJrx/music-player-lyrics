import { usePlayer } from '@/hooks/usePlayer'
import { toAppProtocolPath } from '@renderer/utils/helper'
import { useEffect, useRef, useState } from 'react'
import { IoColorPalette, IoClose } from 'react-icons/io5'
import { FaTools } from "react-icons/fa";

export default function Header() {
  const ref = useRef<HTMLDivElement>(null)
  const player = usePlayer()
  const [coverSrc, setCoverSrc] = useState<string | null>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('contextmenu', (e) => e.preventDefault())
    }
  }, [])

  useEffect(() => {
    if (player?.cover?.startsWith('file://')) {
      setCoverSrc(toAppProtocolPath(player.cover))
    } else {
      setCoverSrc(null)
    }
  }, [player.cover])

  return (
    <div
      ref={ref}
      className="
    fixed top-0 left-0 w-full z-50
    flex items-center justify-between gap-4
    px-6 py-3
    bg-white/10
    backdrop-blur-sm
    backdrop-saturate-150
    rounded-t-xl
    border-b border-white/10
    opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
    transition-all duration-300 ease-in-out
  "
    >
      <div className="flex items-center gap-3 overflow-hidden max-w-[75%]">
        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
          {coverSrc ? (
            <img
              src={toAppProtocolPath(player.cover) + `?v=${player.id}-${player.title}`}
              alt="Capa do álbum"
              className="w-full h-full object-cover no-drag"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
        </div>

        <div className="flex flex-col leading-4 overflow-hidden">
          <span className="text-sm font-bold truncate">{player?.title || 'Sem música'}</span>
          <span className="text-xs truncate">{player?.artist || 'Desconhecido'}</span>
        </div>
      </div>

      <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.context.openSettings?.()}
          className="w-8 h-8 grid place-items-center rounded hover:bg-white/20"
        >
          <IoColorPalette />
        </button>
        <button
          onClick={() => window.context.openSettings?.()}
          className="w-8 h-8 grid place-items-center rounded hover:bg-white/20"
        >
          <FaTools />
        </button>
        <button
          onClick={() => window.context.close()}
          className="w-8 h-8 grid place-items-center rounded hover:bg-white/20"
        >
          <IoClose />
        </button>
      </div>
    </div>
  )
}
