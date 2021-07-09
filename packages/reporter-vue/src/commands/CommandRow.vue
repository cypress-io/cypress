<template>
  <div class="command-row" :class="{ [size]: true, ...$attrs.class }"
  @click="onSelect"
  @mouseenter="hovering = true"
  @mouseleave="hovering = false">
    <div class="position"><slot name="position" v-bind="{ selected, hovering }"></slot></div>
    <div class="command-name"><slot name="name" v-bind="{ selected, hovering }"></slot></div>
    <div class="command-message"><slot name="message" v-bind="{ selected, hovering }"></slot></div>
    <div class="command-meta"><slot name="meta" v-bind="{ selected, hovering }"></slot></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue'

export default defineComponent({
  props: {
    command: {},
    idx: {},
    size: {
      values: ['sm', 'md', 'lg'],
      default: 'lg'
    },
  },
  setup(_, {emit}) {
    const selected = ref(false)
    const hovering = ref(false)
    return {
      selected,
      hovering,
      onSelect(e) {
        emit('select', !selected.value)
        selected.value = !selected.value
      } 
    }
  }
})
</script>

<style lang="scss" scoped>
.lg {
  &.command-row {
    @apply grid overflow-hidden items-center;

    grid-template-columns: min-content minmax(0, 90px) minmax(0, 1fr);

    > * {
      margin-right: 6px;
    }
    > :last-child {
      margin-right: 0;
    }
  }

  .command-meta {
    @apply justify-self-end;
  }

  .position {
    @apply text-center;
  }

  // Overflow the text with ellipsis
  > * {
    @apply whitespace-nowrap overflow-ellipsis overflow-hidden max-w-[100%] leading-loose tracking-wide;
  }
}

// Two rows, truncate text
.md, .sm {
  &.command-row {
    @apply grid gap-4px p-4px;
    overflow: hidden;
    grid-template-columns: 4ch 1fr;
    position: relative;
  }

  & > * {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .position {
    min-width: 4ch;
    grid-row: 1/3;
    align-self: flex-start;
    text-align: center;
  }
}

.position {
  @apply min-w-3ch max-w-3ch flex items-center justify-center;
  // height: auto;
  svg {
    @apply text-size-14px;
  }
}

.command-name {
  @apply font-semibold text-size-11px pr-2px;
  // line-height: 1rem;
}

.command-message {
  @apply mr-5px justify-self-start;
}

.command-row {
  @apply p-2px bg-warm-gray-100 font-mono cursor-pointer hover:bg-warm-gray-200;
}

.command-meta {
  @apply flex gap-2px text-size-11px h-[100%] items-center justify-center text-center;
  grid-column: 4;
  grid-row: 1;
  flex-direction: column;
  min-width: fit-content;
}
</style>