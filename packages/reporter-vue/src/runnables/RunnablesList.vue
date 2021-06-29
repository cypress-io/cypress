<template>
  <ul :class="`${root && 'root-suite'} block font-sm text-gray-800`">
    <li v-for="runnable in runnables" :key="runnable.id">
      <div>
        <Runnable :runnable="runnable">
          <template #title>
            <!-- <div class="test bg-orange-50 hover:bg-orange-200"><strong>Suite:</strong> {{ runnable.title }}</div> -->
          </template>
          <RunnablesList :runnables="runnable.children"></RunnablesList>
        </Runnable>
      </div>
      <!-- <RunnableTest v-else class="test-wrapper" :test="runnable" style="height: 100%;">
        <template #title>
          {{ runnable.state }}<strong>Test:</strong> {{ runnable.title }}
        </template>
      </RunnableTest> -->
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import Runnable from './Runnable.vue'
// import RunnableTest from './RunnableTest.vue';

export default defineComponent({
    name: "runnables-list",
    props: ["runnables", "root"],
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