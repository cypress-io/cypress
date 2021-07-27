<template>
  <ul :class="`${root && 'root-suite'} block font-sm text-gray-800`">
    <li v-for="runnable in runnables" :key="runnable.id">
      <div>
        <Runnable :runnable="runnable">
          <div v-for="hook in runnable.hooks"></div>
          <RunnablesList :runnables="runnable.children"/>
        </Runnable>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { SuiteModel } from '../store/reporter-store';
import Runnable from './Runnable.vue'

export default defineComponent({
    name: "runnables-list",
    props: {
      runnables: {
        type: Array as PropType<SuiteModel[]>
      },
      root: {
        type: Boolean,
      }
    },
    setup(props) {
        return {
            level: computed(() => {
                if (props.runnables && props.runnables.length) {
                    return props.runnables[0].level;
                }
                return 0;
            })
        };
    },
    components: { Runnable }
})
</script>

<style lang="scss" scoped>
.root-suite {
  @apply text-size-13px text-warm-gray-800;
  position: relative;
  overflow: hidden;
}

</style>