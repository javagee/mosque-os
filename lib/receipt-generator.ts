import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ReceiptData {
  receiptRef: string        // e.g. "RCP-IMA-Y5MNEA"
  orderRef: string          // e.g. "IMA-Y5MNEA"
  mosqueName: string
  donorName: string
  donorEmail: string
  night: number
  mealType: string
  amount: number            // in cents
  verifiedAt: string        // ISO string
  anonymous: boolean
}

function sgd(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-SG', {
    year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Singapore',
  })
}

export async function generateRamadanReceipt(data: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const green = rgb(0.102, 0.239, 0.169)   // #1A3D2B
  const gold = rgb(0.788, 0.659, 0.298)    // #C9A84C
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.9, 0.9, 0.9)
  const black = rgb(0, 0, 0)

  // Header background
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: green })

  // Header text
  page.drawText('IMARA', { x: 40, y: height - 50, font: bold, size: 28, color: gold })
  page.drawText(data.mosqueName, { x: 40, y: height - 75, font: bold, size: 14, color: rgb(1, 1, 1) })
  page.drawText('Ramadan Sponsorship Receipt', { x: 40, y: height - 95, font: regular, size: 10, color: rgb(0.75, 0.75, 0.75) })
  page.drawText('NOT A TAX-DEDUCTION RECEIPT', { x: width - 220, y: height - 55, font: bold, size: 8, color: gold })

  // Receipt ref + date
  page.drawText(data.receiptRef, { x: width - 200, y: height - 75, font: bold, size: 11, color: rgb(1, 1, 1) })
  page.drawText(formatDate(data.verifiedAt), { x: width - 200, y: height - 93, font: regular, size: 9, color: rgb(0.75, 0.75, 0.75) })

  // Divider
  page.drawLine({ start: { x: 40, y: height - 140 }, end: { x: width - 40, y: height - 140 }, thickness: 1, color: lightGray })

  // Amount block
  page.drawText('Amount Received', { x: 40, y: height - 175, font: bold, size: 10, color: gray })
  page.drawText(sgd(data.amount), { x: 40, y: height - 210, font: bold, size: 36, color: green })

  // Details table
  const rows: [string, string][] = [
    ['Donor', data.anonymous ? 'Anonymous' : data.donorName],
    ['Email', data.donorEmail],
    ['Ramadan Night', `Night ${data.night}`],
    ['Meal Sponsorship', data.mealType.charAt(0) + data.mealType.slice(1).toLowerCase()],
    ['Order Reference', data.orderRef],
    ['Payment Verified', formatDate(data.verifiedAt)],
    ['Purpose', 'Ramadan Sadaqah Sponsorship'],
  ]

  let y = height - 265
  page.drawLine({ start: { x: 40, y: y + 15 }, end: { x: width - 40, y: y + 15 }, thickness: 1, color: lightGray })
  for (const [label, value] of rows) {
    page.drawText(label, { x: 40, y, font: regular, size: 10, color: gray })
    page.drawText(value, { x: 220, y, font: regular, size: 10, color: black })
    y -= 24
    page.drawLine({ start: { x: 40, y: y + 10 }, end: { x: width - 40, y: y + 10 }, thickness: 0.5, color: lightGray })
  }

  // Footer note
  y -= 20
  page.drawText(
    'This document acknowledges receipt of the stated amount for Ramadan sadaqah. It is not a tax-deduction receipt.',
    { x: 40, y, font: regular, size: 8, color: gray, maxWidth: width - 80 }
  )
  y -= 16
  page.drawText(
    `${data.mosqueName} · Powered by Imara · ${new Date().getFullYear()}`,
    { x: 40, y, font: regular, size: 8, color: lightGray }
  )

  // Gold accent bar at bottom
  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: gold })

  return doc.save()
}