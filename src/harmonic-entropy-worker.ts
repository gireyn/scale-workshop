import { EntropyCalculator, type HarmonicEntropyOptions } from 'harmonic-entropy'

let entropy: EntropyCalculator | undefined

/**
 * Worker message handler that computes harmonic-entropy data off the main thread.
 *
 * The worker memoizes a single `EntropyCalculator` instance and updates its options
 * on subsequent jobs to avoid repeated initialization overhead.
 */
onmessage = (e) => {
  const options: HarmonicEntropyOptions = e.data.options
  if (!entropy) {
    entropy = new EntropyCalculator(options)
  } else {
    entropy.options = options
  }
  postMessage({ json: entropy.toJSON(), jobId: e.data.jobId })
}
