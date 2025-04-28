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
    <div
      class="header"
      data-cy="assertions-menu-header"
    >
      <div class="title">
        <span>Assert</span>
      </div>
      <div class="close-wrapper">
        <a
          data-cy="assertions-menu-close"
          tabindex="0"
          role="button"
          class="close"
          @keydown.enter="onClose"
          @keydown.space="onClose"
          @click.stop="onClose"
        >
          <IconActionDeleteSmall />
        </a>
      </div>
    </div>
    <div
      class="subtitle"
      data-cy="assertions-subtitle"
    >
      Expect
      {{ ' ' }}
      <Tag
        size="20"
        color="gray"
      >
        {{ tagName }}
      </Tag>
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
import { IconActionDeleteSmall } from '@cypress-design/vue-icon'
import Tag from '@cypress-design/vue-tag'
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

  font-weight: normal;
  z-index: 2147483647;
  width: 225px;
  position: absolute;
  color: $gray-300;
  border: 1px solid #9aa2fc;
  box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
  -webkit-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
  -moz-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);

  .header {
    align-items: center;
    background: $gray-1100;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    color: $gray-300;
    display: flex;
    padding: 8px 17px;
    border-bottom: 1px solid $gray-900;
    font-weight: 500;

    .title {
      font-size: 14px;
      font-weight: 600;
    }

    .close-wrapper {
      margin-left: auto;
      margin-top: -2.5px;

      .close {
        &:hover, &:focus, &:active {
          cursor: pointer;
          color: #eee;

        }

        &:focus {
          outline-color: #9aa2fc;
        }
      }
    }
  }

  .subtitle {
    border-bottom: 1px solid $gray-900;
    padding: 14px 17px;
    color: $gray-500;
    font-size: 14px;
  }

  .assertions-list {
    padding: 8px;
  }
}
</style>
