export default defineNuxtRouteMiddleware((to, from) => {
  console.log('Middleware triggered')

  const isLoggedIn = true

  if (!isLoggedIn) {
    return navigateTo('/')
  }
})