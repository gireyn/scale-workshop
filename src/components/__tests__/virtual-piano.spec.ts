import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import VirtualPiano from '@/components/VirtualPiano.vue'

describe('VirtualPiano', () => {
  it('releases active note callbacks on window mouseup', async () => {
    const noteOff = vi.fn()
    const noteOn = vi.fn(() => noteOff)

    const wrapper = mount(VirtualPiano, {
      props: {
        baseIndex: 60,
        baseMidiNote: 60,
        colorMap: () => 'white',
        splitAccidentals: false,
        accidentalColor: 'black',
        lowAccidentalColor: '#111111',
        middleAccidentalColor: '#222222',
        highAccidentalColor: '#333333',
        noteOn,
        heldNotes: new Map<number, number>(),
        slideBehavior: false,
        bendDragPixels: 200,
        bendAxis: 'y'
      }
    })

    await wrapper.get('rect.white').trigger('mousedown', { button: 0 })
    expect(noteOn).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }))
    expect(noteOff).toHaveBeenCalledTimes(1)
  })
})
