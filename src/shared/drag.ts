// Tipagem para window.context
interface WindowContext {
  invoke: <T = unknown>(channel: string, data?: unknown) => Promise<T>
  minimize: () => void
  maximize: () => void
  close: () => void
  openSettings: () => void
}

// Faz o TypeScript entender que window.context existe
declare global {
  interface Window {
    context: WindowContext
  }
}

// Constantes
const pointermove = 'pointermove'
const IGNORE = new Set(['SELECT', 'BUTTON', 'A', 'INPUT', 'TEXTAREA'])

// Função auxiliar para adicionar e remover eventos
function $on<K extends keyof HTMLElementEventMap>(
  elem: HTMLElement,
  dict: Partial<Record<K, (e: HTMLElementEventMap[K]) => void>>
) {
  for (const [event, func] of Object.entries(dict)) {
    elem.addEventListener(event as K, func as EventListener)
  }
  return () => {
    for (const [event, func] of Object.entries(dict)) {
      elem.removeEventListener(event as K, func as EventListener)
    }
  }
}

// Tipagem para a posição e tamanho da janela
interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

// Função principal de habilitar o drag manual
export function enableDrag(elem: HTMLElement) {
  let moving = false

  let init_x = 0
  let init_y = 0
  let init_left = 0
  let init_top = 0
  let init_w = 0
  let init_h = 0

  async function _move(e: PointerEvent) {
    const { screenX, screenY } = e
    await window.context.invoke('drag.setBounds', {
      x: Math.round(screenX - init_x + init_left),
      y: Math.round(screenY - init_y + init_top),
      width: init_w,
      height: init_h
    })
  }

  async function down(e: PointerEvent) {
    if (moving) return
    if (e.button !== 0) return // Apenas botão esquerdo

    let p: HTMLElement | null = e.target as HTMLElement
    while (p) {
      const nodeName = p.nodeName
      if (IGNORE.has(nodeName)) return
      if (nodeName === 'BODY') break
      p = p.parentElement
    }

    moving = true

    const bounds = await window.context.invoke<Bounds>('drag.getBounds')
    init_left = bounds.x
    init_top = bounds.y
    init_w = bounds.width
    init_h = bounds.height
    init_x = e.screenX
    init_y = e.screenY

    elem.setPointerCapture(e.pointerId)
    elem.addEventListener(pointermove, _move)
  }

  async function up(e: PointerEvent) {
    if (moving) {
      await _move(e)
      elem.releasePointerCapture(e.pointerId)
      elem.removeEventListener(pointermove, _move)
      moving = false
    }
  }

  $on(elem, {
    lostpointercapture: up,
    pointercancel: up,
    pointerdown: down,
    pointerup: up
  })
}
