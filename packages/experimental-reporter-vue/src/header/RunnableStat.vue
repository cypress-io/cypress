<template>
  <span :class="`stat stat-${type}`" data-cy="stat">
    <i :class="`fas ${icon} icon`" aria-hidden="true"></i>
    <span class="visually-hidden">{{type}}</span>
    <span>{{ numberFormatted }}</span>
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import type { StatType } from '../store/stats-store'

const noRunnerPlaceholder = '--'
const icons: Record<StatType, string> = {
  pending: 'fa-circle-notch',
  passed: 'fa-check',
  failed: 'fa-times'
}

export default defineComponent({
  props: {
    type: String as PropType<StatType>,
    number:{ type: Number as PropType<null|number>, optional: true }
  },
  setup(props) {
    
    return {
      icon: icons[props.type],
      numberFormatted: computed(() => props.number > 0 ? props.number : noRunnerPlaceholder)
    }
  }
})
</script>

<style scoped lang="scss">
  .stat {
    font-size: 1.2rem;
    font-weight: 300;
    white-space: nowrap;
    padding: 0 0.25rem;
  }

  .icon {
    margin-right: 0.25rem;
    }

  .stat-pending {
    color: var(--pending-color);
  }

  .stat-failed {
    color: var(--failed-color);
  }

  .stat-passed {
    color: var(--passed-color);
  }
</style>