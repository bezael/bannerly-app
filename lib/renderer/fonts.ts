import fs from 'fs'
import path from 'path'

export function loadFont(): ArrayBuffer {
  // @fontsource/inter ships WOFF which Satori's opentype.js parser supports
  const fontPath = path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'inter',
    'files',
    'inter-latin-400-normal.woff',
  )
  const buffer = fs.readFileSync(fontPath)
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}
