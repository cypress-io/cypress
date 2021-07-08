<template>
  <div class="border-l-cool-gray-300 border-l-width-1px border-dotted mt-4px px-12px grid hover:border-l-cool-gray-500" v-if="hook.commands.length">
  <BaseAccordion v-model="open">
    <template #header>
      <span class="hook-header">
        <i-fa-caret-right class="caret text-size-8px" :class="`${open && 'rotate-90'} transform text-cool-gray-400`"/>
        {{hook.hookName}} {{ parens }}</span>
    </template>
    <div class="grid">
      <Command v-for="command, idx in hook.commands" :command="command" :key="command.id" :idx="idx">
        <strong>{{ command.name }}</strong> {{ command.message }}
      </Command>
    </div>
  </BaseAccordion>  
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, } from 'vue'
import Command from '../commands/Command.vue'
import BaseAccordion from '../components/BaseAccordion.vue'

export default defineComponent({
  props: ['hook', 'count', 'idx'],
  components: {
    Command,
    BaseAccordion,
  },
  setup(props) {
    return {
      open: ref(true),
      parens: computed(() => {
        if (props.count > 1) {
          return `(${props.idx + 1})`
        }
        return ''
     })
    }
  }
})
</script>

<style lang="scss" scoped>
.hook-header {
  @apply uppercase select-none text-size-11px py-6px text-cool-gray-400 tracking-wide flex gap-6px items-center text-center;

  &:hover, &:hover .caret {
    @apply text-cool-gray-600;
  }
}
</style>
