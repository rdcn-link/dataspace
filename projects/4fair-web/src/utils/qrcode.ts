/**
 * Minimal QR Code Generator
 * 支持 Byte 模式编码，纠错等级 M，版本 1-7
 * 用于微信扫码登录二维码生成
 */

// ---------- GF(256) ----------
const GF_EXP = new Array(512)
const GF_LOG = new Array(256)

;(function initGF() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x = (x * 2) ^ (x >= 128 ? 0x11d : 0)
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function gfPolyMul(poly: number[], coeff: number[]): number[] {
  const result = new Array(poly.length + coeff.length - 1).fill(0)
  for (let i = 0; i < poly.length; i++) {
    for (let j = 0; j < coeff.length; j++) {
      result[i + j] ^= gfMul(poly[i], coeff[j])
    }
  }
  return result
}

// ---------- Reed-Solomon ECC ----------
function rsGeneratorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    poly = gfPolyMul(poly, [1, GF_EXP[i]])
  }
  return poly
}

function rsEncode(data: number[], eccCount: number): number[] {
  const gen = rsGeneratorPoly(eccCount)
  const padded = [...data, ...new Array(eccCount).fill(0)]
  for (let i = 0; i < data.length; i++) {
    if (padded[i] === 0) continue
    const coef = padded[i]
    for (let j = 0; j < gen.length; j++) {
      padded[i + j] ^= gfMul(coef, gen[j])
    }
  }
  return padded.slice(data.length)
}

// ---------- QR Code Version ----------
interface VersionInfo {
  version: number
  totalCodewords: number
  eccCodewordsPerBlock: number
  blocks: number
}

const VERSION_INFO: VersionInfo[] = [
  { version: 1, totalCodewords: 16, eccCodewordsPerBlock: 10, blocks: 1 },
  { version: 2, totalCodewords: 28, eccCodewordsPerBlock: 16, blocks: 1 },
  { version: 3, totalCodewords: 44, eccCodewordsPerBlock: 26, blocks: 1 },
  { version: 4, totalCodewords: 64, eccCodewordsPerBlock: 18, blocks: 2 },
  { version: 5, totalCodewords: 86, eccCodewordsPerBlock: 24, blocks: 2 },
  { version: 6, totalCodewords: 108, eccCodewordsPerBlock: 16, blocks: 4 },
  { version: 7, totalCodewords: 124, eccCodewordsPerBlock: 18, blocks: 4 }
]

function getVersion(dataLen: number): VersionInfo {
  for (const vi of VERSION_INFO) {
    const capacity = vi.totalCodewords - vi.eccCodewordsPerBlock * vi.blocks
    if (dataLen + 3 <= capacity) return vi
  }
  throw new Error(`Data too long: ${dataLen} bytes`)
}

// ---------- QR Code Matrix ----------
export interface QRMatrix {
  size: number
  matrix: number[][]
}

function getMaskPattern(matrix: number[][], size: number): number {
  let bestMask = 0
  let bestPenalty = Infinity

  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(cloneMatrix(matrix, size), size, mask)
    const penalty = calculatePenalty(masked, size)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMask = mask
    }
  }
  return bestMask
}

function cloneMatrix(matrix: number[][], size: number): number[][] {
  const result: number[][] = []
  for (let y = 0; y < size; y++) {
    result.push([...matrix[y]])
  }
  return result
}

function applyMask(matrix: number[][], size: number, mask: number): number[][] {
  const result = cloneMatrix(matrix, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (result[y][x] !== -1) continue
      let maskBit = false
      switch (mask) {
        case 0: maskBit = (x + y) % 2 === 0; break
        case 1: maskBit = y % 2 === 0; break
        case 2: maskBit = x % 3 === 0; break
        case 3: maskBit = (x + y) % 3 === 0; break
        case 4: maskBit = (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; break
        case 5: maskBit = ((x * y) % 2) + ((x * y) % 3) === 0; break
        case 6: maskBit = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break
        case 7: maskBit = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break
      }
      result[y][x] = (matrix[y][x] === 1) ? (maskBit ? 0 : 1) : (maskBit ? 1 : 0)
    }
  }
  return result
}

