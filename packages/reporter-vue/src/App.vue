<template>
  <div class="headers">
    <ReporterHeader/>
    <RunnableHeader>
      {{ store.spec.name }}
    </RunnableHeader>
  </div>
  <div>
    <RunnablesList v-if="store.ready" :runnables="store.runnablesTree"/>
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
    window.vueInitialState = props.state
    const store = useStore()
    
    const { r } = useMagicKeys()
    watch(r, () => {
      store.restart()
    })

    store.init(props.reporterBus, props.state)
    return {
      store
    }
  }
})
</script>

<style scoped lang="scss">
.headers {
  position: sticky;
  top: 0;
  overflow: auto;
  background: white;
}
</style>

<style>
#vue-app {
  overflow: auto;
  height: 100%;
  position: relative
}
</style>
