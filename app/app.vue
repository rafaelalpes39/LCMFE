<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
   <v-snackbar
  v-model="snack.show"
  :color="snack.color"
  :text="snack.message"
  :timeout="snack.timeout"
  location="top end"
  variant="elevated"
  rounded="lg"
/>
  </v-app>
</template>

<script setup>
const { snack } = useToast();
</script>
