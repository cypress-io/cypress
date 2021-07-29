<template>
  <i class="flex align-center justify-center" v-if="icon">
    <slot name="prefix">
      <component
        v-if="typeof icon !== 'string'"
        :is="icon"
        :class="$attrs.class"/>
      <i v-else :data-icon="icon"
        :class="$attrs.class"
        class="iconify"></i>
    </slot>
  </i>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    icon: {
      type: [String, Object] as PropType<string | ReturnType<typeof defineComponent>>,
    }
  }
})
</script>
