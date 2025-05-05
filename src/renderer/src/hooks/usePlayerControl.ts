let socket: WebSocket | null = null

export function usePlayerControl() {
  if (!socket) {
    socket = new WebSocket('ws://localhost:17070')
    socket.onopen = () => console.log('🟢 Socket conectado')
  }

  function send(action: string, payload?: any) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'action', action, payload }))
    } else {
      console.warn('⚠️ Socket não conectado')
    }
  }

  return {
    playPause: () => send('playPause'),
    next: () => send('next'),
    previous: () => send('previous'),
    setSeek: (s: number) => send('seek', s),
    setVolume: (v: number) => send('volume', v),
    setRating: (v: number) => send('rating', v),

    /* repeat */
    setRepeat: (mode: 0 | 1 | 2) => send('repeat', mode),
    repeatNext: () => send('repeatNext'),

    /* shuffle */
    toggleShuffle: () => send('shuffle')
  }
}
