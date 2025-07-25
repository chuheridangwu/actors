# 演员作品管理系统

基于Vue 3 + TypeScript + Element Plus + Airtable的演员作品管理系统。

## 功能特性

- 🎭 **演员分类管理** - 基于标签的演员分类展示
- 🔍 **智能搜索** - 支持演员姓名搜索
- 🎬 **作品展示** - 卡片式作品展示，包含缩略图和详细信息
- ✅ **作品选择** - 支持多选作品并实时统计文件大小
- 📊 **数据统计** - 实时显示选中作品的总文件大小
- 💾 **数据提交** - 自动保存选择记录到Airtable
- 📱 **响应式设计** - 适配桌面端和移动端

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **数据库**: Airtable
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

## 项目结构

```
src/
├── components/          # 公共组件
├── config/             # 配置文件
│   └── airtable.ts     # Airtable配置
├── services/           # API服务
│   └── airtable.ts     # Airtable服务
├── types/              # TypeScript类型定义
│   └── index.ts        # 数据类型
├── utils/              # 工具函数
│   └── format.ts       # 格式化工具
├── views/              # 页面组件
│   ├── HomeView.vue    # 主页面
│   ├── ActorListView.vue    # 演员列表页
│   └── ActorWorksView.vue   # 演员作品页
├── router/             # 路由配置
└── main.ts            # 应用入口
```

## 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 在 `.env` 文件中配置您的Airtable API密钥：
```env
VITE_AIRTABLE_API_KEY=your_airtable_api_key_here
```

## Airtable数据结构

### Actors表
- `Name` (Single line text) - 演员姓名
- `Tags` (Multiple select) - 演员标签
- `Avatar` (Attachment) - 演员头像
- `Description` (Long text) - 演员描述

### Works表
- `Title` (Single line text) - 作品标题
- `Actor` (Link to Actors) - 关联演员
- `Gallery` (Attachment) - 作品图片
- `Size` (Number) - 文件大小（字节）
- `Description` (Long text) - 作品描述
- `ReleaseDate` (Date) - 发布日期

### Selected表
- `ActorName` (Single line text) - 演员姓名
- `WorkTitles` (Multiple select) - 选中的作品标题
- `TotalSize` (Number) - 总文件大小（字节）
- `SelectionDate` (Date) - 选择日期

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## 使用说明

1. **主页面**: 显示所有可用的演员标签，点击标签查看对应类别的演员
2. **演员列表**: 显示选定标签下的所有演员，支持搜索功能
3. **演员作品**: 展示特定演员的所有作品，支持多选和文件大小统计
4. **作品选择**: 选择作品后点击提交按钮，系统会自动保存到Selected表

## 注意事项

- 确保Airtable API密钥配置正确
- 确保Airtable表结构与代码中的类型定义匹配
- 文件大小统计基于Airtable中的Size字段（字节单位）
- 系统会自动处理图片缩略图显示

## 开发建议

建议编写和运行测试来验证功能：

```bash
# 安装测试依赖
npm install --save-dev @vue/test-utils vitest

# 运行测试
npm run test
```
