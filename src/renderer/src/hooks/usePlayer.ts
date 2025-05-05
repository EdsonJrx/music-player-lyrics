import { useEffect, useState } from 'react'

export interface PlayerData {
  id: number
  name: string
  title: string
  artist: string
  album: string
  cover: string
  state: number
  position: number
  duration: number
  volume: number
  repeat: number
  shuffle: boolean
  rating: number
}

export function usePlayer(): PlayerData {
  const [player, setPlayer] = useState<PlayerData | null>(null)

  useEffect(() => {
    let ws: WebSocket

    function connect() {
      ws = new WebSocket('ws://localhost:17070')

      ws.onopen = () => {
        console.log('🟢 Conectado ao servidor socket')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data?.id !== undefined) {
            setPlayer(data)
          }
        } catch (err) {
          console.error('❌ Erro ao parsear dados do player:', err)
        }
      }

      ws.onclose = () => {
        console.warn('🔌 Conexão WebSocket encerrada. Tentando reconectar...')
        setTimeout(connect, 3000)
      }

      ws.onerror = (error) => {
        console.error('🔴 Erro na conexão WebSocket:', error)
        ws.close()
      }
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [])

  const fallback: PlayerData = {
    id: -1,
    name: '',
    title: '',
    artist: '',
    album: '',
    cover: '',
    state: 0,
    position: 0,
    duration: 1,
    volume: 0,
    repeat: 0,
    shuffle: false,
    rating: 0
  }

  return player ?? fallback
}
