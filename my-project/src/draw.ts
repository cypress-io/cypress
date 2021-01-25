interface Options {
  height?: number
  width?: number
}

// ref: https://codepen.io/w2sw2sw2s/pen/VLKEdq
export const cyDraw = (el: string, { height, width }: Options = { height: 500, width: 500 }) => {
  const elm = document.querySelector(el)
  if (!elm) {
    throw Error(`Could not find an element matching ${el}`)
  }

  const canvas = document.createElement('canvas')
  canvas.height = height
  canvas.width = width
  elm.replaceWith(canvas)

  const radius = 2
  const start = 0
  const end = Math.PI * 2
  let dragging = false

  const context = canvas.getContext('2d')
  context.lineWidth = radius * 2

  const drawPoint = (e: MouseEvent) => {
    if (!dragging) {
      return
    }
    
    // draw a line from x/y
    context.lineTo(e.offsetX, e.offsetY)
    
    // outline path with style
    context.stroke()

    // start a new path
    context.beginPath()

    // add circular arc to current path
    context.arc(e.offsetX, e.offsetY, radius, start, end)

    // fill the path
    context.fill()

    // start a new path
    context.beginPath()

    // move to next point
    context.moveTo(e.offsetX, e.offsetY)
  }

  const startDrawing = (e: MouseEvent) => {
    dragging = true
    drawPoint(e)
  }

  const stopDrawing = () => {
    dragging = false
    context.beginPath()
  }

  canvas.addEventListener('mousedown', startDrawing)
  canvas.addEventListener('mousemove', drawPoint)
  canvas.addEventListener('mouseup', stopDrawing)
}
