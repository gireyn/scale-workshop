import type { LocationQuery } from 'vue-router'
import { ASDF_ROW, DIGIT_ROW, QWERTY_ROW, ZXCV_ROW } from './keyboard-mapping'

/**
 * URL-safe sentinel used to join encoded scale lines.
 */
const NEWLINE = '_'
/**
 * URL-safe substitute for `/` inside a scale line.
 */
const FRACTION = 'F'
/**
 * URL-safe substitute for `,` inside a scale line.
 */
const COMMA = 'C'
/**
 * URL-safe substitute for `\` inside a scale line.
 */
const BACKSLASH = 'B'
/**
 * URL-safe substitute for spaces inside a scale line.
 */
const SPACE = 'S'
/**
 * URL-safe substitute for `<` inside a scale line.
 */
const LEFT_ANGLE_BRACKET = 'L'
/**
 * URL-safe substitute for `>` inside a scale line.
 */
const RIGHT_ANGLE_BRACKET = 'R'
/**
 * URL-safe substitute for `[` inside a scale line.
 */
const LEFT_SQUARE_BRACKET = 'Q'
/**
 * URL-safe substitute for `+` inside a scale line.
 */
const PLUS = 'P'
/**
 * Escape marker used to disambiguate reserved characters during line encoding.
 */
const ESCAPE = 'E'

/**
 * Compact token for the `black` key color.
 */
const BLACK = '-'
/**
 * Compact token for the `white` key color.
 */
const WHITE = '~'
/**
 * Separator between adjacent non-black/non-white color names.
 */
const SEPARATOR = '_'

function isDigit(character: string) {
  return /\d/.test(character)
}

function isBase36Digit(character: string) {
  return isDigit(character) || /[a-z]/.test(character)
}

function escapeCharacter(character: string) {
  if (isBase36Digit(character)) {
    return ESCAPE + character
  }
  return character
}

function encodeDigits(digits: string, keepZero: boolean) {
  if (!digits.length) {
    return ''
  }
  let result = ''
  const num = parseInt(digits)
  if (num || keepZero) {
    ;[...digits].every((leadingZero) => {
      if (leadingZero === '0') {
        result += '0'
        return true
      } else {
        return false
      }
    })
    if (num) {
      return result + num.toString(36)
    } else {
      return result
    }
  }
  return ''
}

function decodeDigits(digits: string) {
  if (!digits.length) {
    return ''
  }
  let result = ''
  const num = parseInt(digits, 36)
  ;[...digits].every((leadingZero) => {
    if (leadingZero === '0') {
      result += '0'
      return true
    } else {
      return false
    }
  })
  if (num) {
    return result + num.toString()
  } else {
    return result
  }
}

