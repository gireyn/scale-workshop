<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()

const model = defineModel<number>()

const wrapper = computed({
  get: () => model.value,
  set(newValue: number | string) {
    const parsed = typeof newValue === 'number' ? newValue : parseFloat(newValue)
    if (!Number.isNaN(parsed)) {
      model.value = parsed
    }
  }
})
</script>

<template>
  <input v-bind="attrs" type="range" v-model="wrapper" />
</template>
