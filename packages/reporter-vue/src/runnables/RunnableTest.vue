<template>
  <div :class="`runnable-test-root ${state}-state`">
    <BaseAccordion v-model="open">
      <template #header>
        <div data-cy="title" class="suite-title">
          <span class="inline">
            <i-fa-solid-times v-if="state ==='failed'" class="inline"/>
            <i-fa-circle-o-notch v-if="state ==='pending'" class="inline"/>
            <i-fa-check v-if="state === 'passed'" class="inline"/>
            <i-mdi-square-outline v-if="state === 'not-running'" class="inline"/>
          </span>
          {{ test.title }}
          <!-- <slot name="title" /> -->
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
import { Test } from '../store/reporter-store';

export default defineComponent({
  components: { BaseAccordion },
  props: {
    test: {
      type: Object as PropType<Test>,
      required: true
    },
  },
  setup(props) {
    return {
      open: ref(true),
      state: computed(() => props.test.state),
      level: computed(() => props.test.level)
    }
  }
})
</script>

<style lang="scss">

.runnable-test-root {
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