<template>
  <ul :class="`runnables ${root && 'root-suite'}`" style="height: 100%;">
    <li v-for="runnable in runnables" :key="runnable.id" style="height: 100%;">
      <div v-if="runnable.type === 'suite'" class="suite-wrapper">
        <RunnableSuite :suite="runnable">
          <template #title>
            <div class="test bg-orange-50 hover:bg-orange-200"><strong>Suite:</strong> {{ runnable.title }}</div>
          </template>
          <RunnablesList :runnables="runnable.children"></RunnablesList>
        </RunnableSuite>
      </div>
      <RunnableTest v-else class="test-wrapper" :test="runnable" style="height: 100%;">
        <template #title>
          {{ runnable.state }}<strong>Test:</strong> {{ runnable.title }}
        </template>
      </RunnableTest>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import RunnableSuite from './RunnableSuite.vue'
import RunnableTest from './RunnableTest.vue';

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
    components: { RunnableSuite, RunnableTest }
})
</script>

<style lang="scss" scoped>
.root-suite {
  display: block;
  position: relative;
  overflow: hidden;
}

.suite-wrapper,.test-wrapper {
  
}
</style>