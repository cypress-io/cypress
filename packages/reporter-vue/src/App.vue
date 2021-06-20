<template>
  <div>
    <ReporterHeader/>
    <RunnableHeader>
        my/spec/file.spec.js
    </RunnableHeader>
    <RunnablesList v-if="reporterStore.ready" :runnables="runnables" />
    <div v-else>Loading</div>
  </div>
</template>

<script lang="ts">
import $ from 'jquery'
import { defineComponent, computed, watch } from "vue";
import { useReporterStore, useRunnablesStore } from './store'
import ReporterHeader from './header/ReporterHeader.vue'
import RunnableHeader from './runnables/RunnableHeader.vue'
import RunnablesList from './runnables/RunnablesList.vue'
import { useMagicKeys } from './composables/core'

const { z } = useMagicKeys()
  watch(z, () => {
    console.log('z')
    // reporterStore.restart()
  })

export default defineComponent({
  components: {
    ReporterHeader, 
    RunnableHeader,
    RunnablesList
  },
  props: ['reporterBus', 'state'],
  setup(props) {
    window.reporterBus = props.reporterBus
    const reporterStore = useReporterStore();
    const runnablesStore = useRunnablesStore();
  
    reporterStore.init(props.reporterBus)

    const runnables = computed(() => runnablesStore.runnables)
    return { runnables, reporterStore }
  }
})
</script>
