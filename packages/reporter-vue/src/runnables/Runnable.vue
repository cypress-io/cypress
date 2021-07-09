<template>
  <div :class="`runnable-root runnable-${state} `">
    <BaseAccordion v-model="open">
      <template #header>
        <div data-cy="title" :class="`runnable-title-wrapper hover:bg-warm-gray-50 `">
          <div :class="`transform runnable-title ${runnable.type}-title ${runnable.type} runnable-${state}`">
          <i-fa-caret-right v-if="type === 'suite'" :class="`${open && 'rotate-90'} transform text-warm-gray-400`" />
          <template v-else>
            <i-fa-solid-times v-if="state ==='failed'"/>
            <i-fa-circle-o-notch v-if="state ==='pending'"/>
            <i-fa-check v-if="state === 'passed'"/>
            <i-mdi-square-outline v-if="state === 'not-started'"/>
            <i-fa-refresh v-if="state === 'processing'" class="animate-spin-slow"/>
          </template>
          {{ runnable.title }}
          </div>
        </div>
      </template>

      <!-- Inner content of the suite -->
      <template v-if="runnable.type === 'test'">
        <div data-cy="content" class="content-wrapper grid gap-6px transform">
          <Hook v-for="hook, idx in runnable.hooks"
          :key="hook.hookId"
          :idx="idx"
          :count="hooksByKind[hook.hookName].length"
          :hook="hook"
          >
          </Hook>
        </div>
      </template>
      <template v-else>
        <slot name="default"/>
      </template>
    </BaseAccordion>
  </div>
</template>

<script lang="ts" >
import { defineComponent, computed, PropType, ref } from 'vue'
import BaseAccordion from '../components/BaseAccordion.vue'
import { TestModel, SuiteModel } from '../store/reporter-store';
import Hook from '../hooks/Hook.vue'

export default defineComponent({
  components: { BaseAccordion, Hook },
  props: {
    runnable: {
      type: Object as PropType<TestModel | SuiteModel>,
      required: true
    },
  },
  setup(props) {
    return {
      open: ref(true),
      state: computed(() => props.runnable.state),
      level: computed(() => props.runnable.level),
      type: computed(() => props.runnable.type),
      hooksByKind: computed(() => props.runnable.hooksByKind)
    }
  }
})
</script>

<style lang="scss" scoped>
$passed: #11c08e;
$failed: #e94f5f;
$pending: #a7c8e6;
$indentSize: 18px;

.runnable-root {
  @apply hover:cursor-pointer text-size-13px text-warm-gray-600 w-[calc(100%)] relative;
  &:before {
    @apply w-4px h-[calc(100%)] block absolute content:"" left-0;
  }
}

.runnable-title-wrapper {
  @apply inline-flex justify-start items-center gap-4px leading-loose select-none w-[calc(100%)];
  width: calc(100% + (2 * 12px));
  // calc(100% + (2 * 12px))
  svg {
    @apply w-10px h-10px inline mx-1 mb-2px;
  }
}

.runnable-title {
  padding: 0.4rem;
  transform: translateX(calc(#{$indentSize} * v-bind(level)));
}

.suite-title {
  @apply text-size-13px text-warm-gray-900;
}

.content-wrapper {
  @apply ml-0.4rem;
  width: calc(100% - (v-bind(level) * #{$indentSize}));
  transform: translateX(calc(#{$indentSize} * v-bind(level + 1))); 
}

$states: (passed: $passed, failed: $failed, pending: $pending);
@each $state, $color in $states {
  .runnable-#{$state} {
    &.test {
      svg {
        color: $color;
      }
    }
    &:before {
      background: $color;
    }
  }
}

.pending.test-title {
  color: $pending;
}


.not-started-state, .processing-state {
  &:before {
    background: white;
  }
}

</style>