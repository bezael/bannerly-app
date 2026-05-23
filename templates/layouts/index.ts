import type { ComponentType } from 'react'
import type { Layer } from '@/lib/templates/types'
import OgBasic from './og-basic'

export interface LayoutProps {
  fields: Record<string, string>
  layers: Layer[]
}

export type LayoutComponent = ComponentType<LayoutProps>

const layouts: Record<string, LayoutComponent> = {
  'og-basic': OgBasic,
}

export function getLayout(layoutId: string): LayoutComponent | null {
  return layouts[layoutId] ?? null
}
