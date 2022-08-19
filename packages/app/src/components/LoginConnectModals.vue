<template>
  <button @click="setIsLoginConnectOpen(true); setUserStatus('loggedOut')">
    test
  </button>
  <div v-if="loginConnectStore.isLoginConnectOpen">
    {{ loginConnectStore.userStatus }}
  </div>
</template>
<script setup lang="ts">
import { useLoginConnectStore } from '../store'

const loginConnectStore = useLoginConnectStore()
const { setUserStatus, setIsLoginConnectOpen } = loginConnectStore

</script>
