export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = useCookie('token')
  const config = useRuntimeConfig()
 const store = 'CONNECTED'

  const isLoggedIn = computed(() => !!token.value)

  const login = async (credentials) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/login`, {


        method: 'POST',
        body: credentials
      })

      token.value = response.token
      user.value = response.user

      return response
    } catch (error) {
      throw error
    }
  }

 const logout = async () => {
  try {
    await $fetch(`${config.public.apiBase}/api/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
  } catch (error) {
    console.log('Logout API failed:', error)
  } finally {
    // always clear frontend
    token.value = null
    user.value = null
    navigateTo('/')
  }
}

  const checkAuth = async () => {
    if (!token.value) return

    try {
      const response = await $fetch(`${config.public.apiBase}/api/user`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      user.value = response
    } catch (error) {
      logout()
    }
  }

  return {
    store,
    user,
    token,
    isLoggedIn,
    login,
    logout,
    checkAuth
  }
})