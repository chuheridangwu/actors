/**
 * 解析文件大小字符串或数字为字节数
 * @param sizeInput 文件大小输入（可以是字符串如"32GB"或数字如1234567890）
 * @returns 字节数
 */
export function parseSizeToBytes(sizeInput: string | number): number {
  if (typeof sizeInput === 'number') {
    return sizeInput;
  }

  if (typeof sizeInput === 'string') {
    // 如果是纯数字字符串，直接转换
    if (/^\d+(\.\d+)?$/.test(sizeInput)) {
      return parseFloat(sizeInput);
    }

    // 解析带单位的字符串，如 "32GB", "1.5TB" 等
    const match = sizeInput.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();

      const multipliers: { [key: string]: number } = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };

      return value * (multipliers[unit] || 1);
    }
  }

  return 0;
}

/**
 * 格式化文件大小
 * @param sizeInput 文件大小输入（字符串或数字）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(sizeInput: string | number): string {
  const bytes = parseSizeToBytes(sizeInput);

  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 将文件大小转换为GB
 * @param sizeInput 文件大小输入（字符串或数字）
 * @returns GB数值
 */
export function sizeToGB(sizeInput: string | number): number {
  const bytes = parseSizeToBytes(sizeInput);
  return bytes / (1024 * 1024 * 1024);
}

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @returns 格式化后的日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
