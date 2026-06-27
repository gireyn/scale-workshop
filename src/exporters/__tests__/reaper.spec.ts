import { describe, it, expect } from 'vitest'

import ReaperExporter from '../reaper'

import EXPECTED_CONTENT from './reaper.txt?raw'
import { getTestData } from './test-data'

function getValueForMidi(contents: string, midiNote: number) {
  const line = contents.split(/\r?\n/).find((line) => line.startsWith(`${midiNote} `))

  if (!line) {
    throw new Error(`MIDI note ${midiNote} not found`)
  }

  return line.split(' ')[1].trim()
}

describe('Reaper exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('Reaper exporter unit test v0.0.0')
    params.format = 'label'
    params.integratePeriod = true
    params.displayPeriod = true
    const exporter = new ReaperExporter(params)
    const [contents, suffix] = exporter.getFileContentsAndSuffix()
    expect(contents).toBe(EXPECTED_CONTENT)
    expect(suffix).toBe(' NoteNames_label_p_exact')
  })

  it('uses centsRoot as the cents value offset', () => {
    const params = getTestData('Reaper exporter unit test v0.0.0')
    params.format = 'cents'
    params.centsRoot = 12.5
    const exporter = new ReaperExporter(params)
    const [contents] = exporter.getFileContentsAndSuffix()

    expect(getValueForMidi(contents, 69)).toBe('12.500')
    expect(getValueForMidi(contents, 76)).toBe('1212.500')
  })
})
