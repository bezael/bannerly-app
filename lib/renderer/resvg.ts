import { Resvg } from '@resvg/resvg-js'

export function svgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}
