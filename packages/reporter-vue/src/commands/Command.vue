<template>
  <CommandRow :size="size" class="command-row" :class="{ [command.state]: true, selected, 'event': command.event, scaled }" @select="selected = $event">
    <template #position="{ hovering }">
      <div class="position">
        <i-mdi-pin v-if="hovering || selected"></i-mdi-pin>
        <i-fa-spinner v-else-if="command.state === 'pending'" class="w-14px h-14px animate-spin"/>
        <span v-else-if="!command.event === true">{{ idx + 1 }}</span>
      </div>
    </template>
    <template #name="{}">
      <span class="command-name">{{ commandName }}</span>
    </template>
    <template #message="{}">
      <span class="command-message">
        <i-fa-circle v-if="command.renderProps && command.renderProps.indicator" class="indicator" :class="command.renderProps && command.renderProps.indicator"/>
        <span class="message">
          <Markdown v-if="showMarkdown" :source="commandMessage"></Markdown>
          <span v-if="!showMarkdown">{{ commandMessage }}</span>
        </span>
      </span>
    </template>
    <template #meta="{}">
      <span class="command-meta">
        <i-fa-eye-slash v-if="command.visible === false"/>
        <span class="bg-cool-gray-400 px-4px py-4px rounded-md  text-size-10.2px text-white" v-if="command.numElements >= 0">
          {{ command.numElements }}
        </span>
      </span>
    </template>
  </CommandRow>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue'
import Markdown from 'vue3-markdown-it'
import CommandRow from './CommandRow.vue' 
import CommandMessage from './CommandMessage.vue'
export default defineComponent({
  props: {
    command: {},
    idx: {},
    size: {
      values: ['sm', 'md', 'lg'],
      default: 'lg'
    }
  },
  components: { CommandMessage, Markdown, CommandRow },
  setup(props) {
    const showMarkdown = computed(() => props.command.renderProps && props.command.renderProps.message)
    const commandMessage = computed(() => showMarkdown.value ? props.command.renderProps.message : props.command.message)

    return {
      selected: ref(false),
      commandMessage,
      showMarkdown,
      scaled: computed(() => commandMessage.value.length > 200),
      commandName: computed(() => {
        const name = props.command.displayName || props.command.name
        if (!name) return ''
        if (props.command.event === true) {
          return `(${name})`
        }
        return name
      })
    }
  }
})
</script>

<style lang="scss">
// Unscoped, careful with namespaces
.scaled .command-message span * {
  @apply text-xs;
}

</style>

<style lang="scss" scoped>
.failed {
  @apply bg-red-100 text-red-600;
}

.pending, .pending:hover {
  @apply bg-blue-100 text-blue-600;
}

.selected {
  &, &:hover, > * {
    @apply text-violet-600 bg-violet-100;
  }

  // Always show some failure color, even when selected
  &.failed {
    .command-name, .command-message {
        @apply text-red-600;
    }
  }
}

.command-row.event {
  .command-message, .command-name {
    @apply text-cool-gray-400 italic;
  }
}

.command-meta {
  @apply text-cool-gray-400 flex col-auto justify-center items-center h-[calc(100%)] gap-4px w-[calc(100%)];
}

.indicator {
  @apply inline-block w-8px h-8px;
  &.successful {
    @apply text-blue-600;
  }
  &.bad {
    @apply text-amber-500;
  }
}

.command-message {
  @apply grid gap-4px items-center;
  grid-template-columns: auto 1fr;
}
</style>