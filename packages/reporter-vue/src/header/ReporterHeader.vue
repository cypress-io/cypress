<template>
  <ReporterHeaderLayout data-cy="reporter-header">
    <!-- Three stats (passed, failed, pending)-->
    <template #runnables>
      <RunnableStat type="passed" :number="runnables.testsByState.passed.length"/>
      <RunnableStat type="failed" :number="runnables.testsByState.failed.length"/>
      <RunnableStat type="pending" :number="runnables.testsByState.pending.length"/>
    </template>

    <!-- Timer -->
    <template #duration>
      <RunnableDuration class="duration" :duration="duration" />
    </template>

    <!-- Controls (auto-scrolling and play-pause) -->
    <template #controls>
      <HotkeyTooltip :content="playControl.text" :hotkey="playControl.hotkey">
          <button @click="playControl.method" class="hidden">
            <i-fa-repeat v-if="reporter.runState === 'running'"/>
            <i-fa-pause v-else />
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
// import { useStatsStore, useReporterStore } from "../store";
import { useStatsStore, useReporterStore  } from '../store/reporter-store'
import RunnableStat from "./RunnableStat.vue";
import RunnableDuration from './RunnableDuration.vue'
import {HotkeyTooltip} from '../components/Tooltip'
import ReporterHeaderLayout from './ReporterHeaderLayout.vue'
import { computed, defineComponent } from 'vue'
import text from '../i18n/reporter-text'

export default defineComponent({
  components: {
    RunnableStat,
    HotkeyTooltip,
    ReporterHeaderLayout,
    RunnableDuration
  },
  setup() {
    const reporter = useReporterStore()
    const stats = useStatsStore()

    const playControl = computed(() => {
      if (reporter.state === 'running') {
        return {
          text: text.stopTests,
          method: reporter.stopRunning,
          hotkey: 'B'
        }
      }
      return {
        text: text.rerunTests,
        method: reporter.restart,
        hotkey: 'R'
      }
    })

    const autoScrollText = computed(() => {
      return reporter.autoScrolling ? text.disableAutoScrolling : text.enableAutoScrolling
    })

    return {
      autoScrollText,
      playControl,
      duration: computed(() => stats.duration),
      runnables: computed(() => reporter.runnables),
      reporter,

      // TODO: Windicss tree-shaken stylesheets are stripping the bg-amber-500 etc colors. Add to allow-list.
      autoScrollingColor: computed(() => reporter.autoScrolling ? 'orange' : 'gray'),
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
