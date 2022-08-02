<template>
  <v-app>
    <nav-bar />
    <v-content>
      <v-container id="home">
        <router-view></router-view>
      </v-container>
    </v-content>
    <v-footer class="pa-3">
      <v-layout justify-center class="font-weight-thin">
        &copy; {{ new Date().getFullYear() }} Noah Gegner and Jackson Miller
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script>
import NavBar from "./components/NavBar.vue";

export default {
  name: "App",
  components: {
    NavBar,
  },
};
</script>

<style scoped>
  #home {
    background-size: cover;
  }
</style>


