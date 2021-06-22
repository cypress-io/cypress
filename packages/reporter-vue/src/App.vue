<template>
  <div class="headers">
    <ReporterHeader/>
    <RunnableHeader>
      {{ store.spec.name }}
    </RunnableHeader>
  </div>
  <div id="scroller" ref="scroller" v-if="true">
    <RunnablesList v-if="store.ready" :runnables="store.runnablesTree"/>
    <div v-else>Loading</div>
    <!-- <div id="anchor"/> -->
  </div>

</template>

<script lang="ts">
import $ from 'jquery'
import { defineComponent, computed, watch, onMounted, ref } from "vue";
import  { useStore } from './store'
import ReporterHeader from './header/ReporterHeader.vue'
import RunnableHeader from './runnables/RunnableHeader.vue'
import RunnablesList from './runnables/RunnablesList.vue'
import { whenever, useMagicKeys } from './composables/core'
import { useScroller } from './scroller'

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
    const scroller = ref(null)
    const run = ref('')        
    store.init(props.reporterBus, props.state, run)

    // App Keybindings
    const { r } = useMagicKeys()
    watch(r, () => {
      store.restart()
    })

    // scrolling
    const { pause }: any = useScroller(scroller)
    watch(run, (runState) => {
      if (runState === 'end') {
        pause.value()
      }
    })

    return {
      store,
      scroller
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


// #scroller * {
//     /* don't allow the children of the scrollable element to be selected as an anchor node */
//     overflow-anchor: none;
// }

// #anchor {
//     /* allow the final child to be selected as an anchor node */
//     overflow-anchor: auto;

//     /* anchor nodes are required to have non-zero area */
//     height: 1px;
// }
</style>

<style>
#vue-app {
  overflow: auto;
  height: 100%;
  position: relative
}
</style>
