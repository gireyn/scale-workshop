<script setup lang="ts">
import { useGridStore } from '@/stores/grid'
import LatticeNodeGlowGradient from './LatticeNodeGlowGradient.vue'
import { debounce, labelX, labelY } from '@/utils'
import { spanGrid } from 'ji-lattice'
import { type Interval } from 'sonic-weave/interval'
import { computed, onUnmounted, ref, watch } from 'vue'

const store = useGridStore()

const props = defineProps<{
  relativeIntervals: Interval[]
  labels: string[]
  colors: string[]
  heldNotes: Set<number>
}>()

const svgElement = ref<SVGSVGElement | null>(null)

const steps = computed(() => {
  const result: number[] = []
  for (const interval of props.relativeIntervals) {
    result.push(interval.dot(store.val).valueOf())
  }
  return result
})

const grid = computed(() => {
  const result = spanGrid(steps.value, store.gridOptions)
  return result
})

const keyedGridLines = computed(() =>
  grid.value.edges
    .filter((edge) => edge.type === 'gridline')
    .map((edge) => ({
      key: `${edge.type}-${edge.x1}-${edge.y1}-${edge.x2}-${edge.y2}`,
      attrs: edge
    }))
)

const keyedEdges = computed(() =>
  grid.value.edges
    .filter((edge) => edge.type !== 'gridline')
    .map((edge) => ({
      key: `${edge.type}-${edge.x1}-${edge.y1}-${edge.x2}-${edge.y2}`,
      attrs: edge
    }))
)

const keyedVertices = computed(() =>
  grid.value.vertices.map((vertex) => ({
    key: `${vertex.x}-${vertex.y}`,
    vertex,
    color: props.colors[vertex.indices[0]] ?? 'none'
  }))
)

const keyedHeldVertices = computed(() =>
  keyedVertices.value.filter((item) => item.vertex.indices.some((idx) => props.heldNotes.has(idx)))
)

const viewBox = computed(
  () =>
    `${store.viewCenterX - store.viewScale} ${store.viewCenterY - store.viewScale} ${store.viewScale * 2} ${store.viewScale * 2}`
)

function computeGridExtent() {
  const element = svgElement.value
  if (!element) {
    return
  }
  const portAspectRatio = element.clientWidth / element.clientHeight
  // The grid extent is much larger than the view port to reach long custom connecting edges.
  const s = 2 * store.viewScale
  if (portAspectRatio >= 1) {
    store.minY = store.viewCenterY - s
    store.maxY = store.viewCenterY + s
    store.minX = store.viewCenterX - portAspectRatio * s
    store.maxX = store.viewCenterX + portAspectRatio * s
  } else {
    store.minY = store.viewCenterY - s / portAspectRatio
    store.maxY = store.viewCenterY + s / portAspectRatio
    store.minX = store.viewCenterX - s
    store.maxX = store.viewCenterX + s
  }
}

const computeExtent = debounce(computeGridExtent)

let resizeObserver: ResizeObserver | null = null

watch(svgElement, (element, _, onCleanup) => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!element) {
    return
  }
  computeGridExtent()
  resizeObserver = new ResizeObserver(computeExtent)
  resizeObserver.observe(element)
  onCleanup(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
})

watch(
  () => [
    store.viewScale,
    store.minX,
    store.maxX,
    store.minY,
    store.maxY,
    store.viewCenterX,
    store.viewCenterY
  ],
  computeExtent
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <svg
    ref="svgElement"
    class="lattice"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <LatticeNodeGlowGradient id="held-node-glow-grid" />
    </defs>
    <line
      v-for="edge of keyedGridLines"
      :key="edge.key"
      v-bind="edge.attrs"
      :class="`edge ${edge.attrs.type}`"
      :stroke-width="store.size * 0.1"
    />
    <line
      v-for="edge of keyedEdges"
      :key="edge.key"
      v-bind="edge.attrs"
      :class="`edge ${edge.attrs.type}`"
      :stroke-width="store.size * 0.2"
    />
    <circle
      v-for="item of keyedHeldVertices"
      :key="`${item.key}-glow`"
      class="node-glow"
      :cx="item.vertex.x"
      :cy="item.vertex.y"
      :r="store.size * 3.1"
      fill="url(#held-node-glow-grid)"
    />
    <circle
      v-for="item of keyedVertices"
      :key="item.key"
      :class="{ node: true, held: item.vertex.indices.some((idx) => heldNotes.has(idx)) }"
      :cx="item.vertex.x"
      :cy="item.vertex.y"
      :r="store.size"
      :fill="item.color"
      :stroke="item.color"
      :stroke-width="store.size * 0.1"
    />
    <template v-if="store.showLabels">
      <template v-for="item of keyedVertices" :key="item.key">
        <text
          v-for="(idx, j) of item.vertex.indices"
          :key="idx"
          class="node-label"
          :x="
            item.vertex.x + store.size * store.labelOffset * labelX(j, item.vertex.indices.length)
          "
          :y="
            item.vertex.y + store.size * store.labelOffset * labelY(j, item.vertex.indices.length)
          "
          :font-size="`${2.5 * store.size}px`"
          :stroke-width="store.size * 0.05"
        >
          {{ labels[idx] }}
        </text>
      </template>
    </template>
  </svg>
</template>

<style scoped>
svg {
  border: dashed 2px var(--color-background-soft);
  border-radius: 4px;
}
</style>
