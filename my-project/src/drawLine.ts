import './drawLine.css'

interface Options {
  height?: number
  width?: number
}

const createCanvas = (id: string) => {
  const canvas = document.createElement('canvas')
  canvas.id = id
  return canvas
}


const setContextStyle = (ctx: CanvasRenderingContext2D) => {
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'black'
}

// ref: https://codepen.io/w2sw2sw2s/pen/VLKEdq
export const drawLine = (el: string, { height, width }: Options = { height: 500, width: 500 }) => {
  const elm = document.querySelector(el)
  if (!elm) {
    throw Error(`Could not find an element matching ${el}`)
  }

  const mainCanvas = createCanvas('cy-draw__main--canvas')
  const tempCanvas = createCanvas('cy-draw__temp--canvas')
  tempCanvas.style.left = '-5000px'
  const tempCtx = tempCanvas.getContext('2d')
  setContextStyle(tempCtx)
  const mainCtx = mainCanvas.getContext('2d')
  setContextStyle(mainCtx)
  let drawing = false
  elm.appendChild(mainCanvas)
  elm.appendChild(tempCanvas)

  const ctx = tempCtx
  let points = []
  const pos = { x: 0, y: 0 }

  function onMouseMove(e: MouseEvent) {
    if (!drawing) {
      return
    }
    ctx.lineTo(e.clientX, e.clientY)
		ctx.stroke()
		ctx.beginPath()
    points.push({ x: e.clientX, y: e.clientY })
		ctx.fill()
		ctx.beginPath();
		ctx.moveTo(e.clientX, e.clientY);
  }


  const onMouseUp = (e: MouseEvent) => {
    drawing = false
    tempCanvas.style.left = '-5000px'
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    mainCtx.beginPath()
    tempCtx.beginPath()
    mainCtx.moveTo(points[0].x, points[0].y)

    for (const p in points) {
      const pp = points[p]
      mainCtx.lineTo(pp.x, pp.y)
      mainCtx.stroke()
      mainCtx.beginPath()
      mainCtx.fill()
      mainCtx.beginPath()
      mainCtx.moveTo(pp.x, pp.y)
      mainCtx.lineTo(pp.x, pp.y)
      mainCtx.stroke()
    }
    points = []
  }

  tempCanvas.addEventListener('mousemove', onMouseMove)
  tempCanvas.addEventListener('mouseup', onMouseUp)
  mainCanvas.addEventListener('mousedown', () => {
    tempCanvas.style.left = '0px'
    drawing = true
  })
}