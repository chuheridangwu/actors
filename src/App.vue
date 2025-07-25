<script setup lang="ts">
import AuthGuard from "@/components/AuthGuard.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <div id="app">
    <AuthGuard>
      <RouterView />
    </AuthGuard>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  background-color: #f8fafc;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
