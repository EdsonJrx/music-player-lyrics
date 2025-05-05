import { usePlayer } from '@/hooks/usePlayer'
import { usePlayerControl } from '@/hooks/usePlayerControl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaBackwardStep, FaForwardStep, FaPause, FaPlay } from 'react-icons/fa6'
import { LuRepeat, LuRepeat1 } from 'react-icons/lu'
import MusicProgressBar from '../MusicProgressBar'

export default function Footer() {
  const player = usePlayer()
  const control = usePlayerControl()

  const [currentTime, setCurrentTime] = useState(0)
  const seekTarget = useRef<number | null>(null)
  const validRepeat = [0, 1, 2].includes(player.repeat) ? player.repeat : 0

  /* ---------- Sincroniza posição ---------- */
  useEffect(() => {
    if (seekTarget.current !== null) {
      const diff = Math.abs(player.position - seekTarget.current)
      if (diff <= 1) {
        seekTarget.current = null
        setCurrentTime(player.position)
        return
      }
    }
    setCurrentTime(player.position)
  }, [player.position])

  /* ---------- Clique na barra ---------- */
  const handleSeek = (sec: number) => {
    const s = Math.floor(sec)
    seekTarget.current = s
    control.setSeek(s)
    setCurrentTime(s)
  }

  /* ---------- Helpers mm:ss ---------- */
  const valCurrentTime = useMemo(() => {
    const m = Math.floor(currentTime / 60)
    const s = String(Math.floor(currentTime % 60)).padStart(2, '0')
    return `${m}:${s}`
  }, [currentTime])

  const totalTime = useMemo(() => {
    const m = Math.floor(player.duration / 60)
    const s = String(Math.floor(player.duration % 60)).padStart(2, '0')
    return `${m}:${s}`
  }, [player.duration])

  /* ---------- Estilos reutilizáveis ---------- */
  const iconBtn =
    'w-6 h-6 grid place-items-center transform-gpu transition-transform ease-[cubic-bezier(.25,.8,.5,1)] duration-150 hover:scale-125'
  const playBtn =
    'w-12 h-12 grid place-items-center bg-white text-black rounded-full transform-gpu transition-transform ease-[cubic-bezier(.25,.8,.5,1)] duration-150 hover:scale-110'

  return (
    <footer
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        w-[calc(100%-2rem)] max-w-xl
        px-6 py-4 flex flex-col gap-4 items-stretch
        opacity-0 translate-y-4
        group-hover:opacity-100 group-hover:translate-y-0
        transition-all duration-300 ease-in-out
        z-50
        rounded-2xl backdrop-blur-sm backdrop-saturate-150 border border-white/40
      "
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* camada de vidro */}
      <div
        className="
          absolute inset-0 -z-10 rounded-2xl
          bg-gradient-to-tr from-white/30 via-white/15 to-white/5
          shadow-[0_2px_10px_rgba(0,0,0,0.25)]
        "
      />

      {/* Controles de reprodução */}
      <div className="flex items-center justify-center gap-12">
        <button onClick={control.previous} className={iconBtn}>
          <FaBackwardStep className="text-white" />
        </button>

        <button onClick={control.playPause} className={playBtn}>
          {player.state === 0 ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={control.next} className={iconBtn}>
          <FaForwardStep className="text-white" />
        </button>

        <button
          onClick={() => control.setRepeat(((validRepeat + 1) % 3) as 0 | 1 | 2)}
          className={iconBtn}
        >
          {validRepeat === 1 ? (
            <LuRepeat className="text-[#949494]" />
          ) : validRepeat === 0 ? (
            <LuRepeat1 className="text-[#3be477]" />
          ) : (
            <LuRepeat className="text-[#3be477]" />
          )}
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="-mt-1">
        <MusicProgressBar
          currentTime={currentTime}
          duration={player.duration}
          onSeek={handleSeek}
        />
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{valCurrentTime}</span>
          <span>{totalTime}</span>
        </div>
      </div>
    </footer>
  )
}
