<template>
  <span :class="`stat stat-${type} flex nowrap flex-column gap-4px`" data-cy="stat">
  
    <i-fa-solid-times v-if="type ==='failed'"/>
    <i-fa-circle-o-notch v-if="type ==='pending'"/>
    <i-fa-check v-if="type === 'passed'"/>
    <span class="hidden">{{type}}</span>
    <span class="text-md font-normal antialiased">{{ numberFormatted }}</span>
  </span>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import type { PropType} from 'vue'

const noRunnerPlaceholder = '--'

export default defineComponent({
  props: {
    type: String as PropType<StatType>,
    number:{ type: Number as PropType<null|number>, optional: true }
  },
  setup(props) {
    
    return {
      type: props.type,
      numberFormatted: computed(() => props.number > 0 ? props.number : noRunnerPlaceholder)
    }
  }
})
</script>

<style scoped lang="scss">
  svg {
    @apply h-auto text-sm;
    display: inline-block;
    
  }
  .stat {
    @apply text-sm;
    font-size: 1.2rem;
    font-weight: 300;
    white-space: nowrap;
    padding: 0 8px;
    align-items: center;
  }

  .icon {
    margin-right: 0.25rem;
    }

  .stat-pending {
    @apply text-gray-400;
  }

  .stat-failed {
    @apply text-red-600;
  }

  .stat-passed {
    @apply text-emerald-600;
  }
</style>