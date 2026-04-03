const SPLIT_HINT_CHARS = new Set([
  '。', '！', '？', '；', '，', '、',
  '.', '!', '?', ';', ',', ':', '：',
  '\n',
])

export function splitTextByLimit(text: string, maxChars: number): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const chars = Array.from(trimmed)
  if (chars.length <= maxChars) return [trimmed]

  const segments: string[] = []
  let cursor = 0
  while (cursor < chars.length) {
    const hardEnd = Math.min(cursor + maxChars, chars.length)
    if (hardEnd === chars.length) {
      const segment = chars.slice(cursor, hardEnd).join('').trim()
      if (segment) segments.push(segment)
      break
    }

    let splitPoint = hardEnd
    for (let index = hardEnd - 1; index > cursor; index -= 1) {
      if (SPLIT_HINT_CHARS.has(chars[index])) {
        splitPoint = index + 1
        break
      }
    }

    const segment = chars.slice(cursor, splitPoint).join('').trim()
    if (!segment) {
      throw new Error('TEXT_SPLIT_FAILED')
    }
    segments.push(segment)
    cursor = splitPoint
    while (cursor < chars.length && /\s/.test(chars[cursor])) {
      cursor += 1
    }
  }

  return segments
}
