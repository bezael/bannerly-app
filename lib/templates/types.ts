export type LayerType = 'text' | 'image'

export interface LayerStyle {
  fontSize?: number
  color?: string
  x?: number
  y?: number
}

export interface Layer {
  name: string
  type: LayerType
  style?: LayerStyle
}

export interface Template {
  id: string
  slug: string
  name: string
  layout_id: string
  width: number
  height: number
  layers: Layer[]
  user_id: string
  created_at: string
}

export interface CreateTemplateInput {
  slug: string
  name: string
  layout_id: string
  width?: number
  height?: number
  layers?: Layer[]
}

export interface Modification {
  name: string
  text?: string
  image_url?: string
}
