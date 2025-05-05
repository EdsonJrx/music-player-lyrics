// ✅ preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
  contextBridge.exposeInMainWorld('context', {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
  })
} catch (error) {
  console.error(error)
}
