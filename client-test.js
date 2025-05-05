const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:17070')

ws.on('open', () => {
  console.log('✅ Conectado ao servidor')
})

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString())
    if (parsed.type === 'player') {
      console.log('🎵 Player info:', parsed.payload)
    } else if (parsed.type === 'eventResult') {
      console.log(parsed.success ? '✅ Ação executada com sucesso' : '❌ Falha na ação')
    } else {
      console.log('📦 Dados desconhecidos:', parsed)
    }
  } catch (err) {
    console.error('Erro ao processar resposta:', err)
  }
})

ws.on('close', () => {
  console.log('🔌 Conexão encerrada')
})
