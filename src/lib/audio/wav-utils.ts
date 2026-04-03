export interface WavFormat {
  audioFormat: number
  numChannels: number
  sampleRate: number
  byteRate: number
  blockAlign: number
  bitsPerSample: number
}

export interface WavDecoded {
  format: WavFormat
  data: Buffer
}

export function decodeWavBuffer(buffer: Buffer): WavDecoded {
  if (buffer.length < 44) {
    throw new Error('WAV_TOO_SHORT')
  }
  if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WAVE') {
    throw new Error('WAV_INVALID_HEADER')
  }

  let fmt: WavFormat | null = null
  let pcmData: Buffer | null = null
  let offset = 12

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.subarray(offset, offset + 4).toString('ascii')
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const chunkStart = offset + 8
    const chunkEnd = chunkStart + chunkSize
    if (chunkEnd > buffer.length) {
      throw new Error('WAV_CHUNK_OUT_OF_RANGE')
    }

    if (chunkId === 'fmt ') {
      if (chunkSize < 16) {
        throw new Error('WAV_FMT_INVALID')
      }
      fmt = {
        audioFormat: buffer.readUInt16LE(chunkStart),
        numChannels: buffer.readUInt16LE(chunkStart + 2),
        sampleRate: buffer.readUInt32LE(chunkStart + 4),
        byteRate: buffer.readUInt32LE(chunkStart + 8),
        blockAlign: buffer.readUInt16LE(chunkStart + 12),
        bitsPerSample: buffer.readUInt16LE(chunkStart + 14),
      }
    } else if (chunkId === 'data') {
      pcmData = buffer.subarray(chunkStart, chunkEnd)
    }

    offset = chunkEnd + (chunkSize % 2)
  }

  if (!fmt || !pcmData) {
    throw new Error('WAV_MISSING_CHUNKS')
  }

  return {
    format: fmt,
    data: Buffer.from(pcmData),
  }
}

export function buildWavBuffer(format: WavFormat, pcmData: Buffer): Buffer {
  const headerSize = 44
  const output = Buffer.allocUnsafe(headerSize + pcmData.length)
  output.write('RIFF', 0, 'ascii')
  output.writeUInt32LE(36 + pcmData.length, 4)
  output.write('WAVE', 8, 'ascii')
  output.write('fmt ', 12, 'ascii')
  output.writeUInt32LE(16, 16)
  output.writeUInt16LE(format.audioFormat, 20)
  output.writeUInt16LE(format.numChannels, 22)
  output.writeUInt32LE(format.sampleRate, 24)
  output.writeUInt32LE(format.byteRate, 28)
  output.writeUInt16LE(format.blockAlign, 32)
  output.writeUInt16LE(format.bitsPerSample, 34)
  output.write('data', 36, 'ascii')
  output.writeUInt32LE(pcmData.length, 40)
  pcmData.copy(output, 44)
  return output
}

export function isWavFormatEqual(left: WavFormat, right: WavFormat): boolean {
  return left.audioFormat === right.audioFormat
    && left.numChannels === right.numChannels
    && left.sampleRate === right.sampleRate
    && left.byteRate === right.byteRate
    && left.blockAlign === right.blockAlign
    && left.bitsPerSample === right.bitsPerSample
}

export function mergeWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('WAV_SEGMENTS_EMPTY')
  }
  if (buffers.length === 1) {
    return buffers[0]
  }

  const decoded = buffers.map((buffer) => decodeWavBuffer(buffer))
  const [first, ...rest] = decoded
  for (const item of rest) {
    if (!isWavFormatEqual(first.format, item.format)) {
      throw new Error('WAV_SEGMENT_FORMAT_MISMATCH')
    }
  }
  const mergedData = Buffer.concat(decoded.map((item) => item.data))
  return buildWavBuffer(first.format, mergedData)
}

export function getWavDurationFromBuffer(buffer: Buffer): number {
  try {
    const decoded = decodeWavBuffer(buffer)
    if (decoded.format.byteRate <= 0) return 0
    return Math.round((decoded.data.length / decoded.format.byteRate) * 1000)
  } catch {
    return 0
  }
}
