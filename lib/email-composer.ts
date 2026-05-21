function renderList(items: string[]) {
  if (items.length === 0) return ''

  return `
    <ul style="margin:0;padding-left:20px;color:#3C3530;font-size:14px;line-height:1.7;">
      ${items.map((item) => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
    </ul>
  `
}

function renderInfoRows(rows: Array<{ label: string; value: string }>) {
  if (rows.length === 0) return ''

  return rows
    .map(
      (row) => `
        <div style="padding:14px 16px;border:1px solid rgba(213,195,182,0.18);border-radius:14px;background:#F8F2EC;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9C8578;margin-bottom:6px;">${row.label}</div>
          <div style="font-size:15px;color:#1C1917;font-weight:600;line-height:1.5;">${row.value}</div>
        </div>
      `
    )
    .join('')
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildBrandedEmailHtml(params: {
  preview: string
  title: string
  greeting?: string
  intro: string[]
  infoRows?: Array<{ label: string; value: string }>
  customContent?: string
  emphasisBlock?: {
    label?: string
    value: string
    hint?: string
  }
  bulletList?: string[]
  cta?: {
    label: string
    url: string
  }
  closing?: string[]
  footnote?: string
}) {
  const greeting = params.greeting ?? 'Hola,'
  const infoRows = params.infoRows ?? []
  const bulletList = params.bulletList ?? []
  const closing = params.closing ?? []

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${params.title}</title>
    </head>
    <body style="margin:0;padding:24px;background:#EFE8E1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${params.preview}</div>
      <div style="max-width:640px;margin:0 auto;background:#FAF6F2;border-radius:24px;overflow:hidden;border:1px solid rgba(213,195,182,0.18);">
        <div style="background:#2D3C3C;padding:28px 32px;">
          <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#B8965A;margin-bottom:10px;">NeiFe</div>
          <h1 style="margin:0;font-size:28px;line-height:1.2;color:#FAF6F2;">${params.title}</h1>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3C3530;">${greeting}</p>
          ${params.intro
            .map(
              (line) =>
                `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3C3530;">${line}</p>`
            )
            .join('')}

          ${
            params.emphasisBlock
              ? `
              <div style="margin:24px 0;padding:22px 24px;border-radius:20px;background:#1C1917;border:1px solid rgba(213,195,182,0.12);text-align:center;">
                ${
                  params.emphasisBlock.label
                    ? `<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9C8578;margin-bottom:8px;">${params.emphasisBlock.label}</div>`
                    : ''
                }
                <div style="font-size:34px;font-weight:700;letter-spacing:0.18em;color:#5E8B8C;">${params.emphasisBlock.value}</div>
                ${
                  params.emphasisBlock.hint
                    ? `<div style="font-size:12px;color:#9C8578;margin-top:10px;">${params.emphasisBlock.hint}</div>`
                    : ''
                }
              </div>
            `
              : ''
          }

          ${
            infoRows.length > 0
              ? `<div style="display:grid;gap:12px;margin:24px 0;">${renderInfoRows(infoRows)}</div>`
              : ''
          }

          ${params.customContent ? `<div style="margin:24px 0;">${params.customContent}</div>` : ''}

          ${bulletList.length > 0 ? `<div style="margin:20px 0;">${renderList(bulletList)}</div>` : ''}

          ${
            params.cta
              ? `
              <div style="margin:28px 0 20px;">
                <a
                  href="${params.cta.url}"
                  style="display:inline-block;background:#75524C;color:#FAF6F2;text-decoration:none;padding:14px 22px;border-radius:12px;font-size:15px;font-weight:600;"
                >
                  ${params.cta.label}
                </a>
              </div>
            `
              : ''
          }

          ${closing
            .map(
              (line) =>
                `<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#5A5048;">${line}</p>`
            )
            .join('')}
        </div>

        <div style="padding:20px 32px;border-top:1px solid rgba(213,195,182,0.16);background:#F3ECE5;">
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#7B6F66;">
            ${params.footnote ?? 'Este es un correo transaccional de NeiFe. Si no reconoces esta gestión, puedes ignorar este mensaje.'}
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9C8578;">
            NeiFe · Plataforma de gestión de arriendos
          </p>
        </div>
      </div>
    </body>
  </html>
  `
}
