<template>
  <div class="there-is-intentionally-no-class-here">
    <slot class="no-class" />
  </div>
</template>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
})

</script>

<script lang="ts" setup>
import { defineComponent } from 'vue'
</script>
