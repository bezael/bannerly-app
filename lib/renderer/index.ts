import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import * as React from 'react'

export async function renderTemplate(
  jsxCode: string,
  props: Record<string, unknown>,
  width: number,
  height: number
): Promise<Buffer> {
  const element = buildSatoriTree(jsxCode, props)
  const svg = await satori(element, { width, height, fonts: [] })
  return svgToPng(svg)
}

export function buildSatoriTree(
  jsxCode: string,
  props: Record<string, unknown>
): React.ReactElement {
  // jsxCode is stored as an arrow function: (props) => React.createElement(...)
  // We evaluate it with React in scope so createElement calls resolve correctly.
  // eslint-disable-next-line no-new-func
  const fn = new Function('React', `return (${jsxCode})`)(React)
  if (typeof fn !== 'function') {
    throw new Error('El jsx_code debe ser una función que retorne un elemento React')
  }
  return fn(props)
}

export function svgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg)
  const rendered = resvg.render()
  return Buffer.from(rendered.asPng())
}
