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

      {{ runState }}
      <HotkeyTooltip :content="playControl.text" :hotkey="playControl.hotkey">
      {{ showPause }}
          <button @click="runState === 'running' ? $emit('pause') : $emit('restart')" data-cy="play-pause-toggle">
            <i-fa-pause v-if="showPause" />
            <i-fa-repeat v-else />
          </button>
        </HotkeyTooltip>

        <HotkeyTooltip :content="autoScrollText" hotkey="A">
          <button @click="() => {}" :aria-label="autoScrollText" class="inline-flex items-center justify-center w-100% h-100%">
            <span class="auto-scrolling inline-block w-10px h-10px rounded-full" />
            <i-fa-arrows-v class="h-100% text-xs"/>
          </button>
        </HotkeyTooltip>
    </template>
  </ReporterHeaderLayout>
</template>

<script lang="ts">
import { useStatsStore, useReporterStore  } from '../store/reporter-store'
import RunnableStat from "./RunnableStat.vue";
import RunnableDuration from './RunnableDuration.vue'
import {HotkeyTooltip} from '../components/Tooltip'
import ReporterHeaderLayout from './ReporterHeaderLayout.vue'
import { computed, defineComponent, PropType } from 'vue'
import type { TestsByState } from '../store/reporter-store'
import text from '../i18n/reporter-text'

type ValidRunStates = 'running' | 'paused'
export default defineComponent({
  components: {
    RunnableStat,
    HotkeyTooltip,
    ReporterHeaderLayout,
    RunnableDuration
  },
  props: {
    runState: String as PropType<ValidRunStates>,
    autoScrolling: Boolean,
    stats: {
      type: Object as PropType<TestsByState>
    }
  },
  setup(props, { emit }) {
    const stats = useStatsStore()
    const playControl = computed(() => {
      if (props.runState === 'running') {
        return {
          text: text.stopTests,
          method: () => {
            emit('pause')
          },
          hotkey: 'B'
        }
      }
      return {
        text: text.rerunTests,
        method: () => emit('restart'),
        hotkey: 'R'
      }
    })

    const autoScrollText = computed(() => {
      return props.autoScrolling ? text.disableAutoScrolling : text.enableAutoScrolling
    })

    return {
      // Header Stats
      numberFailed: computed(() => props.stats.failed),
      numberPassed: computed(() => props.stats.passed),
      numberPending: computed(() => props.stats.pending),

      // Play/Pause logic
      showPause: computed(() => props.runState === 'running'),
      playControl,

      // Timer
      duration: computed(() => stats.duration),

      // TODO: Windicss tree-shaken stylesheets are stripping the bg-amber-500 etc colors. Add to allow-list.
      autoScrollText,
      autoScrollingColor: computed(() => props.autoScrolling ? 'orange' : 'gray'),
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

// .auto-scrolling {
//   width: 10px;
//   height: 10px;
//   border-radius: 100%;
//   display: inline-block;
// }

// .auto-scrolling-enabled {
//   background: yellow;
// }

// .auto-scrolling-disabled {
//   background: gray;
// }
</style>
