<script setup lang="ts">
import { ref } from 'vue'
import { isClient } from '../../shared'
import { useShare } from '.'

const options = ref({
  title: 'Vueuse',
  text: 'Collection of essential Vue Composition Utilities!',
  url: isClient ? location.href : '',
})

const { share, isSupported } = useShare(options)

const startShare = () => share().catch(err => err)
</script>

<template>
  <div>
    <input
      v-if="isSupported"
      v-model="options.text"
      type="text"
      placeholder="Note"
    >
    <button :disabled="!isSupported" @click="startShare">
      {{ isSupported ? 'Share' : 'Web share is not supported in your browser' }}
    </button>
  </div>
</template>
