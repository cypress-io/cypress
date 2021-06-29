<template>
    <li :class="classNames">
      <slot name="default"></slot>
    </li>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import type { PropType } from 'vue'
import type { Test, Suite } from './types'

const { runnable } = defineProps({
  runnable: {
    type: Object as PropType<Test|Suite>,
  },
})

const classNames = computed(() => ([
  runnable.type,
  runnable.state,
  runnable.hasRetried ? 'retried' : ''
]))
</script>

<style scoped lang="scss">

$fail: red;
$pass: green;
$retried: yellow;
$pending: lightgray;

// @mixin runnable-state-active {
//     @extend .#{$fa-css-prefix}-sync-alt;
//     @extend .#{$fa-css-prefix}-spin;
// }

// @mixin runnable-state-processing {
//     @extend .far;
//     @extend .#{$fa-css-prefix}-square;
//     color: #888;

//     // @extend .far overrides line-height, and so do many other specific selectors.
//     line-height: 18px !important;
// }

// @mixin runnable-state-skipped {
//     @extend .#{$fa-css-prefix}-ban;
//     color: #888;
// }

// @mixin runnable-state-failed {
//     @extend .#{$fa-css-prefix}-times;
//     color: $fail;
// }

// @mixin runnable-state-passed {
//     @extend .#{$fa-css-prefix}-check;
//     color: $pass;
// }

// @mixin runnable-state-pending {
//     @extend .#{$fa-css-prefix}-circle-notch;
//     color: lighten($pending, 20%);
// }

  .runnable {
    width: 100%;
    color: #6c6c6c;
    background-color: #fff;
    overflow: auto;
    line-height: 18px;
    padding-left: 0;

    .runnable-wrapper {
      border-left: 5px solid transparent;
      padding: 0;

      .collapsible-header {
        &:focus {
          .collapsible-header-inner {
            background-color: #f7f8f9;
            cursor: pointer;
          }
        }

        .collapsible-header-inner {
          &:hover {
            background-color: #f7f8f9;
            cursor: pointer;
          }

          &:focus {
            outline: 0;
          }

          height: 100%;
          padding: 5px 15px 5px 5px;
          width: 100%;
        }
      }

      &:hover {
        .runnable-controls-studio {
          opacity: 0.5;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .attempt-item:hover {
      > .runnable-wrapper .runnable-controls i.fa-redo {
        visibility: visible !important;
      }

      .hooks-container, .runnable-err-wrapper {
        border-color: #828282;
      }
    }

    &.runnable-active {
      .runnable-state {
        // @include runnable-state-active;
      }
    }

    .runnable-state,.attempt-state {
      display: inline-block;
      line-height: 18px;
      margin-right: 5px;
      min-width: 12px;
      height: 18px;
      text-align: center;
      font-size: 11px;
    }

    &.suite .collapsible-indicator  {
      padding-left: 2px;
      font-size: 14px;
      color: #bbbcbd;
    }


    &.test.runnable-processing  {
      .runnable-state {
        // @include runnable-state-processing;
      }
    }

    &.runnable-failed > div > .runnable-wrapper,
    &.runnable-failed > div > .runnable-instruments {
      border-left: 5px solid $fail;

      .fa-exclamation-triangle.has-command-failures {
        visibility: visible;
      }
    }

    &.runnable-pending > div > .runnable-wrapper,
    &.runnable-pending > div > .runnable-instruments {
      border-left: 5px solid lighten($pending, 25%);
      padding-bottom: 0;
    }

    &.runnable-passed > div > .runnable-wrapper,
    &.runnable-passed > div > .runnable-instruments {
      border-left: 5px solid $pass;
    }

    .runnable-retried > div > .runnable-wrapper,
    .runnable-retried > div > .runnable-instruments {
      border-left: 5px solid $retried;
    }

    &.runnable-studio.runnable-passed > div > .runnable-wrapper,
    &.runnable-studio.runnable-passed > div > .runnable-instruments {
      border-left: 5px solid #3386d4;
    }

    &.runnable-skipped > .runnable-wrapper {
      .runnable-state {
        // @include runnable-state-skipped;
      }

      .runnable-title {
        color: #aaa;
      }
    }

    &.runnable-skipped > div > .runnable-wrapper,
    &.runnable-skipped > div > .runnable-instruments {
      border-left: 5px solid #9a9aaa;
    }

    &.test.runnable-failed {
      .runnable-state {
        // @include runnable-state-failed;
      }
    }

    &.suite > div > .runnable-wrapper {
      .runnable-title {
        color: #111;
        font-size: 13px;
      }
    }

    &.test.runnable-passed {
      .runnable-state {
        // @include runnable-state-passed;
      }
    }
  }
</style>