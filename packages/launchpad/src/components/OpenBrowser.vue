<template>
    <img src="../images/success.svg" class="mx-auto my-10"/>
    <Button>Open Chrome</Button>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue"
import { useStoreApp } from "../store/app"
import Button from "./Button.vue"

export default defineComponent({
    setup() {
        const storeApp = useStoreApp();
        onMounted(() => {
            storeApp.setMeta({
                title: "Setup Finished",
                description: "The cypress/cypress.js file was successfully added to your project.Let’s open your browser and start testing some components!"
            });
        });
    },
    components: { Button }
})
</script>