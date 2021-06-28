<template>
  <ReporterHeaderLayout data-cy="reporter-header">
    <!-- Three stats (passed, failed, pending)-->
    <template #runnables>
      <RunnableStat type="passed" :number="numberPassed"/>
      <RunnableStat type="failed" :number="numberFailed"/>
      <RunnableStat type="pending" :number="numberPending"/>
    </template>

    <!-- Timer -->
    <template #duration>
      <RunnableDuration class="duration" :duration="duration" />
    </template>

    <!-- Controls (auto-scrolling and play-pause) -->
    <template #controls>
      <HotkeyTooltip :content="playControl.text" :hotkey="playControl.hotkey">
          <button @click="playControl.method" data-cy="play-pause-toggle">
            <i-fa-pause v-if="showPause" />
            <i-fa-repeat v-else />
          </button>
        </HotkeyTooltip>

        <HotkeyTooltip :content="autoScrollText" hotkey="A">
          <button :aria-label="autoScrollText" class="inline-flex items-center justify-center w-100% h-100%">
            <span class="auto-scrolling inline-block w-10px h-10px rounded-full" />
            <i-fa-arrows-v class="h-100% text-xs"/>
          </button>
        </HotkeyTooltip>
    </template>
  </ReporterHeaderLayout>
</template>

<script lang="ts">
import { useStatsStore, TestsByState } from '../store/reporter-store'
import RunnableStat from "./RunnableStat.vue";
import RunnableDuration from './RunnableDuration.vue'
import {HotkeyTooltip} from '../components/Tooltip'
import ReporterHeaderLayout from './ReporterHeaderLayout.vue'
import { computed, PropType, defineComponent } from 'vue'

import text from '../i18n/reporter-text'

type ValidRunStates = 'running' | 'paused'

export default defineComponent({
  components: {
    ReporterHeaderLayout,
    HotkeyTooltip,
    RunnableDuration,
    RunnableStat
  },
  props: {
    runState: String as PropType<ValidRunStates>,
    autoScrolling: Boolean,
    stats: {
      type: Object as PropType<TestsByState>,
      required: true
    }
  },
  emits: ['pause', 'restart'],
  setup(props, {emit}) {
    const statsStore = useStatsStore()

    return {
      // Timer
      duration: computed(() => statsStore.duration),

      // Play/Pause
      showPause: computed(() => props.runState === 'running'),
      playControl: computed(() => {
        if (props.runState === 'running') {
          return {
            text: text.stopTests,
            method: () => emit('pause'),
            hotkey: 'B'
          }
        }
        return {
          text: text.rerunTests,
          method: () => emit('restart'),
          hotkey: 'R'
        }
      }),

      // Stats
      numberFailed: computed(() => props.stats.failed),
      numberPassed: computed(() => props.stats.passed),
      numberPending: computed(() => props.stats.pending),

      // Auto-scroll
      autoScrollText: computed(() => {
        return props.autoScrolling ? text.disableAutoScrolling : text.enableAutoScrolling
      }),
      autoScrollingColor: computed(() => props.autoScrolling ? 'orange' : 'gray')

    }
  }
})
</script>

<style lang="scss">
button {
  background: none;
  border-radius: none;
}

.auto-scrolling {
  background: v-bind(autoScrollingColor);
}
</style>
