import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { shallowMount, type MountingOptions } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'

import AboutView from '@/views/AboutView.vue'
import MosView from '@/views/MosView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PrivacyPolicy from '@/views/PrivacyPolicy.vue'
import TermsOfService from '@/views/TermsOfService.vue'
import VirtualKeyboardView from '@/views/VirtualKeyboardView.vue'
import VirtualQwerty from '@/views/VirtualQwerty.vue'

type TestWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
    matchMedia?: (query: string) => MediaQueryList
  }
const testWindow = window as TestWindow

const originalMatchMedia = window.matchMedia
const originalRequestIdleCallback = testWindow.requestIdleCallback

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/privacy-policy', component: { template: '<div>privacy</div>' } },
      { path: '/terms-of-service', component: { template: '<div>terms</div>' } }
    ]
  })
}

async function mountView(component: Component, options: MountingOptions<unknown> = {}) {
  setActivePinia(createPinia())
  const router = createTestRouter()
  await router.push('/')
  await router.isReady()

  return shallowMount(component, {
    ...options,
    global: {
      plugins: [router],
      stubs: {
        Teleport: true,
        Transition: false,
        ...options.global?.stubs
      }
    }
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
})

describe('view smoke tests', () => {
  it('mounts static content views', async () => {
    const about = await mountView(AboutView)
    expect(about.text()).toContain('Scale Workshop 3')
    expect(about.findAll('a').length).toBeGreaterThan(1)

    const privacy = await mountView(PrivacyPolicy)
    expect(privacy.text()).toContain('Privacy Policy')

    const terms = await mountView(TermsOfService)
    expect(terms.text()).toContain('Refraining from Certain Activities')
  })

  it('mounts the mos workspace view', async () => {
    const wrapper = await mountView(MosView)
    expect(wrapper.text()).toContain('Your scale will be replaced with a MOS scale')
  })

  it('mounts virtual keyboard views with note callback props', async () => {
    const noteOn = () => () => {}

    const keyboard = await mountView(VirtualKeyboardView, {
      props: { noteOn }
    })
    expect(keyboard.find('main').exists()).toBe(true)

    const qwerty = await mountView(VirtualQwerty, {
      props: {
        noteOn,
        typingKeyboard: {}
      }
    })
    expect(qwerty.find('main').exists()).toBe(true)
  })

  it('mounts not found view and opens the octaplex portal', async () => {
    const wrapper = await mountView(NotFoundView)
    expect(wrapper.text()).toContain('Not found')

    await wrapper.get('#octaplex').trigger('click')
    const portal = wrapper.findComponent({ name: 'OctaplexPortal' })
    expect(portal.exists()).toBe(true)
    expect(portal.props('show')).toBe(true)

    portal.vm.$emit('cancel')
    await nextTick()
    expect(wrapper.findComponent({ name: 'OctaplexPortal' }).props('show')).toBe(false)
  })

  it('provides router links in legal-policy views', async () => {
    const privacy = await mountView(PrivacyPolicy)
    const privacyLink = privacy.findComponent({ name: 'RouterLink' })
    expect(privacyLink.exists()).toBe(true)

    const terms = await mountView(TermsOfService)
    const termsLink = terms.findComponent({ name: 'RouterLink' })
    expect(termsLink.exists()).toBe(true)
  })
})
