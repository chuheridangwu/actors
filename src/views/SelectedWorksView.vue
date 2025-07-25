<script setup lang="ts">
import { AirtableService } from "@/services/airtable";
import type { SelectedRecord, SelectedWorkDetail } from "@/types";
import { formatDate, formatFileSize } from "@/utils/format";
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElCard,
  ElEmpty,
  ElMessage,
  ElTag,
} from "element-plus";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const selectedRecords = ref<SelectedRecord[]>([]);
const loading = ref(false);

// 解析作品详情
const parseWorkDetails = (
  workDetailsStr: string | undefined
): SelectedWorkDetail[] => {
  if (!workDetailsStr) {
    return [];
  }

  try {
    const parsed = JSON.parse(workDetailsStr);
    // 兼容旧数据格式（字符串数组）
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "string"
    ) {
      return parsed.map((title: string, index: number) => ({
        id: `legacy-${index}`,
        title,
        size: 0,
        thumbnail: "",
      }));
    }
    return parsed;
  } catch {
    // 如果解析失败，尝试按逗号分割（兼容旧数据）
    return workDetailsStr.split(",").map((title, index) => ({
      id: `legacy-${index}`,
      title: title.trim(),
      size: 0,
      thumbnail: "",
    }));
  }
};

// 加载所有提交记录
const loadSelectedRecords = async () => {
  loading.value = true;
  try {
    selectedRecords.value = await AirtableService.getSelectedRecords();
  } catch (error) {
    ElMessage.error("加载提交记录失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 删除单个作品
const deleteWork = async (record: SelectedRecord, work: SelectedWorkDetail) => {
  try {
    // 二次确认
    const { ElMessageBox } = await import("element-plus");
    await ElMessageBox.confirm(
      `确定要删除演员"${record.fields.ActorName}"的作品"${work.title}"吗？此操作不可恢复。`,
      "删除作品确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );

    // 获取当前作品列表并移除指定作品
    const currentWorks = parseWorkDetails(record.fields.WorkDetails);
    const updatedWorks = currentWorks.filter((w) => w.id !== work.id);
    const newTotalSize = updatedWorks.reduce((sum, w) => sum + w.size, 0);

    if (updatedWorks.length === 0) {
      // 如果没有作品了，删除整个记录
      await AirtableService.deleteSelectedRecord(record.id!);
      ElMessage.success("作品已删除，记录已清空");
      // 从本地列表中移除整个记录
      selectedRecords.value = selectedRecords.value.filter(
        (r) => r.id !== record.id
      );
    } else {
      // 更新记录
      await AirtableService.updateSelectedRecord(record.id!, {
        WorkDetails: JSON.stringify(updatedWorks),
        TotalSize: newTotalSize.toString(),
      });
      ElMessage.success("作品删除成功");
      // 更新本地记录，避免重新API调用
      const recordIndex = selectedRecords.value.findIndex(
        (r) => r.id === record.id
      );
      if (recordIndex >= 0) {
        selectedRecords.value[recordIndex].fields.WorkDetails =
          JSON.stringify(updatedWorks);
        selectedRecords.value[recordIndex].fields.TotalSize =
          newTotalSize.toString();
      }
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
      console.error(error);
    }
  }
};

// 删除提交记录
const deleteRecord = async (record: SelectedRecord) => {
  try {
    // 二次确认
    const { ElMessageBox } = await import("element-plus");
    await ElMessageBox.confirm(
      `确定要删除演员"${record.fields.ActorName}"的提交记录吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );

    // 执行删除
    await AirtableService.deleteSelectedRecord(record.id!);
    ElMessage.success("删除成功");

    // 本地更新数据，避免重新API调用
    selectedRecords.value = selectedRecords.value.filter(
      (r) => r.id !== record.id
    );
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
      console.error(error);
    }
  }
};

// 返回首页
const goHome = () => {
  router.push("/");
};

onMounted(() => {
  loadSelectedRecords();
});
</script>

<template>
  <div class="selected-works-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-section">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <a @click="goHome" class="breadcrumb-link">首页</a>
        </el-breadcrumb-item>
        <el-breadcrumb-item>提交记录</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="header-section">
      <h1 class="page-title">所有提交记录</h1>
      <p class="page-subtitle">查看所有已提交的作品选择记录</p>
    </div>

    <!-- 记录列表 -->
    <div class="records-section" v-loading="loading">
      <div v-if="selectedRecords.length > 0" class="records-grid">
        <el-card
          v-for="record in selectedRecords"
          :key="record.id"
          class="record-card"
          shadow="hover"
        >
          <div class="record-content">
            <div class="record-header">
              <h3 class="actor-name">{{ record.fields.ActorName }}</h3>
              <div class="header-right">
                <el-tag type="success" size="large">
                  {{ formatFileSize(record.fields.TotalSize) }}
                </el-tag>
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteRecord(record)"
                  class="delete-button"
                >
                  🗑️ 删除
                </el-button>
              </div>
            </div>

            <div class="record-meta">
              <span class="work-count">
                共
                {{ parseWorkDetails(record.fields.WorkDetails).length }} 个作品
              </span>
              <span class="submit-date">
                {{ formatDate(record.fields.SelectionDate) }}
              </span>
            </div>

            <div
              class="work-titles"
              v-if="parseWorkDetails(record.fields.WorkDetails).length > 0"
            >
              <div
                v-for="work in parseWorkDetails(record.fields.WorkDetails)"
                :key="work.id"
                class="work-item"
              >
                <el-tag
                  class="work-tag"
                  type="info"
                  size="small"
                  closable
                  @close="deleteWork(record, work)"
                >
                  {{ work.title }}
                </el-tag>
                <span class="work-size">{{ formatFileSize(work.size) }}</span>
              </div>
            </div>
            <div v-else class="no-works">
              <span class="text-gray-500">暂无作品信息</span>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty
        v-else-if="!loading"
        description="暂无提交记录"
        class="empty-state"
      />
    </div>
  </div>
</template>

<style scoped>
.selected-works-container {
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
  text-align: center;
}

.page-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
}

.records-section {
  min-height: 400px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.record-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.record-content {
  padding: 4px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delete-button {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.actor-name {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #64748b;
}

.work-titles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.work-tag {
  margin: 0;
  flex-shrink: 0;
}

.work-size {
  font-size: 0.75rem;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.no-works {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
}

.empty-state {
  margin-top: 60px;
}

/* 大屏PC端优化 */
@media (min-width: 1200px) {
  .selected-works-container {
    padding: 30px 40px;
  }

  .header-section {
    margin-bottom: 40px;
  }

  .page-title {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  .page-subtitle {
    font-size: 1.2rem;
  }

  .records-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 30px;
  }

  .record-card {
    padding: 24px;
    border-radius: 16px;
  }

  .record-content {
    padding: 8px;
  }

  .actor-name {
    font-size: 1.5rem;
  }

  .record-meta {
    font-size: 1rem;
    margin-bottom: 20px;
  }

  .work-titles {
    gap: 10px;
  }

  .work-tag {
    font-size: 0.9rem;
    padding: 4px 10px;
  }
}

/* 中等PC端优化 */
@media (min-width: 1025px) and (max-width: 1199px) {
  .selected-works-container {
    padding: 25px 30px;
  }

  .records-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 25px;
  }

  .record-card {
    padding: 20px;
  }
}

/* 平板适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .records-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
}

/* 手机端适配 */
@media (max-width: 768px) and (min-width: 481px) {
  .selected-works-container {
    padding: 12px;
  }

  .records-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .record-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .record-meta {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .selected-works-container {
    padding: 8px;
  }

  .header-section {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .record-card {
    border-radius: 8px;
  }

  .actor-name {
    font-size: 1.1rem;
  }
}
</style>
