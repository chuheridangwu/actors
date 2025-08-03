<script setup lang="ts">
import { AirtableService } from "@/services/airtable";
import type { SelectedWork, Work } from "@/types";
import { formatFileSize, parseSizeToBytes, sizeToGB } from "@/utils/format";
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCard,
  ElCheckbox,
  ElEmpty,
  ElMessage,
  ElTag,
} from "element-plus";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const actorName = ref<string>("");
const works = ref<Work[]>([]);
const selectedWorks = ref<SelectedWork[]>([]);
const loading = ref(false);
const submitting = ref(false);
const showViewRecordsButton = ref(false);
const actorTag = ref<string>("");
const existingWorks = ref<any[]>([]);

// 缓存数据，减少API调用
const cachedSelectedRecords = ref<any[]>([]);
const cachedActors = ref<any[]>([]);
const lastCacheTime = ref<number>(0);
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 计算总文件大小（GB）
const totalSize = computed(() => {
  const totalBytes = selectedWorks.value.reduce(
    (sum, work) => sum + work.size,
    0
  );
  return sizeToGB(totalBytes).toFixed(2);
});

// 缓存管理函数
const isCacheValid = (): boolean => {
  return Date.now() - lastCacheTime.value < CACHE_DURATION;
};

const getSelectedRecordsWithCache = async () => {
  if (isCacheValid() && cachedSelectedRecords.value.length > 0) {
    return cachedSelectedRecords.value;
  }

  const records = await AirtableService.getSelectedRecords();
  cachedSelectedRecords.value = records;
  lastCacheTime.value = Date.now();
  return records;
};

const getActorsWithCache = async () => {
  if (isCacheValid() && cachedActors.value.length > 0) {
    return cachedActors.value;
  }

  const actors = await AirtableService.getActors();
  cachedActors.value = actors;
  return actors;
};

// 清除缓存（在数据更新后调用）
const clearCache = () => {
  cachedSelectedRecords.value = [];
  cachedActors.value = [];
  lastCacheTime.value = 0;
};

// 检查已选择的作品（使用缓存）
const checkExistingWorks = async () => {
  try {
    const records = await getSelectedRecordsWithCache();
    const actorRecord = records.find(
      (r) => r.fields.ActorName === actorName.value
    );
    if (actorRecord && actorRecord.fields.WorkDetails) {
      const workDetails = JSON.parse(actorRecord.fields.WorkDetails);
      existingWorks.value = Array.isArray(workDetails) ? workDetails : [];
    } else {
      existingWorks.value = [];
    }
  } catch (error) {
    console.error("检查已选择作品失败:", error);
  }
};

// 检查作品是否已被选择
const isWorkAlreadySelected = (workId: string): boolean => {
  return existingWorks.value.some((w) => w.id === workId);
};