function encodeLine(scaleLine: string) {
  scaleLine = scaleLine
    .replaceAll(ESCAPE, ESCAPE + ESCAPE)
    .replaceAll(FRACTION, ESCAPE + FRACTION)
    .replaceAll(COMMA, ESCAPE + COMMA)
    .replaceAll(BACKSLASH, ESCAPE + BACKSLASH)
    .replaceAll(SPACE, ESCAPE + SPACE)
    .replaceAll(LEFT_ANGLE_BRACKET, ESCAPE + LEFT_ANGLE_BRACKET)
    .replaceAll(RIGHT_ANGLE_BRACKET, ESCAPE + RIGHT_ANGLE_BRACKET)
    .replaceAll(LEFT_SQUARE_BRACKET, ESCAPE + LEFT_SQUARE_BRACKET)
    .replaceAll(PLUS, ESCAPE + PLUS)

  scaleLine = scaleLine
    .replace(/\//g, FRACTION)
    .replace(/,/g, COMMA)
    .replace(/\\/g, BACKSLASH)
    .replace(/ /g, SPACE)
    .replace(/</g, LEFT_ANGLE_BRACKET)
    .replace(/>/g, RIGHT_ANGLE_BRACKET)
    .replace(/\[/g, LEFT_SQUARE_BRACKET)
    .replace(/\+/g, PLUS)
  let lastNonDigit = ''
  let result = ''
  let currentNumber = ''

  ;[...scaleLine].forEach((character) => {
    if (isDigit(character)) {
      currentNumber += character
    } else {
      result += encodeDigits(currentNumber, !'.,'.includes(lastNonDigit))
      currentNumber = ''
      lastNonDigit = character
      result += escapeCharacter(character)
    }
  })
  return result + encodeDigits(currentNumber, !'.,'.includes(lastNonDigit))
}

function decodeLine(encoded: string) {
  let result = ''
  let currentNumber = ''
  let passNext = false
  ;[...encoded].forEach((character) => {
    if (passNext) {
      result += character
      passNext = false
      return
    }
    if (character === ESCAPE) {
      passNext = true
      return
    }

    if (isBase36Digit(character)) {
      currentNumber += character
    } else {
      result += decodeDigits(currentNumber)
      currentNumber = ''

      if (character === FRACTION) {
        result += '/'
      } else if (character === COMMA) {
        result += ','
      } else if (character === BACKSLASH) {
        result += '\\'
      } else if (character === SPACE) {
        result += ' '
      } else if (character === LEFT_ANGLE_BRACKET) {
        result += '<'
      } else if (character === RIGHT_ANGLE_BRACKET) {
        result += '>'
      } else if (character === LEFT_SQUARE_BRACKET) {
        result += '['
      } else if (character === PLUS) {
        result += '+'
      } else {
        result += character
      }
    }
  })
  result += decodeDigits(currentNumber)

  return result
}

/**
 * Encodes scale lines into a newline-delimited, URL-safe string.
 *
 * @param scaleLines Raw scale lines as shown in the editor.
 * @returns Encoded payload suitable for the `l` query parameter.
 */
export function encodeLines(scaleLines: string[]) {
  return scaleLines.map(encodeLine).join(NEWLINE)
}

/**
 * Decodes an encoded scale text payload back to individual scale lines.
 *
 * @param encoded URL-encoded scale-line payload.
 * @returns Decoded scale lines in their original order.
 */
export function decodeLines(encoded: string) {
  return encoded.split(NEWLINE).map(decodeLine)
}

/**
 * Encodes keyboard key colors into a compact URL-friendly representation.
 *
 * `black` and `white` use single-character shorthands, while any custom color
 * names are included literally and separated when necessary.
 *
 * @param keyColors Key colors in keyboard order.
 * @returns Encoded color string suitable for the `c` query parameter.
 */
export function encodeKeyColors(keyColors: string[]) {
  let result = ''
  keyColors.forEach((color) => {
    if (color === 'black') {
      result += BLACK
    } else if (color === 'white') {
      result += WHITE
    } else if (result.length && !(result.endsWith(BLACK) || result.endsWith(WHITE))) {
      result += SEPARATOR + color
    } else {
      result += color
    }
  })
  return result
}

/**
 * Decodes a compact key-color payload back into individual color names.
 *
 * @param encoded Encoded key color payload.
 * @returns Decoded key colors in keyboard order.
 */
export function decodeKeyColors(encoded: string) {
  const result: string[] = []
  let color = ''

  function pushColor() {
    if (color.length) {
      result.push(color)
    }
    color = ''
  }

  ;[...encoded].forEach((character) => {
    if (character === BLACK) {
      pushColor()
      result.push('black')
    } else if (character === WHITE) {
      pushColor()
      result.push('white')
    } else if (character === SEPARATOR) {
      pushColor()
    } else {
      color += character
    }
  })
  pushColor()
  return result
}

/**
 * Parses a base-36 number with an optional base-36 fractional part.
 *
 * This is effectively the inverse of {@link Number.toString} when called with radix `36`
 * for values that preserve the same precision as the encoded input.
 *
 * @param string Base-36 string, optionally containing a single `.` separator.
 * @returns Parsed decimal number.
 */
export function parseFloat36(string: string) {
  const sign = string.startsWith('-') ? -1 : 1
  if (sign < 0) {
    string = string.slice(1)
  }
  const [integerString, fractionString] = string.split('.')
  const integerPart = integerString.length ? parseInt(integerString, 36) : 0
  const fractionPart = fractionString?.length
    ? parseInt(fractionString, 36) / 36 ** fractionString.length
    : 0
  const value = integerPart + fractionPart
  return sign * value
}

/**
 * Encodes an integer using a URL-safe base-64-like alphabet.
 *
 * The alphabet includes digits, lowercase letters, uppercase letters, `_`, and `~`.
 * The `.` character is intentionally left unused for future fractional extensions.
 *
 * @param n Integer value to encode.
 * @returns URL-safe encoded integer string.
 */
export function encodeNumber(n: number): string {
  // Digits and lower-case letters
  if (n >= 0 && n < 36) {
    return n.toString(36)
  }
  // Upper-case letters
  if (n >= 36 && n < 62) {
    return String.fromCharCode(29 + n)
  }
  // Misc
  if (n === 62) {
    return '_'
  }
  if (n === 63) {
    return '~'
  }

  // Negative
  if (n < 0) {
    return '-' + encodeNumber(-n)
  }

  // Recurse for multiple symbols
  return encodeNumber(Math.floor(n / 64)) + encodeNumber(n % 64)
}

/**
 * Decodes the compact integer format produced by {@link encodeNumber}.
 *
 * @param string Encoded integer string.
 * @returns Decoded integer value.
 */
export function decodeNumber(string: string) {
  let sign = 1
  if (string[0] === '-') {
    sign = -1
    string = string.slice(1)
  }
  let result = 0
  for (const char of string) {
    result *= 64
    if (/\d|[a-z]/.test(char)) {
      result += parseInt(char, 36)
    } else if (char === '_') {
      result += 62
    } else if (char === '~') {
      result += 63
    } else {
      result += char.charCodeAt(0) - 29
    }
  }
  return sign * result
}

function encodeNumberDelimited(n: number | undefined) {
  if (n === undefined) {
    return '.'
  }
  const result = encodeNumber(n)
  if (n >= 0 && result.length > 1) {
    return '--' + result + '-'
  }
  if (n < 0) {
    return result + '-'
  }
  return result
}

export function encodeKeyMap(map: Map<string, number>) {
  let result = ''
  DIGIT_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))))
  QWERTY_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))))
  ASDF_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))))
  ZXCV_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))))
  return result
}

