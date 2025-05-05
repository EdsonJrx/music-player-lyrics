// test-wnp.js
const path = require('node:path')

// Corrija o caminho se seu addon estiver noutro lugar
const addon = require(path.join(__dirname, 'native', 'build', 'Release', 'addon.node'))

// Acrescente a pasta atual ao PATH para o Windows achar libwnp.dll
process.env.PATH = `${__dirname};${process.env.PATH}`

const ret = addon.wnpInit()
console.log('Init return:', ret) // 0 = OK

function logPlayer() {
  console.clear()
  console.log('Active player:', addon.getActivePlayer())
}

logPlayer()
setInterval(logPlayer, 1000) // mostra a cada segundo

process.on('SIGINT', () => {
  // Ctrl+C
  addon.wnpUninit()
  console.log('\nUninit done.')
  process.exit()
})
