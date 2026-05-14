import { ref } from 'vue'

const snack = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

export const useToast = () => {
  const show = (message, color = 'success', timeout = 3000) => {
    snack.value.show = false          // reset first so it re-triggers
    nextTick(() => {
      snack.value = { show: true, message, color, timeout }
    })
  }

  const success = (msg) => show(msg, 'success')
  const error   = (msg) => show(msg, 'error')
  const info    = (msg) => show(msg, 'info')
  const warning = (msg) => show(msg, 'warning')

  return { snack, success, error, info, warning }
}