<template>
  <div :class="`runnable-root ${state}-state`">
    <BaseAccordion v-model="open">
      <template #header>
        <div data-cy="title" :class="`runnable-title-wrapper ${runnable.type}-title hover:bg-warm-gray-50`">
          <div class="transform runnable-title">
          <i-fa-caret-right v-if="type === 'suite'" :class="`${open && 'rotate-90'} transform text-warm-gray-400`" />
          <template v-else>
            <i-fa-solid-times v-if="state ==='failed'"/>
            <i-fa-circle-o-notch v-if="state ==='pending'"/>
            <i-fa-check v-if="state === 'passed'"/>
            <i-mdi-square-outline v-if="state === 'not-started'"/>
            <i-fa-refresh v-if="state === 'running'" class="animate-spin-slow"/>
          </template>
          {{ runnable.title }}
          </div>
          <!-- <slot name="title" /> -->
        </div>
      </template>
      <!-- Inner content of the suite -->
      <div data-cy="content" class="ml-0.4rem"><slot name="default" /></div>
    </BaseAccordion>
  </div>
</template>

<script lang="ts" >
import { defineComponent, computed, PropType, ref } from 'vue'
import BaseAccordion from '../components/BaseAccordion.vue'
import { Test, Suite } from '../store/reporter-store';

export default defineComponent({
  components: { BaseAccordion },
  props: {
    runnable: {
      type: Object as PropType<Test | Suite>,
      required: true
    },
  },
  setup(props) {
    return {
      open: ref(true),
      state: computed(() => props.runnable.state),
      level: computed(() => props.runnable.level),
      type: computed(() => props.runnable.type)
    }
  }
})
</script>

<style lang="scss">
$passed: #11c08e;
$failed: #e94f5f;
$pending: #a7c8e6;

.runnable-root {
  @apply hover:cursor-pointer text-size-13px text-warm-gray-600;
  // padding-left: calc(18px * v-bind(level));
  width: 100%;
  &:before {
    @apply w-4px h-[calc(100%)] block absolute content:"" left-0; 
  }
}

.runnable-title-wrapper {
  @apply inline-flex justify-start items-center gap-4px leading-loose select-none w-[calc(100%)];
  svg {
    @apply w-10px h-10px inline mx-1 mb-2px;
  }
}

.runnable-title {
  padding: 0.4rem;
  transform: translateX(calc(18px * v-bind(level)));
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

.not-started-state, .running-state {
  &:before {
    background: white;
  }
}
</style>