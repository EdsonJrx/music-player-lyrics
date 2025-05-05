import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Menu, nativeImage, protocol, shell, Tray } from 'electron'
import { readFile } from 'fs/promises'
import mime from 'mime-types' // ✅ compatível com CommonJS
import fetch from 'node-fetch'
import { join } from 'node:path'
import { startSimple, stopSimple } from './simple-runner'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuiting = false

const RESOURCES_PATH = app.isPackaged
  ? join(process.resourcesPath)
  : join(__dirname, '../../resources')

// ─── Cria a janela principal ─────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    center: true,
    title: 'Music Player Lyrics',
    frame: false,
    show: false,
    resizable: true,
    transparent: true,
    thickFrame: false,
    hasShadow: false,
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

// ─── Tray ─────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = join(RESOURCES_PATH, 'tray.png')
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

// ─── IPC (atalhos da sua UI) ──────────────────────────────────────────
function registerIpcEvents() {
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () =>
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()
  )
  ipcMain.on('window:close', () => mainWindow?.hide())
  ipcMain.on('app:settings', () => console.log('Abrir configurações'))
}

ipcMain.handle('drag.getBounds', (e) => BrowserWindow.fromWebContents(e.sender)!.getBounds())
ipcMain.handle('drag.setBounds', (e, b) =>
  BrowserWindow.fromWebContents(e.sender)!.setBounds({
    ...b,
    x: Math.round(b.x),
    y: Math.round(b.y)
  })
)
ipcMain.handle('fetch-lyrics', async (_e, { artist, title }) => {
  try {
    const query = `track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
    const searchRes = await fetch(`https://lrclib.net/api/search?${query}`)
    const searchData = await searchRes.json()
    const match = searchData[0]

    if (!match?.id) return null

    const lrcRes = await fetch(`https://lrclib.net/api/get/${match.id}`)
    const lrcData = await lrcRes.json()
    return lrcData?.syncedLyrics ?? null
  } catch (err) {
    console.error('Erro ao buscar letras:', err)
    return null
  }
})

// ─── Ciclo de vida do app ─────────────────────────────────────────────
app.whenReady().then(() => {
  // 🔐 Protocolo seguro para imagens
  protocol.registerBufferProtocol('app', async (request, respond) => {
    try {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.pathname)
      const data = await readFile(filePath)

      respond({
        mimeType: mime.lookup(filePath) || 'application/octet-stream',
        data
      })
    } catch (err) {
      console.error('Erro ao servir imagem:', err)
      respond({ statusCode: 404 })
    }
  })

  startSimple()
  createWindow()

  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, win) => optimizer.watchWindowShortcuts(win))
  registerIpcEvents()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  isQuiting = true
  stopSimple()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
