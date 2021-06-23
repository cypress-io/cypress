<script setup lang="ts">
import Key from './Key.vue'
import { useMagicKeys } from '.'
import { computed } from 'vue'

const { shift, v, u, e, s, v_u_e, u_s_e, current } = useMagicKeys()
const keys = computed(() => Array.from(current))
</script>

<template>
  <div class="flex flex-col md:flex-row">
    <img
      src="/vue.svg"
      class="h-38 py-8 m-auto transform transistion duration-500"
      :class="{'opacity-0': !v_u_e, 'rotate-180': shift }"
    />

    <div>
      <note class="text-center mt-0 mb-5">
        Press the following keys to test out
      </note>
      <div class="flex gap-3 justify-center">
        <Key :value="v">
          V
        </Key>
        <Key :value="u">
          u
        </Key>
        <Key :value="e">
          e
        </Key>
        <div class="mx-1"></div>
        <Key :value="u">
          U
        </Key>
        <Key :value="s">
          s
        </Key>
        <Key :value="e">
          e
        </Key>
      </div>

      <div class="flex gap-3 justify-center mt-3">
        <Key :value="shift">
          Shift
        </Key>
        <Key :value="v_u_e">
          Vue
        </Key>
        <Key :value="u_s_e">
          Use
        </Key>
      </div>

      <div class="text-center mt-4">
        <Note>Keys Pressed</Note>
        <div class="flex mt-2 justify-center space-x-1 min-h-1.5em">
          <code
            v-for="key in keys"
            :key="key"
            class="font-mono"
          >
            {{ key }}
          </code>
        </div>
      </div>
    </div>

    <img
      src="/favicon.svg"
      class="h-38 py-8 m-auto transform transistion duration-500"
      :class="{'opacity-0': !u_s_e, 'rotate-180': shift }"
    />
  </div>
</template>
