<template>
  <div
    ref="highlight"
    class="highlight"
    :style="highlightStyle"
  />
  <div
    ref="assertionsMenu"
    class="assertions-menu"
  >
    <div class="header">
      <div class="title">
        <span>Add Assertion</span>
      </div>
      <div class="close-wrapper">
        <a
          class="close"
          @click.stop="onClose"
        >&times;</a>
      </div>
    </div>
    <div
      class="subtitle"
    >
      expect
      {{ ' ' }}
      <code>
        {{ tagName }}
      </code>
      {{ ' ' }}
      to
    </div>
    <div
      class="assertions-list"
    >
      <AssertionType
        v-for="(assertion) in possibleAssertions"
        :key="assertion.type"
        :type="assertion.type"
        :options="assertion.options"
        @add-assertion="onAddAssertion"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createPopper } from '@popperjs/core'
import AssertionType from './AssertionType.ce.vue'
import _ from 'lodash'
import { nextTick, onMounted, Ref, ref, StyleValue } from 'vue'
import type { PossibleAssertions, AddAssertion, AssertionArgs } from './types'

const props = defineProps <{
  jqueryElement: JQuery<HTMLElement>
  possibleAssertions: PossibleAssertions
  addAssertion: AddAssertion
  closeMenu: () => void
  highlightStyle: StyleValue
}>()

const onAddAssertion = ({ type, name, value }: {
  type: string
  name?: string
  value?: string
}) => {
  let args = [type, name, value]

  args = _.compact(args)
  props.addAssertion(props.jqueryElement, ...args as AssertionArgs)
}

const onClose = () => {
  props.closeMenu()
}

const tagName = `<${props.jqueryElement.prop('tagName').toLowerCase()}>`

const highlight: Ref<HTMLElement | null> = ref(null)
const assertionsMenu: Ref<HTMLElement | null> = ref(null)

onMounted(() => {
  nextTick(() => {
    const highlightEl = highlight.value as HTMLElement
    const assertionsMenuEl = assertionsMenu.value as HTMLElement

    createPopper(highlightEl, assertionsMenuEl, {
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            altAxis: true,
          },
        },
      ],
    })
  })
})
</script>

<style lang="scss">
@import "./assertions-style.scss";

.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.assertions-menu {
  @include menu-style;

  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  z-index: 2147483647;
  width: 175px;
  position: absolute;

  .header {
    align-items: center;
    background: #07b282;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    color: #fff;
    display: flex;
    padding: 0.5rem 0.7rem;

    .title {
      font-size: 14px;
      font-weight: 600;
    }

    .close-wrapper {
      margin-left: auto;
      margin-top: -2.5px;

      .close {
        font-size: 18px;
        font-weight: 500;

        &:hover, &:focus, &:active {
          cursor: pointer;
          color: #eee;
        }
      }
    }
  }

  .subtitle {
    border-bottom: 1px solid #c4c4c4;
    color: #6b6b6b;
    font-size: 13px;
    font-style: italic;
    font-weight: 400;
    padding: 0.5rem 0.7rem;

    code {
      font-weight: 600;
    }
  }
}
</style>
