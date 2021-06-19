<template>}
  <HotkeyTooltip v-for="control, controlName in controls"
    :key="controlName" :content="control.text" :hotkey="control.hotkey">
    <button @click="control.method" v-if="control.show">
      <i :class="`fas ${control.icon}`"></i>
    </button>
  </HotkeyTooltip>
</template>

<script lang="ts" setup>
import { PropType, defineProps, computed } from 'vue'
import { ReporterState } from '../store'
import {HotkeyTooltip} from './Tooltip'
import commands from '../composables/useCommands'

const props = defineProps({
  state: { type: String as PropType<ReporterState>}
})

const playpause = computed(() => ({
  rerun: {
    text: 'Run All Tests',
    hotkey: 'R',
    method: commands.rerun,
    show: props.state !== 'running',
    icon: 'fa-redo'
  },
  stopRunning: {
    text: 'Stop Running',
    hotkey: 'B',
    method: commands.stopRunning,
    show: props.state === 'running',
    icon: 'fa-pause',
  },
}))


</script>