// 加载演员作品（优化API调用）
const loadWorks = async () => {
  loading.value = true;
  try {
    // 并行加载作品和演员信息，减少等待时间
    const [worksData, actorsData] = await Promise.all([
      AirtableService.getWorksByActor(actorName.value),
      getActorsWithCache(),
    ]);

    works.value = worksData;

    // 获取演员信息以确定标签
    const actor = actorsData.find((a) => a.fields.CName === actorName.value);
    if (actor && actor.fields.Tags) {
      try {
        const tagsArray = JSON.parse(actor.fields.Tags);
        if (Array.isArray(tagsArray) && tagsArray.length > 0) {
          actorTag.value = tagsArray[0]; // 使用第一个标签作为主标签
        }
      } catch (error) {
        console.warn("解析演员标签失败:", actor.fields.Tags, error);
        actorTag.value = "";
      }
    }

    // 检查已选择的作品（使用缓存）
    await checkExistingWorks();
  } catch (error) {
    ElMessage.error("加载作品数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 切换作品选择状态
const toggleWorkSelection = (work: Work) => {
  const workId = work.id;

  // 检查是否已经在历史记录中选择过
  if (isWorkAlreadySelected(workId)) {
    ElMessage.warning(
      `作品"${work.fields.Title}"已经在提交记录中，无需重复添加`
    );
    return;
  }

  const existingIndex = selectedWorks.value.findIndex((w) => w.id === workId);

  if (existingIndex > -1) {
    // 取消选择
    selectedWorks.value.splice(existingIndex, 1);
  } else {
    // 添加选择
    const workSize = parseSizeToBytes(work.fields.Size || "0");
    const thumbnail = work.fields.Gallery?.[0]?.thumbnails?.small?.url || "";

    selectedWorks.value.push({
      id: workId,
      title: work.fields.Title,
      size: workSize,
      thumbnail,
      duration: work.fields.Duration,
    });
  }
};

// 检查作品是否被选中
const isWorkSelected = (workId: string) => {
  return selectedWorks.value.some((w) => w.id === workId);
};

// 处理卡片点击事件
const handleCardClick = (work: Work, event: Event) => {
  // 如果点击的是选择框区域，不处理（由选择框区域自己处理）
  const target = event.target as HTMLElement;
  if (target.closest(".selection-area")) {
    return;
  }
  toggleWorkSelection(work);
};

// 处理选择框变化事件
const handleCheckboxChange = (work: Work) => {
  toggleWorkSelection(work);
};

// 提交选择
const submitSelection = async () => {
  if (selectedWorks.value.length === 0) {
    ElMessage.warning("请至少选择一个作品");
    return;
  }

  submitting.value = true;
  try {
    // 使用缓存检查是否已有该演员的记录
    const existingRecords = await getSelectedRecordsWithCache();
    const existingRecord = existingRecords.find(
      (r) => r.fields.ActorName === actorName.value
    );

    // 将新选择的作品转换为详细信息格式
    const newWorkDetails: any[] = selectedWorks.value.map((w) => {
      // 找到对应的Work对象以获取时长信息
      const workData = works.value.find((work) => work.id === w.id);
      return {
        id: w.id,
        title: w.title,
        size: w.size,
        thumbnail: w.thumbnail || "",
        duration: workData?.fields.Duration || undefined,
      };
    });

    if (existingRecord) {
      // 如果已有记录，合并作品
      const existingWorkDetails = existingRecord.fields.WorkDetails
        ? JSON.parse(existingRecord.fields.WorkDetails)
        : [];

      const allWorkDetails = [...existingWorkDetails, ...newWorkDetails];
      const newTotalSize = allWorkDetails.reduce((sum, w) => sum + w.size, 0);

      await AirtableService.updateSelectedRecord(existingRecord.id!, {
        WorkDetails: JSON.stringify(allWorkDetails),
        TotalSize: newTotalSize.toString(),
      });

      ElMessage.success(`已添加 ${newWorkDetails.length} 个作品到现有记录！`);
    } else {
      // 创建新记录
      const record = {
        fields: {
          ActorName: actorName.value,
          WorkDetails: JSON.stringify(newWorkDetails),
          TotalSize: newWorkDetails
            .reduce((sum, w) => sum + w.size, 0)
            .toString(),
          SelectionDate: new Date().toISOString().split("T")[0],
        },
      };

      await AirtableService.createSelectedRecord(record);
      ElMessage.success("提交成功！");
    }

    // 清空选择
    selectedWorks.value = [];
    // 显示查看记录按钮
    showViewRecordsButton.value = true;
    // 清除缓存，确保数据一致性
    clearCache();
    // 重新检查已选择的作品
    await checkExistingWorks();
  } catch (error) {
    ElMessage.error("提交失败");
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

// 返回演员列表
const goBack = () => {
  if (actorTag.value) {
    router.push(`/actors/${encodeURIComponent(actorTag.value)}`);
  } else {
    router.push("/");
  }
};

// 查看所有提交记录
const viewAllRecords = () => {
  router.push("/selected-works");
};

// 返回首页
const goHome = () => {
  router.push("/");
};

onMounted(() => {
  actorName.value = decodeURIComponent(route.params.actorName as string);
  loadWorks();
});
</script>

<template>
  <div class="actor-works-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-section">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <a @click="goHome" class="breadcrumb-link">首页</a>
        </el-breadcrumb-item>
        <el-breadcrumb-item>
          <a @click="goBack" class="breadcrumb-link">
            {{ actorTag ? `${actorTag} 类别演员` : "演员列表" }}
          </a>
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ actorName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 页面标题和统计信息 -->
    <div class="header-section">
      <h1 class="page-title">{{ actorName }} 的作品</h1>
      <div class="stats-bar">
        <div class="stats-info">
          <span>已选择 {{ selectedWorks.length }} 个作品</span>
          <el-tag v-if="selectedWorks.length > 0" type="success" size="large">
            总大小: {{ totalSize }} GB
          </el-tag>
        </div>
        <div class="action-buttons">
          <el-button
            v-if="selectedWorks.length > 0"
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitSelection"
          >
            提交选择
          </el-button>

          <el-button
            v-if="showViewRecordsButton"
            type="success"
            size="large"
            @click="viewAllRecords"
          >
            查看所有提交记录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 作品列表 -->
    <div class="works-section" v-loading="loading">
      <el-row v-if="works.length > 0" :gutter="20" class="works-row">
        <el-col
          v-for="work in works"
          :key="work.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="4"
          class="work-col"
        >
          <el-card
            class="work-card"
            :class="{
              selected: isWorkSelected(work.id),
              'already-selected': isWorkAlreadySelected(work.id),
            }"
            shadow="hover"
            @click="handleCardClick(work, $event)"
          >
            <div class="work-content">
              <!-- 作品缩略图容器 -->
              <div class="work-thumbnail-container">
                <!-- 缩略图 -->
                <div class="work-thumbnail">
                  <img
                    v-if="work.fields.Gallery?.[0]?.thumbnails?.full?.url"
                    :src="work.fields.Gallery[0].thumbnails.full.url"
                    :alt="work.fields.Title"
                    class="thumbnail-image"
                  />
                  <div v-else class="thumbnail-placeholder">
                    <span>{{ work.fields.Title.charAt(0) }}</span>
                  </div>
                </div>

                <!-- 选择框覆盖层 -->
                <div
                  class="selection-overlay"
                  @click.stop="toggleWorkSelection(work)"
                >
                  <el-checkbox
                    :model-value="isWorkSelected(work.id)"
                    @change="handleCheckboxChange(work)"
                    size="large"
                    class="selection-checkbox"
                  />
                </div>

                <!-- 已选择状态指示器 -->
                <div v-if="isWorkSelected(work.id)" class="selected-indicator">
                  <span class="selected-icon">✓</span>
                </div>

                <!-- 已在历史记录中选择的状态指示器 -->
                <div
                  v-if="isWorkAlreadySelected(work.id)"
                  class="already-selected-indicator"
                >
                  <span class="already-selected-text">已选</span>
                </div>
              </div>

              <!-- 作品信息 -->
              <div class="work-info">
                <h3 class="work-title">{{ work.fields.Title }}</h3>
                <div class="work-meta">
                  <span class="file-size">
                    {{ formatFileSize(work.fields.Size || "0") }}
                  </span>
                  <span
                    v-if="
                      work.fields.Duration && work.fields.Duration !== '0:00'
                    "
                    class="duration"
                  >
                    ⏱️ {{ work.fields.Duration }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty
        v-else-if="!loading"
        description="该演员暂无作品"
        class="empty-state"
      />
    </div>
  </div>
</template>

<style scoped>
.actor-works-container {
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

.header-section {
  margin-bottom: 32px;
}

.page-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 1rem;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.works-section {
  min-height: 400px;
}

/* Element Plus响应式布局样式 */
.works-row {
  margin-bottom: 20px;
}

.work-col {
  margin-bottom: 20px;
  display: flex;
}

/* 确保所有卡片有一致的最小高度 */
.work-col .work-card {
  min-height: 280px;
}

.work-card {
  position: relative;
  transition: all 0.3s ease;
  border-radius: 12px;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 确保Element Plus卡片内容填满整个卡片 */
.work-card :deep(.el-card__body) {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.work-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.work-card.selected {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-2px);
}

.work-card.already-selected {
  border-color: #e6a23c;
  background-color: #fdf6ec;
  opacity: 0.8;
  cursor: not-allowed;
}

.work-card.already-selected:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

.work-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 缩略图容器 */
.work-thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9; /* 16:9 宽高比 */
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.work-thumbnail {
  width: 100%;
  height: 100%;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumbnail-image:hover {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

/* 选择框覆盖层 */
.selection-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.selection-overlay:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.selection-checkbox {
  pointer-events: none;
}

/* 已选择状态指示器 */
.selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.selected-icon {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

/* 已在历史记录中选择的状态指示器 */
.already-selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #e6a23c;
  color: white;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  z-index: 4;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.4);
}

.already-selected-text {
  line-height: 1;
}

.work-info {
  flex: 1;
  min-width: 0;
  padding: 0 4px;
}

.work-title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;

  /* 最多显示3行，超出显示省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;

  /* 设置最小高度确保布局一致性 */
  min-height: calc(1.4em * 2); /* 至少2行的高度 */
  max-height: calc(1.4em * 3); /* 最多3行的高度 */
}

.work-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.file-size {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
}

.duration {
  background: #e8f5e8;
  color: #2d5a2d;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.work-description {
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

/* 大屏PC端优化 */
@media (min-width: 1200px) {
  .actor-works-container {
    padding: 30px 40px;
  }

  .header-section {
    margin-bottom: 40px;
  }

  .page-title {
    font-size: 2.5rem;
    margin-bottom: 20px;
  }

  .stats-bar {
    padding: 20px 24px;
    border-radius: 16px;
  }

  .stats-info {
    gap: 20px;
    font-size: 1.1rem;
  }

  .action-buttons {
    gap: 16px;
  }

  .work-col .work-card {
    min-height: 320px;
  }

  .work-card :deep(.el-card__body) {
    padding: 20px;
  }

  .work-thumbnail-container {
    margin-bottom: 16px;
  }

  .work-title {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }

  .work-meta {
    gap: 10px;
  }

  .file-size,
  .duration {
    font-size: 0.85rem;
    padding: 5px 10px;
  }
}

/* 中等PC端优化 */
@media (min-width: 1025px) and (max-width: 1199px) {
  .actor-works-container {
    padding: 25px 30px;
  }

  .work-col .work-card {
    min-height: 300px;
  }

  .work-card :deep(.el-card__body) {
    padding: 18px;
  }
}

/* 平板适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .work-col .work-card {
    min-height: 280px;
  }

  .work-card :deep(.el-card__body) {
    padding: 16px;
  }

  .stats-bar {
    padding: 12px 16px;
  }
}

/* 手机端适配 */
@media (max-width: 768px) and (min-width: 481px) {
  .actor-works-container {
    padding: 12px;
  }

  .work-col .work-card {
    min-height: 260px;
  }

  .work-card :deep(.el-card__body) {
    padding: 14px;
  }

  .work-thumbnail-container {
    margin-bottom: 10px;
  }

  .work-title {
    font-size: 0.95rem;
    margin-bottom: 8px;
  }

  .stats-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
  }

  .stats-info {
    flex-direction: column;
    gap: 8px;
    align-items: center;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 12px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .actor-works-container {
    padding: 8px;
  }

  .breadcrumb-section {
    margin-bottom: 16px;
  }

  .header-section {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .work-col .work-card {
    min-height: 240px;
  }

  .work-card {
    border-radius: 8px;
  }

  .work-card :deep(.el-card__body) {
    padding: 12px;
  }

  .work-thumbnail-container {
    margin-bottom: 8px;
  }

  .work-title {
    font-size: 0.9rem;
    margin-bottom: 6px;
    min-height: calc(1.4em * 1.5);
  }

  .work-meta {
    gap: 6px;
  }

  .file-size,
  .duration {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .selected-indicator,
  .already-selected-indicator {
    top: 6px;
    right: 6px;
  }

  .selected-indicator {
    width: 24px;
    height: 24px;
  }

  .selected-icon {
    font-size: 14px;
  }

  .selection-overlay {
    top: 6px;
    left: 6px;
  }

  .work-title {
    font-size: 1rem;
  }

  .work-meta {
    font-size: 0.8rem;
  }
}
</style>
