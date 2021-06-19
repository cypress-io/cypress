<script setup lang="ts">
import { autoResetRef } from '@vueuse/core'

const message = autoResetRef('default message', 1000)

const setMessage = () => {
  // here the value will change to 'message has set' but after 1000ms, it will change to 'default message'
  message.value = 'message has set'
}
</script>

<template>
  <div>
    <button @click="setMessage()">
      set message
    </button>
    <p>
      {{ message }}
    </p>
  </div>
</template>
