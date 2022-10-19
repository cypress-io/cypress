<template>
  <div
    ref="popper"
    class="assertion-options"
    :style="{ position: 'absolute' }"
  >
    <div
      v-for="{ name, value } in options"
      :key="`${name}${value}`"
      class="assertion-option"
      @click.stop="() => onClick(name, value)"
    >
      <span
        v-if="name"
        class="assertion-option-name"
      >
        {{ truncate(name) }}:{{ ' ' }}
      </span>
      <span
        v-else
        class="assertion-option-value"
      >
        {{ truncate(value) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computePosition } from '@floating-ui/dom'
import { onMounted, ref, nextTick, Ref } from 'vue'

const props = defineProps<{
  type: string
  addAssertion: any
  options: any
  setPopperElement: any
}>()

const truncate = (str) => {
  if (str && str.length > 80) {
    return `${str.substr(0, 77)}...`
  }

  return str
}

const popper: Ref<HTMLElement | null> = ref(null)

onMounted(() => {
  nextTick(() => {
    const popperEl = popper.value as HTMLElement
    const reference = popperEl.parentElement as HTMLElement

    computePosition(reference, popperEl, {
      placement: 'right-start',
      middleware: [],
    }).then(({ x, y }) => {
      Object.assign(popperEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      })
    })

    props.setPopperElement(popperEl)
  })
})

const onClick = (name, value) => {
  props.addAssertion(props.type, name, value)
}
</script>

<style lang="scss">
@import './assertions-style.scss';

.assertion-options {
  @include menu-style;

  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  overflow-wrap: break-word;

  .assertion-option {
    cursor: pointer;
    padding: 0.4rem 0.6rem;

    &:hover {
      background-color: #e9ecef;
    }

    .assertion-option-value {
      font-weight: 600;
    }
  }
}
</style>
