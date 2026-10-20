// Generates a small valid PNG (64x64) used by the integration and browser
// flow check scripts.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 64

function crc32(buffer) {
  let crc = ~0
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

const raw = Buffer.alloc((SIZE * 3 + 1) * SIZE)
let offset = 0
for (let y = 0; y < SIZE; y += 1) {
  raw[offset] = 0
  offset += 1
  for (let x = 0; x < SIZE; x += 1) {
    raw[offset] = Math.round((x / SIZE) * 255)
    raw[offset + 1] = Math.round((y / SIZE) * 255)
    raw[offset + 2] = 140
    offset += 3
  }
}

const header = Buffer.alloc(13)
header.writeUInt32BE(SIZE, 0)
header.writeUInt32BE(SIZE, 4)
header[8] = 8
header[9] = 2

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])

const target = path.join(__dirname, 'test-design.png')
fs.writeFileSync(target, png)
console.log('Wrote', target, png.length, 'bytes')
