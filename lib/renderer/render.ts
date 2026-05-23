import { createElement } from 'react'
import { transform } from 'sucrase'
import { jsxToSvg } from './satori'
import { svgToPng } from './resvg'
import type { Modification } from '@/lib/templates/types'

function applyModifications(jsxCode: string, modifications: Modification[]): string {
  let result = jsxCode
  for (const mod of modifications) {
    const value = mod.text ?? mod.image_url ?? ''
    result = result.replaceAll(`{{${mod.name}}}`, value)
  }
  return result
}

function jsxStringToElement(jsxCode: string): React.ReactNode {
  const { code } = transform(`const __el = (${jsxCode}); __el`, {
    transforms: ['jsx'],
    jsxPragma: 'createElement',
    jsxFragmentPragma: 'null',
    production: true,
  })

  const fn = new Function('createElement', `${code}; return __el`)
  return fn(createElement)
}

export async function renderTemplate(
  jsxCode: string,
  modifications: Modification[],
  width: number,
  height: number,
): Promise<Buffer> {
  const resolvedCode = applyModifications(jsxCode, modifications)
  const element = jsxStringToElement(resolvedCode)
  const svg = await jsxToSvg(element, width, height)
  return svgToPng(svg)
}

export async function renderLayout(
  element: React.ReactNode,
  width: number,
  height: number,
): Promise<Buffer> {
  const svg = await jsxToSvg(element, width, height)
  return svgToPng(svg)
}