function calculatePenalty(matrix: number[][], size: number): number {
  let penalty = 0

  // Rule 1: consecutive same-color modules
  for (let y = 0; y < size; y++) {
    let count = 1
    for (let x = 1; x < size; x++) {
      if (matrix[y][x] === matrix[y][x - 1]) {
        count++
      } else {
        if (count >= 5) penalty += count - 2
        count = 1
      }
    }
    if (count >= 5) penalty += count - 2
  }
  for (let x = 0; x < size; x++) {
    let count = 1
    for (let y = 1; y < size; y++) {
      if (matrix[y][x] === matrix[y - 1][x]) {
        count++
      } else {
        if (count >= 5) penalty += count - 2
        count = 1
      }
    }
    if (count >= 5) penalty += count - 2
  }

  // Rule 2: 2x2 blocks
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = matrix[y][x]
      if (v !== -1 && v === matrix[y][x + 1] && v === matrix[y + 1][x] && v === matrix[y + 1][x + 1]) {
        penalty += 3
      }
    }
  }

  // Rule 3: specific patterns (simplified)
  return penalty
}

function placeFunctionPatterns(matrix: number[][], size: number, version: number): void {
  // Initialize all cells as data area (0)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      matrix[y][x] = 0
    }
  }

  // Finder patterns
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4
        matrix[oy + y][ox + x] = (isBorder || isCenter) ? 1 : 0
      }
    }
  }

  drawFinder(0, 0)                       // top-left
  drawFinder(size - 7, 0)                // top-right
  drawFinder(0, size - 7)                // bottom-left

  // Separators
  for (let i = 0; i < 8; i++) {
    if (i < 7) {
      matrix[7][i] = 0
      matrix[i][7] = 0
      matrix[7][size - 1 - i] = 0
      matrix[size - 1 - i][7] = 0
    }
    // Bottom-right separator (adjacent to bottom-left finder)
    if (i < 7) {
      matrix[size - 8][i] = 0
      matrix[i][size - 8] = 0
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0
    matrix[i][6] = i % 2 === 0 ? 1 : 0
  }

  // Mark reserved areas as -1 (data area with mask)
  for (let i = 0; i < 8; i++) {
    if (i !== 6) {
      if (i < size) {
        matrix[8][i] = -1
        matrix[i][8] = -1
      }
    }
  }
  // Format info area (right of top-right finder, bottom of bottom-left finder)
  for (let i = size - 8; i < size; i++) {
    if (i >= 0 && i < size) {
      matrix[8][i] = -1
    }
  }
  matrix[size - 8][8] = -1

  // Dark module
  matrix[size - 8][8] = 1

  // Version info (version >= 7)
  if (version >= 7) {
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 3; x++) {
        matrix[size - 11 + y][x] = -1
        matrix[x][size - 11 + y] = -1
      }
    }
  }
}

function placeDataBits(matrix: number[][], size: number, bits: number[]): void {
  let bitIdx = 0
  let x = size - 1
  let y = size - 1
  let goingUp = true

  while (x > 0 && bitIdx < bits.length) {
    if (x === 6) { x--; continue }

    // Two columns at a time
    for (let col = 0; col < 2; col++) {
      const cx = x - col
      if (cx < 0) continue

      for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
        const cy = goingUp ? y - rowOffset : y + rowOffset
        if (cy < 0 || cy >= size) continue

        if (matrix[cy][cx] === -1 && bitIdx < bits.length) {
          matrix[cy][cx] = bits[bitIdx]
          bitIdx++
        }
      }
    }

    if (goingUp) {
      y -= 2
      if (y < 0) { goingUp = false; x -= 2; y = 0 }
    } else {
      y += 2
      if (y >= size) { goingUp = true; x -= 2; y = size - 1 }
    }
  }
}

function placeFormatInfo(matrix: number[][], size: number, mask: number): void {
  // Format info: ECMQ(0b00) + mask(3bits) = 0 | mask << 10 (with BCH)
  const formatData = (0 << 13) | (mask << 10)
  let bch = formatData
  for (let i = 0; i < 5; i++) {
    if (bch & (1 << (14 - i))) {
      bch ^= (0x537 >> i)
    }
  }
  const finalFormat = (formatData & 0x7c00) | (bch & 0x3ff)
  const maskedFormat = finalFormat ^ 0x5412

  // Place horizontal
  for (let i = 0; i < 15; i++) {
    const bit = (maskedFormat >> (14 - i)) & 1
    if (i < 6) {
      matrix[8][i] = bit
    } else if (i < 7) {
      matrix[8][i + 1] = bit  // skip timing column (6)
    } else if (i < 8) {
      matrix[8][i + 1] = bit
    } else {
      matrix[8][size - 15 + i] = bit
    }
  }

  // Place vertical
  for (let i = 0; i < 15; i++) {
    const bit = (maskedFormat >> (14 - i)) & 1
    if (i < 6) {
      matrix[i][8] = bit  // skip timing row (6)
    } else if (i === 6) {
      continue  // skip timing
    } else if (i < 8) {
      matrix[i + 1][8] = bit
    } else {
      matrix[size - 15 + i][8] = bit
    }
  }
}

