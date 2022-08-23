<template>
  <button @click="setIsLoginConnectOpen(true)">
    test
  </button>
  <div v-if="loginConnectStore.isLoginConnectOpen">
    hello
  </div>
</template>
<script setup lang="ts">
import { useLoginConnectStore } from '../store/login-connect-store'

const loginConnectStore = useLoginConnectStore()
const { setIsLoginConnectOpen } = loginConnectStore

</script>
