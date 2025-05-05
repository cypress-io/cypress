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
        <IconActionTap
          size="16"
          stroke-color="gray-500"
          fill-color="gray-900"
        />
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
      <code class="code">
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
import { IconActionDeleteSmall, IconActionTap } from '@cypress-design/vue-icon'
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

<style scoped lang="scss">
@import "./assertions-style.scss";

// NOTE: This is needed because the icon component css is not imported in this component
.icon-dark-gray-500 {
  fill: $gray-500;
}

// NOTE: This is needed because the icon component css is not imported in this component
.icon-light-gray-900 {
  fill: $gray-900;
}

.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.assertions-menu {
  @include menu-style;

  font-weight: normal;
  font-family: $font-system;
  z-index: 2147483647;
  width: 225px;
  position: absolute;
  color: $gray-300;

  .header {
    align-items: center;
    background: $gray-1100;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    color: $gray-300;
    display: flex;
    padding: 8px;
    border-bottom: 1px solid $gray-900;
    font-weight: 500;

    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0.4rem 0.6rem;

      span {
        font-size: 14px;
        font-weight: 500;
        color: $gray-100;
      }
    }

    .close-wrapper {
      margin-left: auto;
      margin-top: -2.5px;
      margin-right: 8px;

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
    padding: 14px 9px;
    margin: 0 8px;
    color: $gray-500;
    font-size: 14px;
  }

  .code {
    font-size: 12px;
    font-weight: 500;
    color: $white;
    border-radius: 4px;
    border: 1px solid $gray-900;
    line-height: 20px;
    padding: 4px;
  }

  .assertions-list {
    padding: 8px;
  }
}
</style>
