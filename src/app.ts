import "./styles/index.scss"
import { getNumericValue, getSelectedRadioButton, setInputValue } from "./utility"
import { PipeOnPole } from "./pipeonpole"
import { HotModuleReplacementPlugin } from "webpack"
import { PoPsolution } from "./popsolution"

const canvas = <HTMLCanvasElement>document.getElementById("myCanvas")
const calculationOutput = <HTMLTextAreaElement>document.getElementById("calculation-output")
const cbAutoScale = <HTMLInputElement>document.getElementById("cbAutoScale")
const cbMoment = <HTMLInputElement>document.getElementById("cbMoment")
const cbInclinate = <HTMLInputElement>document.getElementById("cbInclinate")

let pop = new PipeOnPole()
let xmin: number = 0
let xmax: number = 0

function initDefaultValues(): void {
  pop.useTestValues()
  setInputValue("edtC", pop.c)
  setInputValue("edtD", pop.d)
  setInputValue("edtE", pop.E * 1e-9)
  setInputValue("edtT", pop.T * 1e-6)
  setInputValue("edtH", pop.h)
  setInputValue("edtJ", pop.j)
  setInputValue("edtL", pop.l)
  setInputValue("edtP", (pop.p * 180) / Math.PI)
  setInputValue("edtR", pop.r)
  setInputValue("edtW", pop.w)
  document.querySelectorAll("input").forEach((item) => {
    item.addEventListener("change", update)
  })
}

function GetInputValues(): void {
  pop.c = getNumericValue("edtC")
  pop.d = getNumericValue("edtD")
  pop.E = getNumericValue("edtE") * 1e9
  pop.T = getNumericValue("edtT") * 1e6
  pop.h = getNumericValue("edtH")
  pop.j = getNumericValue("edtJ")
  pop.l = getNumericValue("edtL")
  pop.p = (getNumericValue("edtP") * Math.PI) / 180
  pop.r = getNumericValue("edtR")
  pop.w = getNumericValue("edtW")
}

function draw(): void {
  let GGs = pop.Solution
  if (isNaN(GGs.x1) || isNaN(GGs.x2)) return

  if (xmin === 0 || xmax === 0 || cbAutoScale.checked) {
    xmin = Math.min(-1, Math.floor(GGs.xo))
    xmax = Math.max(1, Math.ceil(GGs.xe))
  }

  let margin: number = 18
  let nn = canvas.width / 2 - margin

  let xx: number[] = []
  let m: number[] = []
  let dy: number[] = []
  let y: number[] = []
  let pp: { x: number; y: number }[] = []

  for (let i = 0; i < nn; i++) {
    let tmp: number = xmin + ((i + 0.5) / nn) * (xmax - xmin)
    xx.push(tmp)
    m.push(GGs.m(tmp))
    dy.push(GGs.dy(tmp))
    y.push(GGs.y(tmp))
  }

  let h: number = canvas.height / 2 - margin
  let maxm: number = Math.max(...m.map((a) => Math.abs(a))) / h
  let maxd: number = Math.max(...dy.map((a) => Math.abs(a))) / h
  let maxy: number = Math.max(...y.map((a) => Math.abs(a))) / (canvas.height - 2 * margin)
  maxy = Math.min(2e-3, maxy)

  if (maxm === 0 || maxd === 0 || maxy === 0 || !isFinite(maxd)) return

  for (let i = 0; i < nn; i++) {
    pp.push({ x: margin + 2 * i, y: canvas.height / 2 - m[i] / maxm })
  }

  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawAxis(ctx, margin, canvas.width, canvas.height, Math.max(GGs.y0p, GGs.y0m) / maxy, cbMoment.checked || cbInclinate.checked)

  if (maxm !== 0 && cbMoment.checked) {
    drawMoments(ctx, pp)
  }
  if (maxd !== 0 && cbInclinate.checked) {
    for (let i = 0; i < pp.length; i++) {
      pp[i].y = canvas.height / 2 - dy[i] / maxd
    }
    drawAngles(ctx, pp)
  }
  if (maxy !== 0) {
    for (let i = 0; i < pp.length; i++) {
      pp[i].y = canvas.height - margin - y[i] / maxy
    }
    drawDisplacement(ctx, pp)
  }
  let imo = xx.findIndex((x) => x > GGs.xo)
  let idx = xx
    .slice()
    .reverse()
    .findIndex((x) => x < GGs.xe)
  let ime = idx >= 0 ? xx.length - 1 - idx : idx

  let pr = pp.slice(imo, ime)
  ctx.lineWidth = 2
  drawLines(ctx, pp, "green")
  console.log(GGs.xo, GGs.xe)

  if (pop.maxstress(GGs) > pop.T) {
    let mT: number = ((pop.T * pop.Iyy) / pop.d) * 2
    imo = m.findIndex((mm) => mm > mT)
    idx = m
      .slice()
      .reverse()
      .findIndex((mm) => mm > mT)
    ime = idx >= 0 ? xx.length - 1 - idx : idx
    pr = pp.slice(imo, ime)
    if (pr.length > 1) drawLines(ctx, pr, "red")
  }

  for (const key of GGs.dict2.keys()) {
    if (key < xmin) continue
    if (key > xmax) continue
    let ix = margin + ((key - xmin) / (xmax - xmin)) * (canvas.width - 2 * margin)
    let iy = canvas.height - margin - GGs.y(key) / maxy
    ctx.beginPath()
    ctx.strokeStyle = "green"
    ctx.arc(ix - 1.5, iy - 1.5, 3, 0, 2 * Math.PI)
    ctx.stroke()
  }
}

