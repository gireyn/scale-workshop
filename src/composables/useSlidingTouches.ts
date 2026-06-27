import { LEFT_MOUSE_BTN } from '@/constants'
import type { NoteOnCallback } from '@/types'

type SlidingKey = { id: string; index: number }
type KeyFromElement = (element: Element | null) => SlidingKey | undefined

type UseSlidingTouchesOptions = {
  slideEnabled: () => boolean
  getKeyFromElement: KeyFromElement
  noteOn: NoteOnCallback
  onBend?: (value: number) => void
  bendDragPixels?: () => number
  bendAxis?: () => 'x' | 'y'
  bendDeadZonePixels?: number
}

export function useSlidingTouches(options: UseSlidingTouchesOptions) {
  const activeTouchKeys = new Map<number, SlidingKey>()
  const activeTouchPositions = new Map<number, { x: number; y: number }>()
  const keyPressCounts = new Map<string, number>()
  const noteOffs = new Map<string, () => void>()
  const bendDeadZonePixels = options.bendDeadZonePixels ?? 16
  const getBendAxis = () => options.bendAxis?.() ?? 'y'

  let isMousePressed = false
  let activeMouseKey: SlidingKey | null = null
  let mouseStart: number | null = null
  let touchStartCentroid: number | null = null

  function applyBendFromDelta(delta: number) {
    if (!options.onBend) return
    const adjustedDelta = getBendAxis() === 'x' ? -delta : delta
    const absDelta = Math.abs(adjustedDelta)
    if (absDelta <= bendDeadZonePixels) {
      options.onBend(0)
      return
    }
    const bendDragPixels = options.bendDragPixels?.() ?? 150
    const normalized = (absDelta - bendDeadZonePixels) / (bendDragPixels - bendDeadZonePixels)
    options.onBend(Math.sign(adjustedDelta) * Math.max(0, Math.min(1, normalized)))
  }

  function touchCentroid() {
    if (!activeTouchPositions.size) return null
    let sum = 0
    activeTouchPositions.forEach((position) => {
      sum += getBendAxis() === 'x' ? position.x : position.y
    })
    return sum / activeTouchPositions.size
  }

  function activateKey(key: SlidingKey) {
    const keyId = key.id
    const activeCount = keyPressCounts.get(keyId) ?? 0
    if (activeCount === 0) {
      noteOffs.set(keyId, options.noteOn(key.index))
    }
    keyPressCounts.set(keyId, activeCount + 1)
  }

  function releaseKey(key: SlidingKey) {
    const keyId = key.id
    const activeCount = keyPressCounts.get(keyId) ?? 0
    if (activeCount <= 1) {
      keyPressCounts.delete(keyId)
      const noteOff = noteOffs.get(keyId)
      if (noteOff) {
        noteOff()
        noteOffs.delete(keyId)
      }
      return
    }
    keyPressCounts.set(keyId, activeCount - 1)
  }

  function isKeyActive(key: SlidingKey) {
    return (keyPressCounts.get(key.id) ?? 0) > 0
  }

  function onTouchStart(event: TouchEvent, key: SlidingKey) {
    event.preventDefault()
    const previousCentroid = !options.slideEnabled() && options.onBend ? touchCentroid() : null
    for (const touch of event.changedTouches) {
      if (!activeTouchKeys.has(touch.identifier)) {
        activeTouchKeys.set(touch.identifier, key)
        activeTouchPositions.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
        activateKey(key)
      }
    }
    if (!options.slideEnabled() && options.onBend) {
      const centroid = touchCentroid()
      if (touchStartCentroid === null || centroid === null) {
        touchStartCentroid = centroid
      } else if (previousCentroid !== null) {
        touchStartCentroid += centroid - previousCentroid
      }
    }
  }

  function onTouchEnd(event: TouchEvent) {
    event.preventDefault()
    const previousCentroid = !options.slideEnabled() && options.onBend ? touchCentroid() : null
    for (const touch of event.changedTouches) {
      const activeKey = activeTouchKeys.get(touch.identifier)
      if (activeKey !== undefined) {
        releaseKey(activeKey)
        activeTouchKeys.delete(touch.identifier)
        activeTouchPositions.delete(touch.identifier)
      }
    }
    if (!activeTouchKeys.size) {
      touchStartCentroid = null
      options.onBend?.(0)
      return
    }
    if (
      !options.slideEnabled() &&
      options.onBend &&
      touchStartCentroid !== null &&
      previousCentroid !== null
    ) {
      const centroid = touchCentroid()
      if (centroid !== null) {
        touchStartCentroid += centroid - previousCentroid
      }
    }
  }

  function onTouchMove(event: TouchEvent) {
    event.preventDefault()
    if (options.slideEnabled()) {
      for (const touch of event.changedTouches) {
        const currentKey = activeTouchKeys.get(touch.identifier)
        if (currentKey === undefined) {
          continue
        }
        activeTouchPositions.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        const nextKey = options.getKeyFromElement(element)
        if (nextKey === undefined || nextKey.id === currentKey.id) {
          continue
        }
        releaseKey(currentKey)
        activateKey(nextKey)
        activeTouchKeys.set(touch.identifier, nextKey)
      }
      return
    }

    if (!options.onBend) {
      return
    }
    for (const touch of event.changedTouches) {
      if (activeTouchKeys.has(touch.identifier)) {
        activeTouchPositions.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
      }
    }
    if (touchStartCentroid === null) {
      touchStartCentroid = touchCentroid()
    }
    const centroid = touchCentroid()
    if (touchStartCentroid === null || centroid === null) {
      return
    }
    applyBendFromDelta(touchStartCentroid - centroid)
  }

  function releaseAll() {
    noteOffs.forEach((noteOff) => noteOff())
    noteOffs.clear()
    keyPressCounts.clear()
    activeTouchKeys.clear()
    activeTouchPositions.clear()
    isMousePressed = false
    activeMouseKey = null
    mouseStart = null
    touchStartCentroid = null
    options.onBend?.(0)
  }

  function onMouseDown(event: MouseEvent, key: SlidingKey) {
    if (event.button !== LEFT_MOUSE_BTN) return
    event.preventDefault()
    isMousePressed = true
    mouseStart = getBendAxis() === 'x' ? event.clientX : event.clientY
    activateKey(key)
    activeMouseKey = key
  }

  function onMouseUp(event: MouseEvent) {
    if (event.button !== LEFT_MOUSE_BTN) return
    event.preventDefault()
    if (activeMouseKey) {
      releaseKey(activeMouseKey)
      activeMouseKey = null
    }
    isMousePressed = false
    mouseStart = null
    options.onBend?.(0)
  }

  function onMouseMove(event: MouseEvent) {
    if (!isMousePressed || options.slideEnabled() || mouseStart === null || !options.onBend) {
      return
    }
    const current = getBendAxis() === 'x' ? event.clientX : event.clientY
    applyBendFromDelta(mouseStart - current)
  }

  function onMouseEnter(event: MouseEvent, key: SlidingKey) {
    if (!isMousePressed || !options.slideEnabled()) return
    event.preventDefault()
    if (activeMouseKey && activeMouseKey.id === key.id) return
    if (activeMouseKey) releaseKey(activeMouseKey)
    activateKey(key)
    activeMouseKey = key
  }

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseMove,
    activateKey,
    releaseKey,
    isKeyActive,
    releaseAll
  }
}
