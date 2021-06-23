<script setup lang="ts">
import { ref } from 'vue'
import { useElementVisibility } from '.'

const el = ref(null)
const isVisible = useElementVisibility(el)
</script>

<template>
  <div ref="el" style="height: 200px">
    <note class="mb-2">
      Info on the right bottom corner
    </note>
    <div class="area">
      Target Element (scroll down)
    </div>
  </div>
  <div class="float">
    Element
    <BooleanDisplay
      :value="isVisible"
      true="inside"
      false="outside"
      class="font-bold"
    />
    the viewport
  </div>
</template>
