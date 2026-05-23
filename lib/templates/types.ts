export type LayerType = 'text' | 'image'

export interface TextLayer {
  type: 'text'
  name: string
  defaultText: string
  x: number
  y: number
  fontSize: number
  color: string
}

export interface ImageLayer {
  type: 'image'
  name: string
  defaultUrl: string
  x: number
  y: number
  width: number
  height: number
}

export type Layer = TextLayer | ImageLayer

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
  updated_at?: string
}

export interface CreateTemplateInput {
  slug: string
  name: string
  layout_id: string
  width?: number
  height?: number
  layers?: Layer[]
}

export interface UpdateTemplateInput {
  name?: string
  width?: number
  height?: number
  layers?: Layer[]
}

export interface Modification {
  name: string
  text?: string
  image_url?: string
}
