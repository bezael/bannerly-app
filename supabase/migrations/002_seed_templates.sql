-- Seed templates (user_id = null = disponibles para todos los usuarios)
insert into public.templates (user_id, template_uid, name, width, height, jsx_code) values
(
  null,
  'tpl_og_basic',
  'OG Basic (1200×630)',
  1200,
  630,
  $jsx$
({ title, subtitle, badge, bgColor, accentColor, imageUrl }) => (
  <div style={{ width: 1200, height: 630, background: bgColor || "#1a1a2e", position: "relative", overflow: "hidden", fontFamily: "serif" }}>
    <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: accentColor || "#e94560", opacity: 0.85 }} />
    <div style={{ position: "absolute", bottom: -80, left: -80, width: 260, height: 260, borderRadius: "50%", background: accentColor || "#e94560", opacity: 0.25 }} />
    {imageUrl && <img src={imageUrl} style={{ position: "absolute", top: 60, right: 80, width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "6px solid white" }} />}
    <div style={{ position: "absolute", left: 80, top: 80, right: 80, bottom: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {badge && <div style={{ alignSelf: "flex-start", padding: "8px 18px", background: "rgba(0,0,0,0.85)", color: "white", fontSize: 16, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>{badge}</div>}
      <div style={{ fontSize: 84, lineHeight: 1.05, fontWeight: 900, color: "white", marginBottom: 24 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 28, color: "rgba(255,255,255,0.85)", maxWidth: 800, lineHeight: 1.3 }}>{subtitle}</div>}
    </div>
  </div>
)
$jsx$
),
(
  null,
  'tpl_og_wide',
  'OG Wide (1200×400)',
  1200,
  400,
  $jsx$
({ title, subtitle, badge, bgColor, accentColor }) => (
  <div style={{ width: 1200, height: 400, background: bgColor || "#0f172a", display: "flex", alignItems: "center", padding: "0 80px", gap: 48, fontFamily: "serif" }}>
    <div style={{ flex: 1 }}>
      {badge && <div style={{ display: "inline-block", padding: "6px 14px", background: accentColor || "#6366f1", color: "white", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24, borderRadius: 4 }}>{badge}</div>}
      <div style={{ fontSize: 64, fontWeight: 900, color: "white", lineHeight: 1.1, marginBottom: 16 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{subtitle}</div>}
    </div>
    <div style={{ width: 4, height: 200, background: accentColor || "#6366f1", borderRadius: 2 }} />
  </div>
)
$jsx$
);