export function decodeKeyMap(string: string): Map<string, number> {
  const tokens = []
  while (string.length) {
    let unterminatedToken = false
    if (string.startsWith('--')) {
      let token = string[2] ?? ''
      string = string.slice(3)
      while (string.length && string[0] !== '-') {
        token += string[0]
        string = string.slice(1)
      }
      tokens.push(token)
      unterminatedToken = !string.length
    } else if (string.startsWith('-')) {
      let token = string[0]
      string = string.slice(1)
      while (string.length && string[0] !== '-') {
        token += string[0]
        string = string.slice(1)
      }
      tokens.push(token)
      unterminatedToken = !string.length
    } else if (string[0] === '.') {
      tokens.push(null)
    } else {
      tokens.push(string[0])
    }
    if (unterminatedToken) {
      break
    }
    string = string.slice(1)
  }

  const result = new Map()
  tokens
    .map((t) => (t === null ? null : decodeNumber(t)))
    .forEach((n, i) => {
      if (n === null) {
        return
      }
      for (const row of [DIGIT_ROW, QWERTY_ROW, ASDF_ROW, ZXCV_ROW]) {
        if (i < row.length) {
          return result.set(row[i], n)
        }
        i -= row.length
      }
    })

  return result
}

function getSingle(query: LocationQuery, key: string, defaultIfNull: string) {
  const result = query[key]
  if (Array.isArray(result)) {
    throw new Error(`Failed to decode key '${key}'`)
  }
  if (result == null) {
    return defaultIfNull
  }
  return result
}

