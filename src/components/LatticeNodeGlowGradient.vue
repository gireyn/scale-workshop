<script setup lang="ts">
defineProps<{
  id: string
}>()
</script>

<template>
  <radialGradient :id="id" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.65" />
    <stop offset="25%" stop-color="var(--color-accent)" stop-opacity="0.55" />
    <stop offset="50%" stop-color="var(--color-accent)" stop-opacity="0.33" />
    <stop offset="75%" stop-color="var(--color-accent)" stop-opacity="0.14" />
    <stop offset="90%" stop-color="var(--color-accent)" stop-opacity="0.04" />
    <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
  </radialGradient>
</template>
