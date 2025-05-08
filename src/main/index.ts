/******************************************************************
 *  Processo principal do MPLyrics – inclui WebSocket + addon.node
 ******************************************************************/

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Menu, nativeImage, protocol, shell, Tray } from 'electron'
import { readFile } from 'fs/promises'
import mime from 'mime-types'
import fetch from 'node-fetch'
import { existsSync } from 'node:fs'
import path, { join } from 'node:path'
import { WebSocketServer } from 'ws'

/* ----------------------- Globals ----------------------- */
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuiting = false

const isDev = !app.isPackaged
const RESOURCES_PATH = isDev
  ? path.join(__dirname, '../../resources')
  : path.join(process.resourcesPath)

/* ------------------- Addon & WS ------------------------ */
function startAddonServer() {
  // carrega o módulo nativo
  const addonPath = isDev
    ? path.join(__dirname, 'addon.node') // dev: out/main/
    : path.join(process.resourcesPath, 'addon.node') // prod: resources/

  const addon = require(addonPath)
  addon.wnpInit()

  const wss = new WebSocketServer({ port: 17070 }, () =>
    console.log('🚀  WS servidor na porta 17070')
  )

  wss.on('connection', (ws) => {
    console.log('📡  Cliente conectado')

    const interval = setInterval(() => {
      try {
        const data = addon.getActivePlayer()
        if (data?.id !== -1) ws.send(JSON.stringify(data))
      } catch (err) {
        console.error('🚨  Erro ao enviar dados:', err)
      }
    }, 1000)

    ws.on('message', (msg) => {
      try {
        const { type, action, payload } = JSON.parse(msg.toString())
        if (type !== 'action') return

        switch (action) {
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
          case 'seek':
            addon.trySeek(Math.max(0, Math.floor(payload ?? 0)))
            break
          case 'volume':
            addon.tryVolume(Math.max(0, Math.min(100, payload)))
            break
          case 'rating':
            addon.tryRating(payload)
            break
          case 'repeat':
            addon.setRepeat(Number(payload))
            break
          default:
            console.warn('⚠️  Ação desconhecida:', action)
        }
      } catch (e) {
        console.error('❌  Erro mensagem WS:', e)
      }
    })

    ws.on('close', () => {
      clearInterval(interval)
      console.log('❌  Cliente OFF')
    })
  })

  app.on('before-quit', () => {
    addon.wnpUninit()
    wss.close()
  })
}

/* ----------------- Cria janela ------------------------- */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    center: true,
    title: 'MPLyrics',
    frame: false,
    show: false,
    resizable: true,
    transparent: true,
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (!isQuiting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createTray()
}

/* ----------------------- Tray -------------------------- */
function createTray() {
  const iconPath = path.join(RESOURCES_PATH, 'tray.png')

  if (!existsSync(iconPath)) {
    console.warn('⚠️  tray.png não encontrado em:', iconPath)
    return
  }

  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)
  tray.setToolTip('Music Player Lyrics')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow?.show() },
    {
      label: 'Sair',
      click: () => {
        isQuiting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => (mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()))
}

/* ---------------- IPC & Lyrics ------------------------ */
function registerIpc() {
  ipcMain.on('window:close', () => {
    // se quiser apenas esconder:
    mainWindow?.hide()
    // …ou, se preferir realmente fechar a janela:
    // mainWindow?.close()
  })
  /* ---- drag helpers (faltavam) ---- */
  ipcMain.handle('drag.getBounds', (e) => BrowserWindow.fromWebContents(e.sender)!.getBounds())

  ipcMain.handle('drag.setBounds', (e, bounds) =>
    BrowserWindow.fromWebContents(e.sender)!.setBounds({
      ...bounds,
      x: Math.round(bounds.x),
      y: Math.round(bounds.y)
    })
  )

  ipcMain.handle('fetch-lyrics', async (_e, { artist, title }) => {
    try {
      const query = `track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
      const [match] = await fetch(`https://lrclib.net/api/search?${query}`).then((r) => r.json())
      if (!match?.id) return null
      const lrcData = await fetch(`https://lrclib.net/api/get/${match.id}`).then((r) => r.json())
      return lrcData?.syncedLyrics ?? null
    } catch (err) {
      console.error('Erro ao buscar letras:', err)
      return null
    }
  })
}

/* --------------- App lifecycle ------------------------ */
app.whenReady().then(() => {
  startAddonServer()
  createWindow()
  registerIpc()

  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, win) => optimizer.watchWindowShortcuts(win))
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // protocolo seguro para imagens
  protocol.registerBufferProtocol('app', async (req, res) => {
    try {
      const filePath = decodeURIComponent(new URL(req.url).pathname)
      const data = await readFile(filePath)
      res({ mimeType: mime.lookup(filePath) || 'application/octet-stream', data })
    } catch {
      res({ statusCode: 404 })
    }
  })
})

app.on('before-quit', () => (isQuiting = true))
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
