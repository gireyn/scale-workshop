import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { Keyboard } from 'isomorphic-qwerty'
import { MidiIn } from 'xen-midi'

import App from '@/App.vue'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'

type TestWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
    matchMedia?: (query: string) => MediaQueryList
  }
type AudioContextCtor = typeof AudioContext

const testWindow = window as TestWindow
const testGlobal = globalThis as typeof globalThis & { AudioContext?: AudioContextCtor }

const originalMatchMedia = window.matchMedia
const originalRequestIdleCallback = testWindow.requestIdleCallback
const originalAudioContext = testGlobal.AudioContext

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>home</div>' } }]
  })
}

beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    testWindow.matchMedia = (query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  }

  if (typeof testWindow.requestIdleCallback !== 'function') {
    testWindow.requestIdleCallback = (callback: IdleRequestCallback) => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50
      } as IdleDeadline)
      return 1
    }
  }

  if (typeof testGlobal.AudioContext !== 'function') {
    testGlobal.AudioContext = class {
      currentTime = 0
      destination = {}
      createGain() {
        return { gain: { value: 1 }, connect: () => {}, disconnect: () => {} }
      }
      createOscillator() {
        return {
          frequency: { value: 440 },
          connect: () => {},
          disconnect: () => {},
          start: () => {},
          stop: () => {}
        }
      }
      close() {
        return Promise.resolve()
      }
    } as unknown as AudioContextCtor
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

afterAll(() => {
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia
  } else {
    Reflect.deleteProperty(testWindow, 'matchMedia')
  }

  if (originalRequestIdleCallback) {
    testWindow.requestIdleCallback = originalRequestIdleCallback
  } else {
    Reflect.deleteProperty(testWindow, 'requestIdleCallback')
  }

  if (originalAudioContext) {
    testGlobal.AudioContext = originalAudioContext
  } else {
    Reflect.deleteProperty(testGlobal, 'AudioContext')
  }
})

describe('App lifecycle listeners', () => {
  it('uses the active scale title for the browser tab title', async () => {
    setActivePinia(createPinia())
    const scale = useScaleStore()
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const originalTitle = document.title
    const wrapper = shallowMount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
          RouterLink: true,
          Teleport: true,
          Transition: false
        }
      }
    })

    scale.scale.title = 'Meantone test scale'
    await wrapper.vm.$nextTick()

    expect(document.title).toBe('Meantone test scale | Scale Workshop 3')

    await wrapper.unmount()
    document.title = originalTitle
  })

  it('does not deactivate active notes on blur and visibility hide by default', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const state = useStateStore()
    expect(state.releaseOnBlur).toBe(false)
    state.heldNotes.set(12, 1)
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const keyboardDeactivateSpy = vi.spyOn(Keyboard.prototype, 'deactivate')
    const midiDeactivateSpy = vi.spyOn(MidiIn.prototype, 'deactivate')

    const wrapper = shallowMount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
          RouterLink: true,
          Teleport: true,
          Transition: false
        }
      }
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))

    window.dispatchEvent(new Event('blur'))
    expect(keyboardDeactivateSpy).not.toHaveBeenCalled()
    expect(midiDeactivateSpy).not.toHaveBeenCalled()
    expect(state.heldNotes.get(12)).toBe(1)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(keyboardDeactivateSpy).not.toHaveBeenCalled()
    expect(midiDeactivateSpy).not.toHaveBeenCalled()
    expect(state.heldNotes.get(12)).toBe(1)

    await wrapper.unmount()
    vi.useRealTimers()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })
  })

  it('deactivates active notes on blur and visibility hide when enabled', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const state = useStateStore()
    state.releaseOnBlur = true
    state.heldNotes.set(12, 1)
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const keyboardDeactivateSpy = vi.spyOn(Keyboard.prototype, 'deactivate')
    const midiDeactivateSpy = vi.spyOn(MidiIn.prototype, 'deactivate')

    const wrapper = shallowMount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
          RouterLink: true,
          Teleport: true,
          Transition: false
        }
      }
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))

    window.dispatchEvent(new Event('blur'))
    expect(keyboardDeactivateSpy).toHaveBeenCalledTimes(1)
    expect(midiDeactivateSpy).toHaveBeenCalledTimes(1)
    expect(state.heldNotes.size).toBe(0)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(keyboardDeactivateSpy).toHaveBeenCalledTimes(2)
    expect(midiDeactivateSpy).toHaveBeenCalledTimes(2)

    await wrapper.unmount()
    vi.useRealTimers()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })
  })
})
