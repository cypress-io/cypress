<template>
    <img src="../images/success.svg" class="mx-auto my-10"/>
    <div class="text-center">
        <Button>Open Chrome</Button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Button from "../components/button/Button.vue"

export default defineComponent({
    setup() {
    },
    components: { Button }
})
</script>
