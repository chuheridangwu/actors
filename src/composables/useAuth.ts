import { ref, computed } from 'vue'

// 认证状态
const isAuthenticated = ref(false)
const loginError = ref('')

// 从环境变量获取预定义密码
const CORRECT_PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD || 'admin123'

/**
 * 认证相关的composable
 */
export function useAuth() {
  /**
   * 登录验证
   * @param password 用户输入的密码
   * @returns 是否登录成功
   */
  const login = (password: string): boolean => {
    loginError.value = ''
    
    if (!password) {
      loginError.value = '请输入密码'
      return false
    }
    
    if (password === CORRECT_PASSWORD) {
      isAuthenticated.value = true
      loginError.value = ''
      
      // 将认证状态保存到localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('authTimestamp', Date.now().toString())
      
      return true
    } else {
      loginError.value = '密码错误，请重试'
      return false
    }
  }
  
  /**
   * 登出
   */
  const logout = () => {
    isAuthenticated.value = false
    loginError.value = ''
    
    // 清除localStorage中的认证状态
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('authTimestamp')
  }
  
  /**
   * 检查认证状态
   * 从localStorage恢复认证状态，但有时效性检查
   */
  const checkAuthStatus = () => {
    const storedAuth = localStorage.getItem('isAuthenticated')
    const authTimestamp = localStorage.getItem('authTimestamp')
    
    if (storedAuth === 'true' && authTimestamp) {
      const timestamp = parseInt(authTimestamp)
      const now = Date.now()
      const EIGHT_HOURS = 8 * 60 * 60 * 1000 // 8小时有效期
      
      // 检查是否在有效期内
      if (now - timestamp < EIGHT_HOURS) {
        isAuthenticated.value = true
      } else {
        // 超过有效期，清除认证状态
        logout()
      }
    }
  }
  
  /**
   * 清除错误信息
   */
  const clearError = () => {
    loginError.value = ''
  }
  
  // 计算属性
  const hasError = computed(() => !!loginError.value)
  
  return {
    // 状态
    isAuthenticated: computed(() => isAuthenticated.value),
    loginError: computed(() => loginError.value),
    hasError,
    
    // 方法
    login,
    logout,
    checkAuthStatus,
    clearError
  }
}