// ---------- Encoding ----------
function encodeData(text: string, version: VersionInfo): number[] {
  const encoder = new TextEncoder()
  const bytes = Array.from(encoder.encode(text))

  const totalDataCodewords = version.totalCodewords - version.eccCodewordsPerBlock * version.blocks
  const charCountBits = version.version <= 9 ? 8 : 16

  // Build bit stream
  const bits: number[] = []

  // Mode: Byte (0100)
  for (let i = 3; i >= 0; i--) bits.push((0b0100 >> i) & 1)

  // Character count
  for (let i = charCountBits - 1; i >= 0; i--) bits.push((bytes.length >> i) & 1)

  // Data bytes
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
  }

  // Terminator
  for (let i = 0; i < 4 && bits.length < totalDataCodewords * 8; i++) bits.push(0)

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0)

  // Convert to bytes
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0)
    }
    data.push(byte)
  }

  // Pad remaining bytes
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (data.length < totalDataCodewords) {
    data.push(padBytes[padIdx % 2])
    padIdx++
  }

  return data
}

// ---------- Public API ----------
export function generateQRMatrix(text: string): QRMatrix {
  const vi = getVersion(text.length)
  const size = vi.version * 4 + 17

  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(0))

  placeFunctionPatterns(matrix, size, vi.version)

  const data = encodeData(text, vi)

  // Add ECC
  const blockSize = vi.totalCodewords / vi.blocks - vi.eccCodewordsPerBlock
  const allData: number[] = []
  const allECC: number[] = []

  for (let b = 0; b < vi.blocks; b++) {
    const start = b * blockSize
    const blockData = data.slice(start, start + blockSize)
    const ecc = rsEncode(blockData, vi.eccCodewordsPerBlock)
    allData.push(...blockData)
    allECC.push(...ecc)
  }

  // Interleave data
  const finalBytes: number[] = []
  if (vi.blocks === 1) {
    finalBytes.push(...allData, ...allECC)
  } else {
    for (let i = 0; i < blockSize; i++) {
      for (let b = 0; b < vi.blocks; b++) {
        finalBytes.push(allData[b * blockSize + i])
      }
    }
    for (let i = 0; i < vi.eccCodewordsPerBlock; i++) {
      for (let b = 0; b < vi.blocks; b++) {
        finalBytes.push(allECC[b * vi.eccCodewordsPerBlock + i])
      }
    }
  }

  // Convert to bit stream
  const bits: number[] = []
  for (const byte of finalBytes) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1)
  }

  placeDataBits(matrix, size, bits)

  // Choose best mask
  const bestMask = getMaskPattern(matrix, size)

  // Apply mask and place format/version info
  const finalMatrix = applyMask(matrix, size, bestMask)
  placeFormatInfo(finalMatrix, size, bestMask)

  return { size, matrix: finalMatrix }
}

export function drawQRCode(
  canvas: HTMLCanvasElement,
  text: string,
  options?: { margin?: number; color?: string; bgColor?: string }
): void {
  const { margin = 4, color = '#000000', bgColor = '#ffffff' } = options || {}
  const qr = generateQRMatrix(text)
  const moduleCount = qr.size + margin * 2
  const cellSize = Math.floor(canvas.width / moduleCount)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = color
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.matrix[y][x] === 1) {
        ctx.fillRect(
          (x + margin) * cellSize,
          (y + margin) * cellSize,
          cellSize,
          cellSize
        )
      }
    }
  }
}

/** 生成二维码 Data URL（支持较长 URL，用于微信扫码登录等） */
export async function generateQRDataURL(
  text: string,
  size: number = 300,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): Promise<string> {
  if (typeof document === 'undefined') return ''
  try {
    const QRCode = (await import('qrcode')).default
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel,
      color: { dark: '#000000ff', light: '#ffffffff' }
    })
  } catch {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    drawQRCode(canvas, text, { margin: 4 })
    return canvas.toDataURL('image/png')
  }
}
