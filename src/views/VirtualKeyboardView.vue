<script setup lang="ts">
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import VirtualPiano from '@/components/VirtualPiano.vue'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'
import { useMidiStore } from '@/stores/midi'
import { computed } from 'vue'
import type { NoteOnCallback } from '@/types'

defineProps<{
  noteOn: NoteOnCallback
}>()

const state = useStateStore()
const scale = useScaleStore()
const midi = useMidiStore()

function onBend(value: number) {
  midi.bend = value
}

const baseIndex = computed(
  () => scale.scale.baseMidiNote + scale.equaveShift * scale.scale.size + scale.degreeShift
)
</script>

<template>
  <main>
    <VirtualPiano
      v-if="scale.keyboardMode === 'piano'"
      :baseIndex="baseIndex"
      :baseMidiNote="scale.scale.baseMidiNote"
      :colorMap="scale.colorForIndex"
      :splitAccidentals="scale.splitAccidentals"
      :accidentalColor="scale.accidentalColor"
      :lowAccidentalColor="scale.lowAccidentalColor"
      :middleAccidentalColor="scale.middleAccidentalColor"
      :highAccidentalColor="scale.highAccidentalColor"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :slide-behavior="state.slideVirtualKeyboard"
      :bend-drag-pixels="state.bendDragPixels"
      :bend-axis="state.bendDragAxis"
      @bend="onBend"
    ></VirtualPiano>
    <VirtualKeyboard
      v-else
      :baseIndex="baseIndex"
      :isomorphicHorizontal="scale.isomorphicHorizontal"
      :isomorphicVertical="scale.isomorphicVertical"
      :colorMap="scale.colorForIndex"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :slide-behavior="state.slideVirtualKeyboard"
      :scale="scale.scale"
      :labelMap="scale.labelForIndex"
      :showLabel="state.showKeyboardLabel"
      :showCents="state.showKeyboardCents"
      :showRatio="state.showKeyboardRatio"
      :showFrequency="state.showKeyboardFrequency"
      :bend-drag-pixels="state.bendDragPixels"
      :bend-axis="state.bendDragAxis"
      @bend="onBend"
    ></VirtualKeyboard>
  </main>
</template>
