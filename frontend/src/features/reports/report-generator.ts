import type { JobDetailResponse, Photo } from '@/features/jobs/types'

export type ReportStylePreset = 'Modern Blue' | 'Minimal Gray' | 'Bold Dark'

export interface ReportTemplateText {
  title: string
  subtitlePrefix: string
  generatedLabel: string
  jobTitleLabel: string
  customerLabel: string
  addressLabel: string
  statusLabel: string
  totalPhotosLabel: string
  summaryClosing: string
  photoSectionPrefix: string
  uploadedLabel: string
  notesLabel: string
  noCaptionText: string
  imageFailureText: string
  pageLabel: string
}

export interface ReportGeneratorOptions {
  locale: string
  stylePreset: ReportStylePreset
  includeCustomer: boolean
  includeAddress: boolean
  includeStatus: boolean
  includeWorkOrder: boolean
  coverImageUrl?: string
  text: ReportTemplateText
}

const stylePalette: Record<ReportStylePreset, { headerRgb: string; subtitleRgb: string; bodyRgb: string; cardRgb: string }> = {
  'Modern Blue': { headerRgb: '0.06 0.21 0.42', subtitleRgb: '0.84 0.92 1', bodyRgb: '0.13 0.14 0.16', cardRgb: '0.94 0.95 0.97' },
  'Minimal Gray': { headerRgb: '0.23 0.23 0.23', subtitleRgb: '0.92 0.92 0.92', bodyRgb: '0.16 0.16 0.16', cardRgb: '0.97 0.97 0.97' },
  'Bold Dark': { headerRgb: '0.08 0.08 0.10', subtitleRgb: '0.98 0.82 0.28', bodyRgb: '0.11 0.11 0.12', cardRgb: '0.90 0.90 0.92' },
}

export const defaultReportText = (locale: string): ReportTemplateText => {
  if (locale.startsWith('es')) {
    return {
      title: 'Informe Fotográfico de Servicio',
      subtitlePrefix: 'Orden de trabajo',
      generatedLabel: 'Generado',
      jobTitleLabel: 'Trabajo',
      customerLabel: 'Cliente',
      addressLabel: 'Dirección',
      statusLabel: 'Estado',
      totalPhotosLabel: 'Total de fotos',
      summaryClosing: 'Las fotos aparecen en las siguientes páginas en el orden del trabajo.',
      photoSectionPrefix: 'Evidencia fotográfica',
      uploadedLabel: 'Subida',
      notesLabel: 'Notas',
      noCaptionText: 'Sin descripción.',
      imageFailureText: 'No se pudo renderizar esta imagen en PDF.',
      pageLabel: 'Página',
    }
  }

  if (locale.startsWith('fr')) {
    return {
      title: 'Rapport Photo Terrain',
      subtitlePrefix: 'Référence',
      generatedLabel: 'Généré',
      jobTitleLabel: 'Intervention',
      customerLabel: 'Client',
      addressLabel: 'Adresse',
      statusLabel: 'Statut',
      totalPhotosLabel: 'Nombre de photos',
      summaryClosing: "Les photos apparaissent aux pages suivantes dans l'ordre du chantier.",
      photoSectionPrefix: 'Preuves photo',
      uploadedLabel: 'Importée',
      notesLabel: 'Notes',
      noCaptionText: 'Aucune légende.',
      imageFailureText: "Impossible d'afficher cette image dans le PDF.",
      pageLabel: 'Page',
    }
  }

  return {
    title: 'Field Service Photo Report',
    subtitlePrefix: 'Work Order',
    generatedLabel: 'Generated',
    jobTitleLabel: 'Job Title',
    customerLabel: 'Customer',
    addressLabel: 'Address',
    statusLabel: 'Status',
    totalPhotosLabel: 'Total Photos',
    summaryClosing: 'Photos are shown on the following pages in the same order as the job photo list.',
    photoSectionPrefix: 'Photo Evidence',
    uploadedLabel: 'Uploaded',
    notesLabel: 'Notes',
    noCaptionText: 'No caption provided.',
    imageFailureText: 'Unable to render this image in PDF.',
    pageLabel: 'Page',
  }
}

