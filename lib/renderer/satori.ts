import satori from 'satori'
import { loadFont } from './fonts'

export async function jsxToSvg(
  element: React.ReactNode,
  width: number,
  height: number,
): Promise<string> {
  const font = loadFont()

  return satori(element, {
    width,
    height,
    fonts: [
      {
        name: 'Inter',
        data: font,
        weight: 400,
        style: 'normal',
      },
    ],
  })
}
