// addon-server.js
const { WebSocketServer } = require('ws')
const path = require('node:path')

const isDev = process.env.ADDON_DEV === '1' // ← usa flag passada
const addonPath = isDev
  ? path.join(__dirname, 'native', 'build', 'Release', 'addon.node')
  : path.join(process.resourcesPath, 'addon.node')

console.log('[addon-server] usando', addonPath)

const addon = require(addonPath) // ← se falhar, verá o erro no console
addon.wnpInit()

/* ─────────── servidor WS ─────────── */
const wss = new WebSocketServer({ port: 17070 }, () =>
  console.log('🚀  WS servidor na porta 17070')
)

wss.on('connection', (ws) => {
  console.log('📡  Cliente conectado')

  /* envia o player ativo a cada segundo */
  const interval = setInterval(() => {
    try {
      const data = addon.getActivePlayer()
      if (data?.id !== -1) ws.send(JSON.stringify(data))
    } catch (err) {
      console.error('🚨  Erro ao enviar dados:', err)
    }
  }, 1000)

  /* trata ações recebidas do front‑end */
  ws.on('message', (msg) => {
    try {
      const { type, action, payload } = JSON.parse(msg)
      if (type !== 'action') return

      switch (action) {
        /* —— controles sem parâmetro —— */
        case 'playPause':
          addon.tryPlayPause()
          break
        case 'next':
          addon.tryNext()
          break
        case 'previous':
          addon.tryPrevious()
          break
        case 'shuffle':
          addon.toggleShuffle()
          break

        /* —— controles com valor numérico —— */
        case 'seek': {
          const secs = Math.max(0, Math.floor(payload ?? 0))
          console.log('🎯  seek →', secs, 's')
          addon.trySeek(secs)
          break
        }
        case 'volume':
          addon.tryVolume(Math.max(0, Math.min(100, payload)))
          break
        case 'rating':
          addon.tryRating(payload)
          break
        case 'repeat': {
          // <-- adiciona de volta
          const mode = Number(payload) // 0 | 1 | 2
          addon.setRepeat(mode)
          console.log('🔁 repeat =', mode)
          break
        }

        default:
          console.warn('⚠️  Ação desconhecida:', action)
      }
    } catch (err) {
      console.error('❌  Erro ao processar mensagem:', err)
    }
  })

  /* limpeza */
  ws.on('close', () => {
    clearInterval(interval)
    console.log('❌  Cliente OFF')
  })
  ws.on('error', (e) => console.error('🔌  WS erro:', e.message))
})

/* encerra graciosa­mente */
process.on('SIGINT', () => {
  console.log('\n⏹  Encerrando…')
  addon.wnpUninit()
  wss.close(() => process.exit())
})
