<template>
  <div :class="`runnable-test-root ${state}-state`">
    <BaseAccordion v-model="open">
      <template #header>
        <div data-cy="title" class="test-title">
          <i-fa-solid-times v-if="state ==='failed'"/>
          <i-fa-circle-o-notch v-if="state ==='pending'"/>
          <i-fa-check v-if="state === 'passed'"/>
          <i-mdi-square-outline v-if="state === 'not-running'"/>
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
$passed: #11c08e;
$failed: #e94f5f;
$pending: #a7c8e6;

.runnable-test-root {
  @apply hover:cursor-pointer text-size-13px text-warm-gray-600;
  padding-left: calc(18px * v-bind(level + 1));
  &:before {
    @apply w-4px h-[calc(100%)] block absolute content:"" left-0; 
  }
}

.test-title {
  @apply inline-flex justify-center items-center gap-4px hover:bg-warm-gray-50;
  span, svg {
    font-size: 8px;
  }
}

.passed-state {
  .test-title {
    svg {
      color: $passed;
    }
  }

  &:before {
    background: $passed;
  }
}

.failed-state {
  .test-title {
    svg {
      color: $failed;
    }
  }
  
  &:before {
    background: $failed;
  }
}

.pending-state {
  .test-title {
    svg {
      color: $pending;
    }
  }
  
  &:before {
    background: $pending;
  }
}

.not-running-state,.running-state {
  &:before {
    background: white;
  }
}
</style>