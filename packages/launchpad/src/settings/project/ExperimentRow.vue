<template>
  <div role="row" class="grid grid-flow-row">
    <div class="inline leading-loose">
      <h3 class="text-indigo-600 text-lg font-thin inline" role="rowheader">{{ experiment.name }}</h3>
      <span class="bg-purple-100 text-purple-600 rounded-sm text-sm py-2px px-4px ml-12px font-mono">{{ experiment.key }}</span>
    </div>
    <span role="definition" class="text-cool-gray-500 text-sm font-thin">Lorem ipsum dolor sit amet consectetur adipisicing elit. onsectetur adipisicing elit. .</span>
    <div class="
    row-start-1
    row-end-3
    col-start-2
    col-end-auto
    inline-grid
    items-center
    justify-center
    ml-20px
    ">
      <StatusIndicator :type="experiment.enabled ? 'success': 'disabled'">
        {{ experiment.enabled ? 'Enabled' : 'Disabled' }}
      </StatusIndicator>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import StatusIndicator from '../../components/StatusIndicator.vue'

export interface Experiment {
  key: string
  name: string
  description: string
  enabled: boolean
}

export default defineComponent({
  components: {
    StatusIndicator,
  },
  props: {
    experiment: {
      type: Object as PropType<Experiment>,
      required: true
    }
  },
  setup() {
    
  },
})
</script>
