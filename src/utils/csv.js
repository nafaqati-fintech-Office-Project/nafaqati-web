// Text cells starting with these characters can be run as formulas by spreadsheet apps
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value) {
  if (value == null) return ''
  let text = String(value)
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')

export function downloadFile(filename, content, type = 'text/csv;charset=utf-8') {
  // BOM so Excel opens UTF-8 (Arabic merchant names) correctly
  const blob = new Blob(['﻿', content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
