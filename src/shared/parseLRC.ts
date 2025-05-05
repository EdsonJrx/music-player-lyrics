// src/lib/parseLRC.ts
interface LrcLine {
  time: number // em segundos
  text: string
}

export function parseLRC(lrc: string): LrcLine[] {
  const lines = lrc.split('\n')
  const result: LrcLine[] = []

  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)](.*)/)
    if (!match) continue

    const [, min, sec, text] = match
    const time = parseInt(min) * 60 + parseFloat(sec) - 1 // Adiciona 50ms para evitar que a letra apareça antes do tempo
    result.push({ time, text: text.trim() })
  }

  return result
}
