<template>
  <ReporterHeaderLayout data-cy="reporter-header">
    <!-- Three stats (passed, failed, pending)-->
    <template #runnables>
      <RunnableStat type="passed" :number="stats.byType && stats.byType.passed.length"/>
      <RunnableStat type="failed" :number="stats.byType && stats.byType.failed.length"/>
      <RunnableStat type="pending" :number="stats.byType && stats.byType.pending.length"/>
    </template>

    <!-- Timer -->
    <template #duration>
      <RunnableDuration class="duration" :duration="stats.duration" />
    </template>

    <!-- Controls (auto-scrolling and play-pause) -->
    <template #controls>
      <!-- <PlayControl @click="playControlClicked">
      <AutoScrollControl @click="autoScrollClicked"/> -->

      <HotkeyTooltip :content="playControl.text" :hotkey="playControl.hotkey">
          <button @click="playControl.method">
            <i :class="`fas ${reporter.state === 'running' ? 'fa-pause' : 'fa-redo'}`"/>
          </button>
        </HotkeyTooltip>

        <HotkeyTooltip :content="autoScrollText" hotkey="A">
          <button @click="reporter.toggleAutoScrolling" :aria-label="autoScrollText" :class="autoScrollingClass">
            <span class="auto-scrolling-icon" />
            <i class="fas fa-arrows-alt-v"/>
          </button>
        </HotkeyTooltip>
    </template>
  </ReporterHeaderLayout>
</template>

<script lang="ts">
import { useStatsStore, useReporterStore } from "../store";
import RunnableStat from "./RunnableStat.vue";
import RunnableDuration from './RunnableDuration.vue'
import {HotkeyTooltip} from './Tooltip'
import ReporterHeaderLayout from './ReporterHeaderLayout.vue'
import { computed, defineComponent } from 'vue'
import text from '../i18n'

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

    const autoScrollingClass = computed(() => {
      return [
        reporter.autoScrolling ? 'auto-scrolling-enabled' : 'auto-scrolling-disabled',
        'auto-scrolling'
      ]
    })
    return {
      autoScrollText,
      autoScrollingClass,
      playControl,
      stats,
      reporter
    }
  }
})

</script>

<style lang="scss" scoped>

.auto-scrolling {
  width: 10px;
  height: 10px;
  border-radius: 100%;
  display: inline-block;
}

.auto-scrolling-enabled {
  background: yellow;
}

.auto-scrolling-disabled {
  background: gray;
}
</style>
