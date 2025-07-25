<template>
  <div class="auth-guard">
    <!-- 登录页面 -->
    <LoginView v-if="!isAuthenticated" />
    
    <!-- 已认证的内容 -->
    <div v-else class="authenticated-content">
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">演员作品管理系统</h1>
          <div class="header-actions">
            <span class="welcome-text">欢迎使用</span>
            <button @click="handleLogout" class="logout-button">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </header>
      
      <!-- 主要内容区域 -->
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import LoginView from '@/views/LoginView.vue'

// 使用认证composable
const { isAuthenticated, logout, checkAuthStatus } = useAuth()

/**
 * 处理登出
 */
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    logout()
  }
}

/**
 * 组件挂载时检查认证状态
 */
onMounted(() => {
  checkAuthStatus()
})
</script>

<style scoped>
.auth-guard {
  min-height: 100vh;
}

.authenticated-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  font-size: 14px;
  color: #6b7280;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.main-content {
  flex: 1;
  background: #f9fafb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .welcome-text {
    display: none;
  }
  
  .logout-button {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>
