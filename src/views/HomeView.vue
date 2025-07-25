<script setup lang="ts">
import { AirtableService } from "@/services/airtable";
import { ElButton, ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const tags = ref<string[]>([]);
const loading = ref(false);
const hasSelectedRecords = ref(false);

// 缓存机制
const cachedTags = ref<string[]>([]);
const cachedSelectedRecords = ref<any[]>([]);
const lastCacheTime = ref<number>(0);
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

const isCacheValid = (): boolean => {
  return Date.now() - lastCacheTime.value < CACHE_DURATION;
};

// 获取所有标签（使用缓存）
const loadTags = async () => {
  if (isCacheValid() && cachedTags.value.length > 0) {
    tags.value = cachedTags.value;
    return;
  }

  loading.value = true;
  try {
    tags.value = await AirtableService.getAllTags();
    cachedTags.value = tags.value;
    lastCacheTime.value = Date.now();
  } catch (error) {
    ElMessage.error("加载标签失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 检查是否有提交记录（使用缓存）
const checkSelectedRecords = async () => {
  try {
    let records;
    if (isCacheValid() && cachedSelectedRecords.value.length > 0) {
      records = cachedSelectedRecords.value;
    } else {
      records = await AirtableService.getSelectedRecords();
      cachedSelectedRecords.value = records;
      lastCacheTime.value = Date.now();
    }
    hasSelectedRecords.value = records.length > 0;
  } catch (error) {
    console.error("检查提交记录失败:", error);
  }
};

// 点击标签按钮
const handleTagClick = (tag: string) => {
  router.push(`/actors/${encodeURIComponent(tag)}`);
};

// 查看历史记录
const viewHistory = () => {
  router.push("/selected-works");
};

// 初始化数据（并行加载，减少API调用）
const initializeData = async () => {
  loading.value = true;
  try {
    // 如果缓存有效，直接使用缓存
    if (isCacheValid() && cachedTags.value.length > 0) {
      tags.value = cachedTags.value;
      hasSelectedRecords.value = cachedSelectedRecords.value.length > 0;
      return;
    }

    // 并行加载标签和提交记录
    const [tagsData, recordsData] = await Promise.all([
      AirtableService.getAllTags(),
      AirtableService.getSelectedRecords(),
    ]);

    tags.value = tagsData;
    hasSelectedRecords.value = recordsData.length > 0;

    // 更新缓存
    cachedTags.value = tagsData;
    cachedSelectedRecords.value = recordsData;
    lastCacheTime.value = Date.now();
  } catch (error) {
    ElMessage.error("加载数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initializeData();
});
</script>

<template>
  <div class="home-container">
    <div class="header">
      <h1>演员作品管理系统</h1>
      <p>选择标签查看对应类别的演员</p>

      <!-- 历史记录按钮 -->
      <div v-if="hasSelectedRecords" class="history-section">
        <el-button
          type="success"
          size="large"
          @click="viewHistory"
          class="history-button"
        >
          📋 查看提交历史记录
        </el-button>
      </div>
    </div>

    <div class="tags-section" v-loading="loading">
      <div class="tags-grid">
        <el-button
          v-for="tag in tags"
          :key="tag"
          type="primary"
          size="large"
          class="tag-button"
          @click="handleTagClick(tag)"
        >
          {{ tag }}
        </el-button>
      </div>

      <div v-if="!loading && tags.length === 0" class="empty-state">
        <p>暂无可用标签</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

.header {
  margin-bottom: 60px;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 16px;
  font-weight: 600;
}

.header p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin: 0;
}

.history-section {
  margin-top: 24px;
}

.history-button {
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
}

.tags-section {
  min-height: 200px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.tag-button {
  height: 60px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tag-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #95a5a6;
  font-size: 1.1rem;
}

/* 大屏PC端优化 */
@media (min-width: 1200px) {
  .home-container {
    padding: 60px 40px;
  }

  .header {
    margin-bottom: 80px;
  }

  .header h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  .header p {
    font-size: 1.3rem;
  }

  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
    max-width: 1000px;
  }

  .tag-button {
    height: 70px;
    font-size: 1.2rem;
    font-weight: 600;
  }
}

/* 中等PC端优化 */
@media (min-width: 1025px) and (max-width: 1199px) {
  .home-container {
    padding: 50px 30px;
  }

  .header {
    margin-bottom: 70px;
  }

  .header h1 {
    font-size: 2.7rem;
  }

  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    max-width: 900px;
  }

  .tag-button {
    height: 65px;
    font-size: 1.1rem;
  }
}

/* 平板适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    max-width: 700px;
  }

  .tag-button {
    height: 55px;
    font-size: 1rem;
  }
}

/* 手机端适配 */
@media (max-width: 768px) and (min-width: 481px) {
  .home-container {
    padding: 20px 16px;
  }

  .header {
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  .header p {
    font-size: 1.1rem;
  }

  .tags-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    max-width: 500px;
  }

  .tag-button {
    height: 50px;
    font-size: 0.95rem;
    border-radius: 10px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .home-container {
    padding: 16px 12px;
  }

  .header {
    margin-bottom: 32px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .header p {
    font-size: 1rem;
  }

  .tags-grid {
    grid-template-columns: 1fr;
    max-width: 300px;
    gap: 12px;
  }

  .tag-button {
    height: 48px;
    font-size: 0.9rem;
    border-radius: 8px;
  }
}
</style>
