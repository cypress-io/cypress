import './drawRect.css'

interface Options {
  height?: number
  width?: number
}

// ref: https://codepen.io/w2sw2sw2s/pen/VLKEdq
export const drwaRect = (el: string, { height, width }: Options = { height: 500, width: 500 }) => {
  const elm = document.querySelector(el)
  if (!elm) {
    throw Error(`Could not find an element matching ${el}`)
  }

  const canvas = document.createElement('canvas')
  canvas.id = 'canvas'
  const tempCanvas = document.createElement('canvas')
  tempCanvas.id = 'canvas2'
  elm.appendChild(canvas)
  elm.appendChild(tempCanvas)

  let dragging = false
  let startX: number
  let startY: number
  let mouseX: number
  let mouseY: number
  const boundingRect = canvas.getBoundingClientRect()
  const offsetX = boundingRect.x
  const offsetY = boundingRect.y
  const ctx = canvas.getContext('2d')
  const tempCtx = tempCanvas.getContext('2d')
  tempCanvas.style.left = '-500px'

  const draw = (toX: number, toY: number, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    console.log(startX, startY, toX - startX, toY - startY)
    ctx.rect(startX, startY, toX - startX, toY - startY)
    ctx.stroke()
  }

  const drawPoint = (e: MouseEvent) => {
    if (!dragging) {
      return
    }
    console.log('drawing')
    mouseX = e.clientX - offsetX
    mouseY = e.clientY - offsetY
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    draw(mouseX, mouseY, tempCtx)
  }

  const startDrawing = (e: MouseEvent) => {
    mouseX = e.clientX - offsetX
    mouseY = e.clientY - offsetY
    startX = mouseX
    startY = mouseY
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCanvas.style.left = '0px'
    tempCanvas.style.top = '0px'
    dragging = true
  }

  const stopDrawing = (e: MouseEvent) => {
    mouseX = e.clientX - offsetX
    mouseY = e.clientY - offsetY
    dragging = false
    tempCanvas.style.left = '-500px'
    console.log('stop')
    draw(mouseX, mouseY, ctx)
  }

  canvas.addEventListener('mousedown', startDrawing)
  tempCanvas.addEventListener('mousemove', drawPoint)
  tempCanvas.addEventListener('mouseup', stopDrawing)
}
