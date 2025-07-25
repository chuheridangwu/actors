/**
 * 标签处理工具函数
 * 用于处理Airtable Long text字段中存储的JSON数组格式标签
 */

/**
 * 解析JSON字符串格式的标签为数组
 * @param tagsJson JSON字符串，如 '["动作","喜剧","科幻"]'
 * @returns 标签数组，如 ["动作","喜剧","科幻"]
 */
export function parseTagsFromJson(tagsJson: string | undefined | null): string[] {
  if (!tagsJson || tagsJson.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(tagsJson);
    if (Array.isArray(parsed)) {
      return parsed.filter(tag => typeof tag === 'string' && tag.trim() !== '');
    }
    return [];
  } catch (error) {
    console.warn('解析标签JSON失败:', tagsJson, error);
    return [];
  }
}

/**
 * 将标签数组转换为JSON字符串格式
 * @param tags 标签数组，如 ["动作","喜剧","科幻"]
 * @returns JSON字符串，如 '["动作","喜剧","科幻"]'
 */
export function stringifyTagsToJson(tags: string[]): string {
  if (!Array.isArray(tags)) {
    return '[]';
  }
  
  const cleanTags = tags
    .filter(tag => typeof tag === 'string' && tag.trim() !== '')
    .map(tag => tag.trim());
  
  return JSON.stringify(cleanTags);
}

/**
 * 解析逗号分隔的标签字符串为数组
 * @param tagString 逗号分隔的字符串，如 "动作,喜剧,科幻"
 * @returns 标签数组，如 ["动作","喜剧","科幻"]
 */
export function parseTagsFromString(tagString: string): string[] {
  if (!tagString || tagString.trim() === '') {
    return [];
  }
  
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * 将标签数组转换为逗号分隔的字符串（用于显示）
 * @param tags 标签数组
 * @returns 逗号分隔的字符串
 */
export function joinTagsToString(tags: string[]): string {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }
  
  return tags.join(', ');
}

/**
 * 检查标签数组中是否包含指定标签
 * @param tagsJson JSON字符串格式的标签
 * @param targetTag 要查找的标签
 * @returns 是否包含该标签
 */
export function hasTag(tagsJson: string | undefined | null, targetTag: string): boolean {
  const tags = parseTagsFromJson(tagsJson);
  return tags.includes(targetTag);
}

/**
 * 获取所有唯一标签（从多个记录中）
 * @param records 包含标签的记录数组
 * @param getTagsField 获取标签字段的函数
 * @returns 所有唯一标签的数组
 */
export function getAllUniqueTags<T>(
  records: T[], 
  getTagsField: (record: T) => string | undefined | null
): string[] {
  const allTags = new Set<string>();
  
  records.forEach(record => {
    const tagsJson = getTagsField(record);
    const tags = parseTagsFromJson(tagsJson);
    tags.forEach(tag => allTags.add(tag));
  });
  
  return Array.from(allTags).sort();
}

/**
 * 过滤包含指定标签的记录
 * @param records 记录数组
 * @param getTagsField 获取标签字段的函数
 * @param filterTag 要过滤的标签
 * @returns 包含该标签的记录数组
 */
export function filterRecordsByTag<T>(
  records: T[],
  getTagsField: (record: T) => string | undefined | null,
  filterTag: string
): T[] {
  return records.filter(record => {
    const tagsJson = getTagsField(record);
    return hasTag(tagsJson, filterTag);
  });
}
