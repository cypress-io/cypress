<template>
  <div>
    <div ref="ghostLeft" />

    <div
      ref="copyText"
      :style="{ paddingLeft: inputLeftOffset + 'px' }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'

const copyText = ref<HTMLDivElement>()

useElementSize(copyText)

const ghostLeft = ref<HTMLDivElement>()
const { width } = useElementSize(ghostLeft)
const inputLeftOffset = computed(() => width.value + 12)
</script>
