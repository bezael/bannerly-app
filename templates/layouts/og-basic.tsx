import type { LayoutProps } from './index'

export default function OgBasic({ fields }: LayoutProps) {
  const title = fields.title ?? 'Your title here'
  const subtitle = fields.subtitle ?? 'Your subtitle here'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#0f172a',
          lineHeight: 1.1,
          marginBottom: 32,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 36,
          fontWeight: 400,
          color: '#475569',
          lineHeight: 1.3,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
