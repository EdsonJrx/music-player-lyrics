const path = require('node:path')
const addon = require(path.join(__dirname, 'native', 'build', 'Release', 'addon.node'))

addon.wnpInit()

console.log('⏳ Aguardando player...')

const interval = setInterval(() => {
  const result = addon.getActivePlayer()
  console.log('🎧 Player:', result)

  if (result && result.id !== -1 && result.title) {
    console.log('✅ Player detectado com sucesso!')
  }
}, 1000)

setTimeout(() => {
  clearInterval(interval)
  addon.wnpUninit()
  console.log('🛑 Finalizado.')
  process.exit()
}, 10000) // aguarda 10 segundos
