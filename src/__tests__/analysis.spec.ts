import { TimeReal } from 'sonic-weave/monzo'
import { describe, it, expect } from 'vitest'
import { Interval } from 'sonic-weave/interval'
import { arraysEqual } from 'xen-dev-utils/core'
import { valueToCents } from 'xen-dev-utils/conversion'

import {
  alignValues,
  intervalMatrix,
  misalignment,
  otonalFundamental,
  utonalFundamental
} from '../analysis'

const EPSILON = 1e-4

describe('Otonal balancer', () => {
  it('can figure out that the major chord in 12edo approximates 4:5:6', () => {
    const frequencies = [2 ** 0, 2 ** (4 / 12), 2 ** (7 / 12)]
    const fundamental = otonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => Math.round(f / fundamental)),
        [4, 5, 6]
      )
    ).toBeTruthy()
  })

  it('handles negative ratios when estimating the fundamental', () => {
    const frequencies = [-(2 ** 0), 2 ** (4 / 12), -(2 ** (7 / 12))]
    const fundamental = otonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => Math.round(Math.abs(f) / fundamental)),
        [4, 5, 6]
      )
    ).toBeTruthy()
  })
})

describe('Utonal balancer', () => {
  it('can figure out that the minor chord in 12edo approximates 1/6:1/5:1/4', () => {
    const frequencies = [2 ** 0, 2 ** (3 / 12), 2 ** (7 / 12)]
    const fundamental = utonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => 1 / Math.round(fundamental / f)),
        [1 / 6, 1 / 5, 1 / 4]
      )
    ).toBeTruthy()
  })

  it('handles negative ratios when estimating the inverted fundamental', () => {
    const frequencies = [-(2 ** 0), 2 ** (3 / 12), -(2 ** (7 / 12))]
    const fundamental = utonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => 1 / Math.round(fundamental / Math.abs(f))),
        [1 / 6, 1 / 5, 1 / 4]
      )
    ).toBeTruthy()
  })
})

describe('Equal-division deviation minimizer', () => {
  it('can figure out the optimal alignment of 4:5:6 on 12edo', () => {
    const minimumAchievableError = alignValues([4, 5, 6], 100.0).error
    expect(minimumAchievableError).closeTo(7.8206, EPSILON)

    // Attempt (and fail) to find a counter-example
    const pitches = [4, 5, 6].map(valueToCents)
    for (let i = 0; i < 100; ++i) {
      const offset = Math.random() * 1200
      const candidate = pitches.map((pitch) => pitch + offset)
      expect(misalignment(candidate, 100.0)).toBeGreaterThanOrEqual(minimumAchievableError)
    }
  })
})

describe('Interval matrix', () => {
  it('throws a user-facing error for 0Hz scales', () => {
    const zeroHzScale = [new Interval(TimeReal.fromValue(0), 'linear')]

    expect(() => intervalMatrix(zeroHzScale)).toThrow(
      'Interval matrix is undefined for scales containing 0Hz intervals.'
    )
  })
})
