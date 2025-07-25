// 演员数据类型
export interface Actor {
  id: string;
  fields: {
    CName: string;
    Tags: string; // Long text字段存储JSON数组字符串，如 '["动作","喜剧"]'
    Avatar?: string;
  };
}

// 作品数据类型
export interface Work {
  id: string;
  fields: {
    Title: string;
    Actors: string[];
    Tags: string; // Long text字段存储JSON数组字符串，如 '["动作","喜剧"]'
    Gallery?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
      thumbnails?: {
        small?: { url: string; width: number; height: number };
        large?: { url: string; width: number; height: number };
        full?: { url: string; width: number; height: number };
      };
    }>;
    Size?: string; // 文件大小，单位为字节
  };
}

// 选择的作品详细信息
export interface SelectedWorkDetail {
  id: string;
  title: string;
  size: number;
  thumbnail?: string;
}

// 选择记录数据类型
export interface SelectedRecord {
  id?: string;
  fields: {
    ActorName: string;
    WorkDetails?: string; // JSON字符串，存储作品详细信息数组
    TotalSize: string; // 总文件大小，单位为字节
    SelectionDate: string; // 日期格式: YYYY-MM-DD
  };
}

// API响应类型
export interface AirtableResponse<T> {
  records: T[];
  offset?: string;
}

// 标签类型
export type ActorTag = string;

// 选择的作品项
export interface SelectedWork {
  id: string;
  title: string;
  size: number;
  thumbnail?: string;
}

// 路径导航项
export interface BreadcrumbItem {
  text: string;
  to?: string;
}
