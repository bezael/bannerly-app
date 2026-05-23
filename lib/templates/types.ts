export interface Template {
  id: string
  user_id: string | null
  template_uid: string       // identificador único por usuario, ej. "og-basic"
  name: string
  width: number
  height: number
  jsx_code: string           // JSX como string con placeholders {{fieldName}}
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateTemplateInput {
  template_uid: string
  name: string
  width?: number
  height?: number
  jsx_code: string
}

// Modification recibida por el endpoint POST /api/v1/images
export interface Modification {
  name: string
  text?: string
  image_url?: string
}
