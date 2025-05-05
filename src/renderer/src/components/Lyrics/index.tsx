import { usePlayer } from '@/hooks/usePlayer'
import { fetchLyrics } from '@shared/fetchLyrics'
import { parseLRC } from '@shared/parseLRC'
import { useEffect, useMemo, useRef, useState } from 'react'

interface LrcLine {
  time: number
  text: string
}

const lyricCache = new Map<string, LrcLine[]>()

export default function Lyrics() {
  const player = usePlayer()
  const [lines, setLines] = useState<LrcLine[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  /* ---------- Busca / cache ---------- */
  useEffect(() => {
    const { artist, title } = player
    if (!artist || !title) return

    const key = `${artist}-${title}`.toLowerCase()
    if (lyricCache.has(key)) {
      setLines(lyricCache.get(key)!)
      setCurrentLine(0)
      return
    }

    fetchLyrics(artist, title).then((lrc) => {
      if (typeof lrc !== 'string' || !lrc) {
        setLines([])
        return
      }
      const parsed = parseLRC(lrc)
      lyricCache.set(key, parsed)
      setLines(parsed)
      setCurrentLine(0)
    })
  }, [player.artist, player.title]) // ← somente quando título ou artista muda

  /* ---------- Atualiza linha ativa ---------- */
  useEffect(() => {
    const i = lines.findLastIndex((l) => l.time <= player.position)
    setCurrentLine(i >= 0 ? i : 0)
  }, [player.position, lines])

  /* ---------- Scroll suave / centralizado ---------- */
  useEffect(() => {
    const node = lineRefs.current[currentLine]
    const container = containerRef.current
    if (!node || !container) return

    const nodeTop = node.offsetTop
    const nodeHeight = node.offsetHeight
    const containerHeight = container.clientHeight
    const scrollTop = container.scrollTop

    // posição da linha relativa ao topo visível
    const relative = nodeTop - scrollTop

    // se já está ~no meio (±25%), não scrolla
    if (relative > containerHeight * 0.35 && relative < containerHeight * 0.65) return

    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLine])

  /* ---------- Linha que será destacada ---------- */
  const renderLines = useMemo(
    () =>
      lines.map((line, idx) => {
        const active = idx === currentLine
        return (
          <div
            key={idx}
            ref={(el) => {
              lineRefs.current[idx] = el
            }}
            className={`transition-all duration-200 whitespace-pre-wrap
              ${active ? 'text-white text-6xl font-extrabold ' : 'text-white/40 text-2xl'}
            `}
          >
            {line.text || '\u00A0'}
          </div>
        )
      }),
    [lines, currentLine]
  )

  return (
    <div className="relative h-full flex items-center justify-center">
      {/* gradiente de fade topo / base */}
      <div className="pointer-events-none absolute inset-0 z-10" />

      {/* letras */}
      <div
        ref={containerRef}
        className="
          relative z-20
          h-[90%] w-full max-w-4xl
          mx-auto px-8
          flex flex-col items-center gap-8
          overflow-y-auto scrollbar-hide
          text-center leading-snug
        "
      >
        ...
        {renderLines}
        ...
      </div>
    </div>
  )
}
