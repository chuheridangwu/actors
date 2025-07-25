import { formatFileSize, parseSizeToBytes, sizeToGB } from '@/utils/format';
import { describe, expect, it } from 'vitest';

describe('格式化工具函数', () => {
  describe('parseSizeToBytes', () => {
    it('应该正确解析数字', () => {
      expect(parseSizeToBytes(1024)).toBe(1024);
      expect(parseSizeToBytes(0)).toBe(0);
    });

    it('应该正确解析纯数字字符串', () => {
      expect(parseSizeToBytes('1024')).toBe(1024);
      expect(parseSizeToBytes('1024.5')).toBe(1024.5);
    });

    it('应该正确解析带单位的字符串', () => {
      expect(parseSizeToBytes('1KB')).toBe(1024);
      expect(parseSizeToBytes('1MB')).toBe(1048576);
      expect(parseSizeToBytes('1GB')).toBe(1073741824);
      expect(parseSizeToBytes('32GB')).toBe(34359738368);
      expect(parseSizeToBytes('1.5GB')).toBe(1610612736);
    });

    it('应该处理无效输入', () => {
      expect(parseSizeToBytes('invalid')).toBe(0);
      expect(parseSizeToBytes('')).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    it('应该正确格式化字节数字', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('应该正确格式化字符串', () => {
      expect(formatFileSize('32GB')).toBe('32 GB');
      expect(formatFileSize('1.5TB')).toBe('1.5 TB');
      expect(formatFileSize('1024')).toBe('1 KB');
    });

    it('应该处理小数', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('sizeToGB', () => {
    it('应该正确转换字节到GB', () => {
      expect(sizeToGB(1073741824)).toBe(1);
      expect(sizeToGB(2147483648)).toBe(2);
      expect(sizeToGB(536870912)).toBe(0.5);
    });

    it('应该正确转换字符串到GB', () => {
      expect(sizeToGB('32GB')).toBe(32);
      expect(sizeToGB('1.5TB')).toBe(1536);
    });
  });
});
