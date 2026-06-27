<script setup lang="ts">
import { useCyclesStore } from '@/stores/edo-cycles'
import { labelX, labelY } from '@/utils'
import { type MultiVertex } from 'ji-lattice'
import { type Interval } from 'sonic-weave/interval'
import { computed } from 'vue'
import LatticeNodeGlowGradient from './LatticeNodeGlowGradient.vue'
import { mmod } from 'xen-dev-utils/fraction'

const RADIUS = 2

const store = useCyclesStore()

const props = defineProps<{
  relativeIntervals: Interval[]
  labels: string[]
  colors: string[]
  heldNotes: Set<number>
}>()

type KeyedVertex = MultiVertex & { key: number }

const steps = computed(() => {
  const result: number[] = []
  for (const interval of props.relativeIntervals) {
    result.push(interval.dot(store.val).valueOf())
  }
  return result
})

const vertices = computed<KeyedVertex[]>(() => {
  const m = store.modulus
  const n = store.numCycles
  const gpi = store.generatorPseudoInverse
  const result = new Map<number, KeyedVertex>()
  const dt = (2 * Math.PI) / m
  for (let i = 0; i < steps.value.length; ++i) {
    const s = steps.value[i]
    const c = mmod(s, n)
    const j = mmod((s - c) * gpi, m) + c
    const vertex = result.get(j) ?? {
      key: j,
      x: RADIUS * Math.sin(dt * j),
      y: -RADIUS * Math.cos(dt * j),
      indices: []
    }
    vertex.indices.push(i)
    result.set(j, vertex)
  }
  return Array.from(result.values())
})

const heldVertices = computed(() =>
  vertices.value.filter((v) => v.indices.some((idx) => props.heldNotes.has(idx)))
)

const cycles = computed(() => {
  const result: { key: number; d: string }[] = []
  const dt = (2 * Math.PI) / store.modulus
  for (let n = 0; n < store.numCycles; ++n) {
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i <= store.cycleLength; ++i) {
      const theta = dt * (n + store.numCycles * i)
      xs.push(RADIUS * Math.sin(theta))
      ys.push(-RADIUS * Math.cos(theta))
    }
    let d = `M ${xs[0]} ${ys[0]} `
    for (let i = 0; i < store.cycleLength; ++i) {
      d += `Q ${0.45 * (xs[i] + xs[i + 1])} ${0.45 * (ys[i] + ys[i + 1])} ${xs[i + 1]} ${ys[i + 1]} `
    }
    d += 'Z'
    result.push({ key: n, d })
  }
  return result
})

const viewScale = computed(() =>
  Math.max(2.2, 2.2 + Math.abs(store.labelOffset * store.size) + 1.1 * store.size)
)

const viewBox = computed(
  () => `${-viewScale.value} ${-viewScale.value} ${viewScale.value * 2} ${viewScale.value * 2}`
)
</script>

<template>
  <svg
    class="lattice"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <LatticeNodeGlowGradient id="held-node-glow-cycles" />
    </defs>
    <path v-for="cycle of cycles" :key="cycle.key" :d="cycle.d" stroke-width="0.03" />
    <circle
      v-for="v of heldVertices"
      :key="`${v.key}-glow`"
      class="node-glow"
      :cx="v.x"
      :cy="v.y"
      :r="store.size * 2.2"
      fill="url(#held-node-glow-cycles)"
    />
    <circle
      v-for="v of vertices"
      :key="v.key"
      :class="{ node: true, held: v.indices.some((idx) => heldNotes.has(idx)) }"
      :cx="v.x"
      :cy="v.y"
      :r="0.7 * store.size"
      :fill="colors[v.indices[0]] ?? 'none'"
      :stroke="colors[v.indices[0]] ?? 'none'"
      :stroke-width="store.size * 0.1"
    />
    <template v-if="store.showLabels">
      <template v-for="v of vertices" :key="v.key">
        <text
          v-for="(idx, j) of v.indices"
          :key="idx"
          class="node-label"
          :x="v.x + store.size * store.labelOffset * labelX(j, v.indices.length)"
          :y="v.y + store.size * store.labelOffset * labelY(j, v.indices.length)"
          :font-size="`${1.1 * store.size}px`"
          :stroke-width="store.size * 0.01"
        >
          {{ labels[idx] }}
        </text>
      </template>
    </template>
  </svg>
</template>

<style scoped>
path {
  fill: none;
}
path:nth-child(5n + 1) {
  stroke: var(--color-bright-indicator);
}
path:nth-child(5n + 2) {
  stroke: var(--color-accent);
}
path:nth-child(5n + 3) {
  stroke: var(--color-dark-indicator);
}
path:nth-child(5n + 4) {
  stroke: var(--color-accent-mute);
}
path:nth-child(5n) {
  stroke: var(--color-border);
}
</style>
