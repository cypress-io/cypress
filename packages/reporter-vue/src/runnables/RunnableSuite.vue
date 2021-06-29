<template>
  <div :class="`runnable-suite-root ${state}-state`">
    <BaseAccordion v-model="open">
      <template #header>
      
        <div data-cy="title" class="suite-title">
          <i-mdi-triangle :class="`${open ? 'rotate-180' : 'rotate-90'} transform text-size-6px inline mx-2`" /><strong>Suite:</strong> {{ suite.title }}
        </div>
      </template>
      <!-- Inner content of the suite -->
      <div data-cy="content"><slot name="default"/></div>
    </BaseAccordion>
  </div>
</template>

<script lang="ts" >
import { defineComponent, computed, PropType, ref } from 'vue'
import BaseAccordion from '../components/BaseAccordion.vue'
import { Suite } from '../store/reporter-store';

export default defineComponent({
  components: { BaseAccordion },
  props: {
    suite: {
      type: Object as PropType<Suite>,
      required: true
    },
  },
  setup(props) {
    return {
      open: ref(true),
      state: computed(() => props.suite.state),
      level: computed(() => props.suite.level)
    }
  }
})
</script>

<style lang="scss">
// .foo {
//   @apply bg-amber-500;
// }
.runnable-suite-root {
  @apply hover:cursor-pointer;
  padding-left: calc(18px * v-bind(level + 1));
  &:before {
    @apply w-4px h-[calc(100%)] block absolute content:"" left-0; 
  }
}

.passed-state {
  // @apply before:bg-green-600;
  &:before {
    background: #11c08e;
  }
}

.failed-state {
  &:before {
    background: #e94f5f;
  }
}

.pending-state {
  &:before {
    background: #a7c8e6;
  }
}

.not-running-state,.running-state {
  &:before {
    background: white;
  }
}
</style>