function drawAxis(
  ctx: CanvasRenderingContext2D,
  margin: number,
  width: number,
  height: number,
  yfactor: number,
  drawSubAxis: boolean = false
) {
  ctx.beginPath()
  ctx.strokeStyle = "black"
  ctx.lineWidth = 1.0
  ctx.moveTo(margin, height - margin)
  ctx.lineTo(width - margin, height - margin)
  ctx.moveTo(margin - (xmin / (xmax - xmin)) * (width - 2 * margin), height - margin)
  ctx.lineTo(margin - (xmin / (xmax - xmin)) * (width - 2 * margin), height - margin - yfactor)
  ctx.stroke()

  if (drawSubAxis) {
    ctx.beginPath()
    ctx.strokeStyle = "lightgray"
    ctx.moveTo(margin, height / 2)
    ctx.lineTo(width - margin, height / 2)
    ctx.stroke()
  }
  drawxAxisLabels(ctx, margin, canvas.width, canvas.height)
}
function drawxAxisLabels(ctx: CanvasRenderingContext2D, margin: number, width: number, height: number) {
  let ss = "0"
  let metrics = ctx.measureText(ss)
  let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  for (let x = xmin; x <= xmax; x += 1) {
    ss = x.toFixed(0)
    ctx.fillText(
      ss,
      margin + ((x - xmin) / (xmax - xmin)) * (width - 2 * margin) - metrics.width / 2,
      height - margin + actualHeight + 3
    )
  }
}
function drawMoments(ctx: CanvasRenderingContext2D, pp: { x: number; y: number }[]) {
  drawLines(ctx, pp, "gray")
}
function drawAngles(ctx: CanvasRenderingContext2D, pp: { x: number; y: number }[]) {
  drawLines(ctx, pp, "lightgreen")
}
function drawDisplacement(ctx: CanvasRenderingContext2D, pp: { x: number; y: number }[]) {
  drawLines(ctx, pp, "green")
}

function drawLines(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], clr: string) {
  ctx.beginPath()
  ctx.strokeStyle = clr
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
}

function update(): void {
  GetInputValues()
  if (pop.d <= 2 * pop.w) {
    calculationOutput.innerText = "Wanddikte of diameter incorrect"
    return
  }

  let r: boolean = pop.Calculate()

  if (r) {
    let sol = pop.Solution
    let ss = `Xo: ${sol.xo.toFixed(3)} m, Xe: ${sol.xe.toFixed(3)} m, Fp: ${(sol.fp * -1e-3).toFixed(2)} kN, Smax: ${(
      pop.maxstress(sol) * 1e-6
    ).toFixed(0)} `

    ss += "\r\n"
    sol.dict2.forEach((value, key) => {
      ss += `a[${key.toFixed(1)}] = ${((180 / Math.PI) * value).toFixed(1)}`
      ss += "\u00B0\r\n"
    })
    calculationOutput.innerText = ss
  } else {
    calculationOutput.innerText = "Geen oplossing gevonden"
  }
  draw()
}

initDefaultValues()
update()