const WAVEFORM_TO_LETTER: { [key: string]: string } = {
  sine: 's',
  square: 'q',
  sawtooth: 'w',
  triangle: 't',

  semisine: 'e',
  warm1: '1',
  warm2: '2',
  warm3: '3',
  warm4: '4',
  octaver: 'o',
  brightness: 'b',
  harmonicbell: 'h',
  rich: 'r',
  slender: 'n',
  didacus: 'd',
  bohlen: 'l',
  glass: 'g',
  boethius: 'i'
}

const LETTER_TO_WAVEFORM: { [key: string]: string } = {
  s: 'sine',
  q: 'square',
  w: 'sawtooth',
  t: 'triangle',

  e: 'semisine',
  '1': 'warm1',
  '2': 'warm2',
  '3': 'warm3',
  '4': 'warm4',
  o: 'octaver',
  b: 'brightness',
  h: 'harmonicbell',
  r: 'rich',
  n: 'slender',
  d: 'didacus',
  l: 'bohlen',
  g: 'glass',
  i: 'boethius'
}

function millify(value: number) {
  return Math.round(value * 1000).toString(36)
}

function unmillify(encoded: string) {
  return parseInt(encoded, 36) / 1000
}

export type DecodedState = {
  scaleLines: string[]
  keyColors: string[]
  scaleName: string
  baseFrequency: number
  baseMidiNote: number
  isomorphicHorizontal: number
  isomorphicVertical: number
  keyboardMode: 'isomorphic' | 'piano'
  pianoMode: 'Asdf' | 'QweZxc0' | 'QweZxc1'
  equaveShift: number
  degreeShift: number
  waveform: string
  attackTime: number
  decayTime: number
  sustainLevel: number
  releaseTime: number
  pingPongDelayTime: number
  pingPongFeedback: number
  pingPongSeparation: number
  pingPongGain: number
}

/**
 * Compact URL query payload used by Scale Workshop.
 *
 * Each property maps to a short query parameter key to keep shared URLs small.
 */
export type EncodedState = {
  l?: string // (scale) Lines
  c?: string // (key) Colors
  n?: string // (scale) Name
  f?: string // (base) Frequency
  m?: string // (base) Midi note
  h?: string // (isomorphic) Horizontal
  v?: string // (isomorphic) Vertical
  k?: string // Keyboard mode
  p?: string // Piano mode
  e?: string // Equave shift
  d?: string // Degree shift
  w?: string // Waveform
  a?: string // Attack time
  y?: string // decaY time
  s?: string // Sustain level
  r?: string // Release time
  t?: string // Ping pong delay time
  b?: string // Ping pong feedback
  i?: string // Ping pong stereo separation
  g?: string // Ping pong gain
}

/**
 * Decodes Scale Workshop query parameters into a strongly typed app state.
 *
 * Accepts either vue-router query objects or raw `URLSearchParams`, and fills in
 * stable defaults for omitted keys.
 *
 * @param query Query payload to decode.
 * @returns Fully-populated decoded state with defaults applied.
 */
