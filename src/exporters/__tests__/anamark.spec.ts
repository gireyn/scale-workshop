import { describe, it, expect } from 'vitest'

import { AnaMarkV1Exporter, AnaMarkV2Exporter } from '../anamark'

import EXPECTED_CONTENT_V1 from './anamark.v1.tun?raw'
import EXPECTED_CONTENT_V2 from './anamark.v2.tun?raw'
import { getTestData } from './test-data'

describe('Anamark exporters', () => {
  it('can handle all line types', () => {
    const params = getTestData('Anamark exporter unit test v0.0.0')
    const exporterV1 = new AnaMarkV1Exporter(params)
    expect(exporterV1.getFileContents()).toBe(EXPECTED_CONTENT_V1)

    const exporterV2 = new AnaMarkV2Exporter(params)
    expect(exporterV2.getFileContents()).toBe(EXPECTED_CONTENT_V2)
  })

  it('sanitizes double quotes in quoted metadata fields', () => {
    const params = getTestData('Anamark exporter unit test v0.0.0')
    params.filename = 'My "quoted" tuning'
    params.description = 'Description with "quotes"'
    params.appTitle = 'Scale "Workshop"'

    const exporterV2 = new AnaMarkV2Exporter(params)
    const output = exporterV2.getFileContents()

    expect(output).toContain('Name= "My “quoted“ tuning.tun"')
    expect(output).toContain('ID= "My“quoted“tuning.tun"')
    expect(output).toContain('Filename= "My “quoted“ tuning.tun"')
    expect(output).toContain('Description= "Description with “quotes“"')
    expect(output).toContain('Editor= "Scale “Workshop“"')
  })

  it('removes line breaks from quoted metadata fields', () => {
    const params = getTestData('Anamark exporter unit test v0.0.0')
    params.description = 'Line 1\nLine 2\r\nLine 3'

    const exporterV2 = new AnaMarkV2Exporter(params)
    const output = exporterV2.getFileContents()

    expect(output).toContain('Description= "Line 1 Line 2 Line 3"')
  })
})
