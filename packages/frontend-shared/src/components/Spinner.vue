<template>
  <div id="vue-spinner" />
</template>

<script lang="ts" setup>
import { Spinner } from 'spin.js'
import { onMounted } from 'vue-demi'

onMounted(() => {
  const target = document.getElementById('vue-spinner')

  if (target) {
    new Spinner({ color: '#888', scale: 0.5 }).spin(target)
  }
})
</script>

<style>
@import 'spin.js/spin.css';
</style>
