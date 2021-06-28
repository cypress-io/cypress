<template>
  <ul class="runnables">
    <li v-for="runnable in runnables" :key="runnable.id">
      <div v-if="runnable.type === 'suite'">
        <div class="bg-yellow-400 hover:bg-yellow-200">
          <strong>Suite:</strong> {{ runnable.title }}
        </div>
          <RunnablesList :runnables="runnable.children"></RunnablesList>
      </div>
      <div v-else class="bg-green-600 hover:bg-green-400 test">
        {{ runnable.level }}

        <strong>Test:</strong> {{ runnable.title }}
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'runnables-list',
  props: ['runnables'],
  setup(props) {
    return {
      level: computed(() => {
        if (props.runnables && props.runnables.length) {
          return props.runnables[0].level
        }
        return 0
      })
    }
  }
})
</script>

<style>
.test {
  padding-left: calc(18px * v-bind(runnables[0].level))
}
</style>