<script setup lang="ts">
import type { Scale } from '@/scale'
import { valueToCents } from 'xen-dev-utils/conversion'
import { computed } from 'vue'
import { mmod } from 'xen-dev-utils/fraction'

const props = defineProps<{
  scale: Scale
  orientation: 'horizontal' | 'vertical'
}>()

const ticksAndColors = computed(() => {
  const equaveCents = valueToCents(props.scale.equaveRatio)
  const result = []

  for (let i = 0; i < props.scale.size; ++i) {
    const cents = valueToCents(props.scale.intervalRatios[i])
    const tick = cents / equaveCents
    let color = 'var(--color-text)'
    if (tick < 0) {
      color = 'blue'
    } else if (tick > 1) {
      color = 'red'
    }
    if (!isNaN(tick) && isFinite(tick)) {
      // mmod(1, 1) === 0 so we don't have to push the unison tick
      const tickPosition = `${0.5 + 99 * mmod(tick, 1)}%`
      result.push({
        key: `scale-rule-${i}-${tickPosition}-${color}`,
        tick: tickPosition,
        color
      })
    }
  }
  // mmod(1, 1) === 0, so we have to manually push the equave tick
  result.push({
    key: 'scale-rule-equave',
    tick: '99.5%',
    color: 'var(--color-text)'
  })
  return result
})
</script>

<template>
  <svg width="100%" height="10" v-if="orientation === 'horizontal'">
    <line x1="0.5%" y1="50%" x2="99.5%" y2="50%" style="stroke: var(--color-text)" />
    <line
      v-for="item of ticksAndColors"
      :key="item.key"
      :x1="item.tick"
      y1="5%"
      :x2="item.tick"
      y2="95%"
      :style="'stroke:' + item.color + ';'"
    />
  </svg>
  <svg width="10" height="100%" v-else>
    <line y1="0.5%" x1="50%" y2="99.5%" x2="50%" style="stroke: var(--color-text)" />
    <line
      v-for="item of ticksAndColors"
      :key="item.key"
      :y1="item.tick"
      x1="5%"
      :y2="item.tick"
      x2="95%"
      :style="'stroke:' + item.color + ';'"
    />
  </svg>
</template>
