<script setup lang="ts">
import { computed } from 'vue'
import Values from 'values.js'

const props = defineProps<{
  keyId: string
  color: string
  active: boolean
  held: boolean
}>()

const light = computed(() => new Values(props.color).getBrightness() > 50)
</script>

<template>
  <td
    :data-key-id="keyId"
    :style="'background-color:' + color"
    :class="{ active, held, light, dark: !light }"
  >
    <slot></slot>
  </td>
</template>

<style scoped>
td {
  text-align: center;
  vertical-align: middle;
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.6em;
  user-select: none;
  cursor: pointer;
}
td p {
  pointer-events: none;
  word-break: break-word;
  line-height: 1.1em;
  color: var(--color-key-label);
}

td:hover {
  background: linear-gradient(
    0deg,
    rgba(255, 255, 255, 0) 0%,
    var(--color-key-hover) 50%,
    rgba(255, 255, 255, 0) 100%
  );
}
td.held {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0%,
    var(--color-key-held) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
td.active {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0%,
    var(--color-key-active) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
</style>
