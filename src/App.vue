<template>
  <div id="app">
    <UserLearning></UserLearning>
  </div>
</template>

<script>
import UserLearning from "@/components/UserLearning";

export default {
  name: 'App',
  components: {
    UserLearning,
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
