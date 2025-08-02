<script setup lang="ts">
import { AirtableService } from "@/services/airtable";
import type { Actor } from "@/types";
import { Search } from "@element-plus/icons-vue";
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElCard,
  ElEmpty,
  ElInput,
  ElMessage,
  ElRow,
} from "element-plus";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const tag = ref<string>("");
const actors = ref<Actor[]>([]);
const searchQuery = ref("");
const loading = ref(false);

// 解析演员标签
const parseActorTags = (tagsJson: string | undefined): string[] => {
  if (!tagsJson || tagsJson.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(tagsJson);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (tag) => typeof tag === "string" && tag.trim() !== ""
      );
    }
    return [];
  } catch (error) {
    console.warn("解析演员标签失败:", tagsJson, error);
    return [];
  }
};

// 过滤后的演员列表
const filteredActors = computed(() => {
  if (!searchQuery.value) return actors.value;

  return actors.value.filter((actor) =>
    actor.fields.CName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 加载演员数据
const loadActors = async () => {
  loading.value = true;
  try {
    if (tag.value) {
      actors.value = await AirtableService.getActorsByTag(tag.value);
    } else {
      actors.value = await AirtableService.getActors();
    }
  } catch (error) {
    ElMessage.error("加载演员数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 点击演员卡片
const handleActorClick = (actor: Actor) => {
  router.push(`/actor/${encodeURIComponent(actor.fields.CName)}`);
};

// 返回首页
const goHome = () => {
  router.push("/");
};

// 获取面包屑路径
const getBreadcrumbPath = () => {
  if (tag.value) {
    return `${tag.value} 类别演员`;
  }
  return "所有演员";
};

onMounted(() => {
  tag.value = (route.params.tag as string) || "";
  loadActors();
});
</script>

<template>
  <div class="actor-list-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-section">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <a @click="goHome" class="breadcrumb-link">首页</a>
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ getBreadcrumbPath() }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索演员姓名..."
        :prefix-icon="Search"
        size="large"
        class="search-input"
        clearable
      />
    </div>

    <!-- 演员列表 -->
    <div class="actors-section" v-loading="loading">
      <!-- 使用Element Plus的Row和Col组件实现响应式布局 -->
      <el-row v-if="filteredActors.length > 0" :gutter="20" class="actors-row">
        <el-col
          v-for="actor in filteredActors"
          :key="actor.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="4"
          class="actor-col"
        >
          <el-card
            class="actor-card"
            shadow="hover"
            @click="handleActorClick(actor)"
          >
            <div class="actor-content">
              <div class="actor-avatar">
                <img
                  v-if="actor.fields.Avatar"
                  :src="actor.fields.Avatar"
                  :alt="actor.fields.CName"
                  class="avatar-image"
                />
                <div v-else class="avatar-placeholder">
                  {{ actor.fields.CName.charAt(0) }}
                </div>
              </div>
              <div class="actor-info">
                <h3 class="actor-name">{{ actor.fields.CName }}</h3>
                <div class="actor-tags">
                  <span
                    v-for="actorTag in parseActorTags(actor.fields.Tags)"
                    :key="actorTag"
                    class="tag"
                  >
                    {{ actorTag }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty
        v-else-if="!loading"
        description="没有找到匹配的演员"
        class="empty-state"
      />
    </div>
  </div>
</template>

<style scoped>
.actor-list-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb-section {
  margin-bottom: 24px;
}

.breadcrumb-link {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}

.breadcrumb-link:hover {
  color: #66b1ff;
}

.search-section {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;
}

.search-input {
  max-width: 400px;
}

.actors-section {
  min-height: 400px;
}

/* Element Plus响应式布局样式 */
.actors-row {
  margin-bottom: 20px;
}

.actor-col {
  margin-bottom: 20px;
  display: flex;
}

/* 确保所有卡片有一致的最小高度 */
.actor-col .actor-card {
  min-height: 200px;
}

.actor-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 确保Element Plus卡片内容填满整个卡片 */
.actor-card :deep(.el-card__body) {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.actor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.actor-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.actor-avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.avatar-image:hover {
  transform: scale(1.05);
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: transform 0.3s ease;
}

.avatar-placeholder:hover {
  transform: scale(1.05);
}

.actor-info {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.actor-name {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
  word-break: break-word;
}

.actor-tags {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.tag {
  background: #f0f9ff;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid #e0f2fe;
}

.actor-description {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  margin-top: 60px;
}

/* Element Plus响应式优化 */
@media (min-width: 1200px) {
  .actor-list-container {
    padding: 30px 40px;
  }

  .search-section {
    margin-bottom: 40px;
  }

  .search-input {
    max-width: 500px;
  }

  .actor-col .actor-card {
    min-height: 240px;
  }

  .actor-card :deep(.el-card__body) {
    padding: 24px;
  }

  .actor-content {
    gap: 20px;
    padding: 12px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 100px;
    height: 100px;
    font-size: 40px;
  }

  .actor-name {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }
}

/* 平板适配 */
@media (max-width: 1199px) and (min-width: 992px) {
  .actor-col .actor-card {
    min-height: 220px;
  }

  .actor-card :deep(.el-card__body) {
    padding: 20px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 90px;
    height: 90px;
    font-size: 36px;
  }

  .actor-name {
    font-size: 1.4rem;
  }
}

/* 小平板适配 */
@media (max-width: 991px) and (min-width: 768px) {
  .actor-col .actor-card {
    min-height: 200px;
  }

  .actor-card :deep(.el-card__body) {
    padding: 18px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }

  .actor-name {
    font-size: 1.3rem;
  }
}

/* 手机端适配 */
@media (max-width: 767px) {
  .actor-list-container {
    padding: 12px;
  }

  .search-input {
    width: 100%;
    max-width: none;
  }

  .search-section {
    margin-bottom: 24px;
  }

  .actor-col .actor-card {
    min-height: 180px;
  }

  .actor-card :deep(.el-card__body) {
    padding: 16px;
  }

  .actor-content {
    gap: 12px;
    padding: 4px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }

  .actor-name {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .actor-list-container {
    padding: 8px;
  }

  .breadcrumb-section {
    margin-bottom: 16px;
  }

  .search-section {
    margin-bottom: 20px;
  }

  .actor-col .actor-card {
    min-height: 160px;
  }

  .actor-card {
    border-radius: 8px;
  }

  .actor-card :deep(.el-card__body) {
    padding: 12px;
  }

  .actor-content {
    gap: 8px;
    padding: 2px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }

  .actor-name {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }

  .tag {
    font-size: 0.7rem;
    padding: 1px 6px;
  }
}
</style>