export const defaultReportOptions = (locale = 'en-US'): ReportGeneratorOptions => ({
  locale,
  stylePreset: 'Modern Blue',
  includeCustomer: true,
  includeAddress: true,
  includeStatus: true,
  includeWorkOrder: true,
  text: defaultReportText(locale),
})

function sanitizePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapByChars(value: string, maxChars = 92) {
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['-']
  const lines: string[] = []
  let current = words[0] ?? ''

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`
    if (candidate.length <= maxChars) current = candidate
    else {
      lines.push(current)
      current = word
    }
  }

  lines.push(current)
  return lines
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for PDF rendering.'))
    image.src = src
  })
}

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

async function preparePhoto(photo: Photo) {
  try {
    const image = await loadImage(photo.fileReference)
    const maxDimension = 1500
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const width = Math.max(1, Math.floor(image.width * scale))
    const height = Math.max(1, Math.floor(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas context unavailable.')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.86)

    return {
      width,
      height,
      hexData: `${bytesToHex(dataUrlToBytes(jpegDataUrl))}>`,
      uploadedAt: photo.uploadedAt,
      tag: photo.tag ?? 'Other',
      caption: photo.caption?.trim() || '',
      failed: false,
    }
  } catch {
    return {
      width: 0,
      height: 0,
      hexData: '',
      uploadedAt: photo.uploadedAt,
      tag: photo.tag ?? 'Other',
      caption: photo.caption?.trim() || '',
      failed: true,
    }
  }
}

export async function buildReportPdf(detail: JobDetailResponse, sortedPhotos: Photo[], options: ReportGeneratorOptions) {
  const preparedPhotos = await Promise.all(sortedPhotos.map(async (photo, index) => ({ ...(await preparePhoto(photo)), order: index + 1 })))

  const photoGroups: typeof preparedPhotos[] = []
  for (let i = 0; i < preparedPhotos.length; i += 2) {
    photoGroups.push(preparedPhotos.slice(i, i + 2))
  }

  const pageWidth = 595
  const pageHeight = 842
  const margin = 40
  const contentTop = pageHeight - 78

  const palette = stylePalette[options.stylePreset]
  const objects: string[] = ['1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj']
  const pageObjectIds: number[] = []
  const contentObjectIds: number[] = []
  const imageObjectIds: Array<number | null> = []

  let nextObjectId = 3
  pageObjectIds.push(nextObjectId)
  contentObjectIds.push(nextObjectId + 1)
  nextObjectId += 2

  for (const group of photoGroups) {
    pageObjectIds.push(nextObjectId)
    contentObjectIds.push(nextObjectId + 1)
    nextObjectId += 2
    for (const photo of group) {
      if (photo.failed) imageObjectIds.push(null)
      else {
        imageObjectIds.push(nextObjectId)
        nextObjectId += 1
      }
    }
  }

  const fontRegularObjectId = nextObjectId
  const fontBoldObjectId = nextObjectId + 1

  objects.push(`2 0 obj<</Type/Pages/Count ${pageObjectIds.length}/Kids[${pageObjectIds.map(id => `${id} 0 R`).join(' ')}]>>endobj`)

  const buildHeaderCommands = (title: string, subtitle?: string) => {
    const commands: string[] = ['q', `${palette.headerRgb} rg`, `0 ${pageHeight - 64} ${pageWidth} 64 re f`, 'Q', 'BT', '/F2 17 Tf', '1 1 1 rg', `${margin} ${pageHeight - 40} Td`, `(${escapePdfText(title)}) Tj`, 'ET']

    if (subtitle) {
      commands.push('BT', '/F1 10 Tf', `${palette.subtitleRgb} rg`, `${margin} ${pageHeight - 56} Td`, `(${escapePdfText(subtitle)}) Tj`, 'ET')
    }

    return commands
  }

  const summaryLines: string[] = [`${options.text.generatedLabel} ${new Date().toLocaleString(options.locale)}`, '', `${options.text.jobTitleLabel}: ${detail.job.title}`]

  if (options.includeCustomer) summaryLines.push(`${options.text.customerLabel}: ${detail.job.customerName}`)
  if (options.includeAddress) summaryLines.push(`${options.text.addressLabel}: ${detail.job.address}`)
  if (options.includeStatus) summaryLines.push(`${options.text.statusLabel}: ${detail.job.status}`)
  if (options.includeWorkOrder) summaryLines.push(`${options.text.subtitlePrefix}: ${detail.job.workOrderReference ?? '-'}`)

  summaryLines.push(`${options.text.totalPhotosLabel}: ${sortedPhotos.length}`, '', options.text.summaryClosing)

  const subtitle = options.includeWorkOrder ? `${options.text.subtitlePrefix} ${detail.job.workOrderReference ?? '-'}` : undefined
  const summaryCommands = buildHeaderCommands(options.text.title, subtitle)

  if (options.coverImageUrl?.trim()) {
    summaryCommands.push('BT', '/F1 9 Tf', '0.48 0.49 0.50 rg', `${margin} ${contentTop - 18} Td`, `(${escapePdfText(`Cover image: ${options.coverImageUrl.trim()}`)}) Tj`, 'ET')
  }

  let summaryY = contentTop - 40
  for (const line of summaryLines) {
    if (!line) {
      summaryY -= 10
      continue
    }

    for (const chunk of wrapByChars(line, 96)) {
      summaryCommands.push('BT', '/F1 12 Tf', `${palette.bodyRgb} rg`, `${margin} ${summaryY} Td`, `(${escapePdfText(chunk)}) Tj`, 'ET')
      summaryY -= 18
    }
  }

  summaryCommands.push('BT', '/F1 9 Tf', '0.45 0.48 0.52 rg', `${margin} 24 Td`, `(${escapePdfText(`${options.text.pageLabel} 1`)}) Tj`, 'ET')

  objects.push(`${pageObjectIds[0]} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</Font<</F1 ${fontRegularObjectId} 0 R/F2 ${fontBoldObjectId} 0 R>>>>/Contents ${contentObjectIds[0]} 0 R>>endobj`)
  const summaryStream = summaryCommands.join('\n')
  objects.push(`${contentObjectIds[0]} 0 obj<</Length ${summaryStream.length}>>stream\n${summaryStream}\nendstream\nendobj`)

  let imageObjectCursor = 0
  photoGroups.forEach((group, pageIndex) => {
    const pageObjId = pageObjectIds[pageIndex + 1]
    const contentObjId = contentObjectIds[pageIndex + 1]
    const commands: string[] = []
    const first = group[0]?.order ?? 1
    const last = group[group.length - 1]?.order ?? first

    commands.push(...buildHeaderCommands(`${options.text.photoSectionPrefix} ${first}-${last} / ${preparedPhotos.length}`))

    const cardGap = 18
    const availableHeight = pageHeight - 140
    const cardHeight = (availableHeight - cardGap * (group.length - 1)) / Math.max(group.length, 1)
    let currentTopY = pageHeight - 84
    const pageImageRefs: Array<{ objId: number; photo: (typeof preparedPhotos)[number] }> = []

    for (const photo of group) {
      const cardBottom = currentTopY - cardHeight
      const cardInnerX = margin + 10
      const cardInnerWidth = pageWidth - margin * 2 - 20
      const mediaTop = currentTopY - 44
      const mediaBottom = cardBottom + 54
      const mediaHeight = Math.max(60, mediaTop - mediaBottom)

      commands.push('q', `${palette.cardRgb} rg`, `${margin} ${cardBottom} ${pageWidth - margin * 2} ${cardHeight} re f`, 'Q')

      commands.push('BT', '/F2 11 Tf', '0.12 0.14 0.18 rg', `${cardInnerX} ${currentTopY - 24} Td`, `(${escapePdfText(`#${photo.order} • ${photo.tag}`)}) Tj`, 'ET')
      commands.push('BT', '/F1 9 Tf', '0.38 0.40 0.43 rg', `${cardInnerX} ${currentTopY - 36} Td`, `(${escapePdfText(`${options.text.uploadedLabel} ${new Date(photo.uploadedAt).toLocaleString(options.locale)}`)}) Tj`, 'ET')

      if (!photo.failed) {
        const scale = Math.min(cardInnerWidth / photo.width, mediaHeight / photo.height)
        const drawWidth = photo.width * scale
        const drawHeight = photo.height * scale
        const drawX = cardInnerX + (cardInnerWidth - drawWidth) / 2
        const drawY = mediaBottom + (mediaHeight - drawHeight) / 2
        const imageObjId = imageObjectIds[imageObjectCursor]
        if (imageObjId) {
          pageImageRefs.push({ objId: imageObjId, photo })
          const imName = `/Im${pageImageRefs.length}`
          commands.push('q', `${drawWidth} 0 0 ${drawHeight} ${drawX} ${drawY} cm`, `${imName} Do`, 'Q')
        }
      } else {
        commands.push('BT', '/F1 10 Tf', '0.62 0.19 0.14 rg', `${cardInnerX} ${cardBottom + cardHeight / 2} Td`, `(${escapePdfText(options.text.imageFailureText)}) Tj`, 'ET')
      }

      let noteY = cardBottom + 28
      for (const chunk of wrapByChars(`${options.text.notesLabel}: ${photo.caption || options.text.noCaptionText}`, 88).slice(0, 2)) {
        commands.push('BT', '/F1 9 Tf', '0.14 0.16 0.20 rg', `${cardInnerX} ${noteY} Td`, `(${escapePdfText(chunk)}) Tj`, 'ET')
        noteY -= 12
      }

      currentTopY = cardBottom - cardGap
      imageObjectCursor += 1
    }

    commands.push('BT', '/F1 9 Tf', '0.45 0.48 0.52 rg', `${margin} 24 Td`, `(${escapePdfText(`${options.text.pageLabel} ${pageIndex + 2}`)}) Tj`, 'ET')

    const xObjects = pageImageRefs.length > 0 ? `/XObject<</${pageImageRefs.map((ref, idx) => `Im${idx + 1} ${ref.objId} 0 R`).join('/') }>>` : ''

    objects.push(`${pageObjId} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</Font<</F1 ${fontRegularObjectId} 0 R/F2 ${fontBoldObjectId} 0 R>>${xObjects}>>/Contents ${contentObjId} 0 R>>endobj`)

    const stream = commands.join('\n')
    objects.push(`${contentObjId} 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream\nendobj`)

    for (const ref of pageImageRefs) {
      objects.push(`${ref.objId} 0 obj<</Type/XObject/Subtype/Image/Width ${ref.photo.width}/Height ${ref.photo.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter[/ASCIIHexDecode/DCTDecode]/Length ${ref.photo.hexData.length}>>stream\n${ref.photo.hexData}\nendstream\nendobj`)
    }
  })

  objects.push(`${fontRegularObjectId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`)
  objects.push(`${fontBoldObjectId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>endobj`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  }

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const generatedAt = new Date()
  const dateLabel = generatedAt.toISOString().slice(0, 10)
  const customerSlug = toSlug(detail.job.customerName || 'customer')
  const fileName = `jobsnap-report-${customerSlug || 'customer'}-${dateLabel}.pdf`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)

  return { objectUrl, generatedAt: generatedAt.toISOString(), fileName }
}
