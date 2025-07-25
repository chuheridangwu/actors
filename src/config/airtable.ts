// Airtable配置
export const AIRTABLE_CONFIG = {
  baseId: import.meta.env.VITE_AIRTABLE_BASE_ID || '',
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || '', // 需要在.env文件中设置
  tables: {
    actors: 'Actors',
    works: 'Works',
    selected: 'Selected'
  }
};

// Airtable API端点
export const AIRTABLE_API_BASE = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}`;
