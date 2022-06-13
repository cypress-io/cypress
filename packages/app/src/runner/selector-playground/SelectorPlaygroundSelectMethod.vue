<template>
  <button class="relative">
    <div class="option get">
      cy.get
    </div>
    <div class="option contains">
      cy.contains
    </div>
  </button>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.option {
  height: 24px;
  @apply absolute;
}

.get {
  top: 0px;
}

.contains {
  top: 24px;
}

</style>
