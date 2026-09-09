// Pure CSV parsing utilities (RFC4180 compliant)

export interface ParsedEmployee {
  full_name: string
  email: string
  role_name: string
}

export function parseCsv(text: string): string[][] {
  if (!text) return []

  // Skip UTF-8 BOM if present
  let input = text
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0
  const len = input.length

  while (i < len) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        // Escaped quote: ""
        if (i + 1 < len && input[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        currentField += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      } else if (char === ',') {
        currentRow.push(currentField)
        currentField = ''
        i++
        continue
      } else if (char === '\r') {
        currentRow.push(currentField)
        currentField = ''
        rows.push(currentRow)
        currentRow = []
        if (i + 1 < len && input[i + 1] === '\n') {
          i += 2
        } else {
          i++
        }
        continue
      } else if (char === '\n') {
        currentRow.push(currentField)
        currentField = ''
        rows.push(currentRow)
        currentRow = []
        i++
        continue
      } else {
        currentField += char
        i++
        continue
      }
    }
  }

  // Flush remaining field & row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  // Remove trailing single-element empty row if trailing newline existed
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    if (lastRow.length === 1 && lastRow[0] === '') {
      rows.pop()
    }
  }

  return rows
}

export function rowsToEmployees(
  rows: string[][],
  opts: { limit: number }
): { employees: ParsedEmployee[]; errors: string[] } {
  const errors: string[] = []
  const employees: ParsedEmployee[] = []

  if (!rows || rows.length === 0) {
    errors.push('File CSV kosong.')
    return { employees, errors }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const nameIdx = header.findIndex((h) => h === 'full_name' || h === 'name')
  const emailIdx = header.findIndex((h) => h === 'email')
  const roleIdx = header.findIndex((h) => h === 'role_name' || h === 'role')

  if (nameIdx === -1) {
    errors.push('Header CSV wajib memiliki kolom "full_name".')
    return { employees, errors }
  }

  const seenEmails = new Set<string>()
  const maxRows = Math.min(opts?.limit ?? 200, 200)
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  const dataRows = rows.slice(1)

  for (let idx = 0; idx < dataRows.length; idx++) {
    if (employees.length >= maxRows) {
      break
    }

    const row = dataRows[idx]
    const rowNum = idx + 2

    // Skip empty lines
    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
      continue
    }

    const fullName = (row[nameIdx] || '').trim()
    const email = emailIdx !== -1 && row[emailIdx] !== undefined ? row[emailIdx].trim() : ''
    const roleName =
      roleIdx !== -1 && row[roleIdx] !== undefined && row[roleIdx].trim() !== ''
        ? row[roleIdx].trim()
        : 'Employee'

    // Validate full_name
    if (!fullName) {
      errors.push(`Baris ${rowNum}: Nama lengkap wajib diisi.`)
      continue
    }
    if (fullName.length > 100) {
      errors.push(`Baris ${rowNum}: Nama lengkap melebihi batas 100 karakter.`)
      continue
    }

    // Validate email
    if (email !== '') {
      if (!emailRegex.test(email)) {
        errors.push(`Baris ${rowNum}: Format email "${email}" tidak valid.`)
        continue
      }
      const lowerEmail = email.toLowerCase()
      if (seenEmails.has(lowerEmail)) {
        // Dedupe within file
        continue
      }
      seenEmails.add(lowerEmail)
    }

    employees.push({
      full_name: fullName,
      email,
      role_name: roleName,
    })
  }

  return { employees, errors }
}
