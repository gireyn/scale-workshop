import { APP_TITLE } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'

/**
 * Exports scales in Scala `.scl` format.
 */
export class ScalaSclExporter extends BaseExporter {
  static maxInteger = 2147483647n

  name: string
  appTitle: string

  private formatCents(cents: number, fractionDigits: number) {
    const result = cents.toFixed(fractionDigits)
    if (!result.includes('.')) {
      return result + '.'
    }
    return result
  }

  constructor(params: ExporterParams) {
    super(params)
    this.name = params.scale.title || 'Untitled tuning'
    this.appTitle = params.appTitle || APP_TITLE
  }

  getFileContents() {
    const newline = this.params.newline
    const intervals = this.params.relativeIntervals
    const labels = this.params.labels
    const centsFractionDigits = this.params.centsFractionDigits ?? 6
    // assemble the .scl file contents
    let file = '! ' + this.params.filename + '.scl' + newline
    file += '! Created using ' + this.appTitle + newline
    file += '!' + newline
    file += '! ' + this.params.scaleUrl + newline
    file += '!' + newline
    file += this.name
    file += newline + ' '

    file += intervals.length.toString() + newline
    file += '!' + newline

    for (let i = 0; i < intervals.length; i++) {
      const monzo = intervals[i].value.abs()
      file += ' '
      if (monzo.isFractional()) {
        const { numerator, denominator } = monzo.toBigNumeratorDenominator()
        if (
          numerator <= ScalaSclExporter.maxInteger &&
          denominator <= ScalaSclExporter.maxInteger
        ) {
          file += `${numerator}/${denominator}`
        } else {
          file += this.formatCents(monzo.toCents(), centsFractionDigits)
        }
      } else {
        file += this.formatCents(monzo.toCents(), centsFractionDigits)
      }
      if (labels[i]?.length) {
        file += labels[i]
      }
      file += newline
    }

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.scl', this.getFileContents())
  }
}

/**
 * Exports keyboard mappings in Scala `.kbm` format.
 */
export class ScalaKbmExporter extends BaseExporter {
  constructor(params: ExporterParams) {
    super(params)
  }

  getFileContents() {
    const newline = this.params.newline
    const intervals = this.params.relativeIntervals
    const baseFrequency = this.params.scale.baseFrequency
    const baseMidiNote = this.params.scale.baseMidiNote
    // assemble the .kbm file contents
    let file = '! Template for a keyboard mapping' + newline
    file += '!' + newline
    file += '! Size of map. The pattern repeats every so many keys:' + newline
    file += intervals.length.toString() + newline
    file += '! First MIDI note number to retune:' + newline
    file += '0' + newline
    file += '! Last MIDI note number to retune:' + newline
    file += '127' + newline
    file += '! Middle note where the first entry of the mapping is mapped to:' + newline
    file += baseMidiNote.toString() + newline
    file += '! Reference note for which frequency is given:' + newline
    file += baseMidiNote.toString() + newline
    file += '! Frequency to tune the above note to' + newline
    file += baseFrequency.toString() + newline
    file += '! Scale degree to consider as formal octave (determines difference in pitch' + newline
    file += '! between adjacent mapping patterns):' + newline
    file += intervals.length.toString() + newline
    file += '! Mapping.' + newline
    file += '! The numbers represent scale degrees mapped to keys. The first entry is for' + newline
    file += '! the given middle note, the next for subsequent higher keys.' + newline
    file +=
      '! For an unmapped key, put in an "x". At the end, unmapped keys may be left out.' + newline

    for (let i = 0; i < intervals.length; i++) {
      file += i + newline
    }

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.kbm', this.getFileContents())
  }
}
