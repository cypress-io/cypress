<template>
  <div>
    <ReporterHeader/>
    <RunnableHeader>
      {{ store.spec.name }}
    </RunnableHeader>
    <RunnablesList v-if="store.ready" :runnables="store.runnables" />
    <div v-else>Loading</div>
  </div>
</template>

<script lang="ts">
import $ from 'jquery'
import { defineComponent, computed, watch } from "vue";
import  { useStore } from './store'
import ReporterHeader from './header/ReporterHeader.vue'
import RunnableHeader from './runnables/RunnableHeader.vue'
import RunnablesList from './runnables/RunnablesList.vue'
import { useMagicKeys } from './composables/core'
// import TestReporterList from './TestReporterList.vue'

const { z } = useMagicKeys()
  watch(z, () => {
    console.log('z')
    // reporterStore.restart()
  })

export default defineComponent({
  components: {
    // TestReporterList,
    ReporterHeader, 
    RunnableHeader,
    RunnablesList
  },
  props: ['reporterBus', 'state'],
  setup(props) {
    window.reporterBus = props.reporterBus
    const store = useStore()
    store.init(props.reporterBus, props.state)
    return {
      store
    }
  }
})
</script>