export function decodeQuery(query: LocationQuery | URLSearchParams): DecodedState {
  let get
  if (query instanceof URLSearchParams) {
    get = (key: string, defaultIfNull: string) => {
      const result = query.get(key)
      if (result === null) {
        return defaultIfNull
      }
      return result
    }
  } else {
    get = (key: string, defaultIfNull: string) => getSingle(query, key, defaultIfNull)
  }
  let pianoMode: 'Asdf' | 'QweZxc0' | 'QweZxc1' = 'Asdf'
  if (get('p', 'a') === '0') {
    pianoMode = 'QweZxc0'
  } else if (get('p', 'a') === '1') {
    pianoMode = 'QweZxc1'
  }
  return {
    scaleLines: decodeLines(get('l', '')),
    keyColors: decodeKeyColors(get('c', '~-~~-~-~~-~-')),
    scaleName: get('n', ''),
    baseFrequency: parseFloat36(get('f', 'c8')),
    baseMidiNote: parseInt(get('m', '1x'), 36),
    isomorphicHorizontal: parseInt(get('h', '1'), 36),
    isomorphicVertical: parseInt(get('v', '5'), 36),
    keyboardMode: get('k', 'i') === 'i' ? 'isomorphic' : 'piano',
    pianoMode,
    equaveShift: parseInt(get('e', '0'), 36),
    degreeShift: parseInt(get('d', '0'), 36),
    waveform: LETTER_TO_WAVEFORM[get('w', 'e')] || 'semisine',
    attackTime: unmillify(get('a', 'a')),
    decayTime: unmillify(get('y', '8c')),
    sustainLevel: unmillify(get('s', 'm8')),
    releaseTime: unmillify(get('r', 'a')),
    pingPongDelayTime: unmillify(get('t', '8c')),
    pingPongFeedback: unmillify(get('b', 'm8')),
    pingPongSeparation: unmillify(get('i', 'rs')),
    pingPongGain: unmillify(get('g', '0'))
  }
}

/**
 * Encodes app state into a compact query representation used in shared URLs.
 *
 * Default values are removed from the output to reduce URL length.
 *
 * @param state Decoded app state.
 * @returns Minified query payload containing only non-default values.
 */
export function encodeQuery(state: DecodedState): EncodedState {
  let p = 'a'
  if (state.pianoMode === 'QweZxc0') {
    p = '0'
  } else if (state.pianoMode === 'QweZxc1') {
    p = '1'
  }
  const result: EncodedState = {
    n: state.scaleName,
    l: encodeLines(state.scaleLines),
    c: encodeKeyColors(state.keyColors),
    f: state.baseFrequency.toString(36),
    m: state.baseMidiNote.toString(36),
    h: state.isomorphicHorizontal.toString(36),
    v: state.isomorphicVertical.toString(36),
    k: state.keyboardMode === 'isomorphic' ? 'i' : 'p',
    p,
    e: state.equaveShift.toString(36),
    d: state.degreeShift.toString(36),
    w: WAVEFORM_TO_LETTER[state.waveform],
    a: millify(state.attackTime),
    y: millify(state.decayTime),
    s: millify(state.sustainLevel),
    r: millify(state.releaseTime),
    t: millify(state.pingPongDelayTime),
    b: millify(state.pingPongFeedback),
    i: millify(state.pingPongSeparation),
    g: millify(state.pingPongGain)
  }

  // The app includes version information so we can safely strip defaults
  if (!result.n?.length) {
    delete result.n
  }
  if (!result.l?.length) {
    delete result.l
  }
  if (result.c === '~-~~-~-~~-~-') {
    delete result.c
  }
  if (result.f === 'c8') {
    delete result.f
  }
  if (result.m === '1x') {
    delete result.m
  }
  if (result.h === '1') {
    delete result.h
  }
  if (result.v === '5') {
    delete result.v
  }
  if (result.k === 'i') {
    delete result.k
  }
  if (result.p === 'a') {
    delete result.p
  }
  if (result.e === '0') {
    delete result.e
  }
  if (result.d === '0') {
    delete result.d
  }
  if (result.w === 'e') {
    delete result.w
  }
  if (result.a === 'a') {
    delete result.a
  }
  if (result.y === '8c') {
    delete result.y
  }
  if (result.s === 'm8') {
    delete result.s
  }
  if (result.r === 'a') {
    delete result.r
  }
  if (result.t === '8c') {
    delete result.t
  }
  if (result.b === 'm8') {
    delete result.b
  }
  if (result.i === 'rs') {
    delete result.i
  }
  if (result.g === '0') {
    delete result.g
  }

  return result
}
