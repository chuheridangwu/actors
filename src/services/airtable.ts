import { AIRTABLE_CONFIG } from '@/config/airtable';
import type { Actor, SelectedRecord, Work } from '@/types';
import Airtable from 'airtable';

// 初始化Airtable
const base = new Airtable({ apiKey: AIRTABLE_CONFIG.apiKey }).base(AIRTABLE_CONFIG.baseId);

export class AirtableService {
  // 获取所有演员
  static async getActors(): Promise<Actor[]> {
    try {
      const records = await base(AIRTABLE_CONFIG.tables.actors).select().all();
      return records.map(record => ({
        id: record.id,
        fields: record.fields as Actor['fields']
      }));
    } catch (error) {
      console.error('获取演员数据失败:', error);
      throw error;
    }
  }

  // 根据标签获取演员
  static async getActorsByTag(tag: string): Promise<Actor[]> {
    try {
      const records = await base(AIRTABLE_CONFIG.tables.actors)
        .select({
          // 使用FIND函数在JSON字符串中查找标签
          filterByFormula: `FIND('"${tag}"', {Tags})`
        })
        .all();

      return records.map(record => ({
        id: record.id,
        fields: record.fields as Actor['fields']
      }));
    } catch (error) {
      console.error('根据标签获取演员失败:', error);
      throw error;
    }
  }

  // 获取演员的所有作品
  static async getWorksByActor(actorName: string): Promise<Work[]> {
    try {
      const records = await base(AIRTABLE_CONFIG.tables.works)
        .select({
          filterByFormula: `FIND("${actorName}", ARRAYJOIN({Actors}, ","))`
        })
        .all();

      return records.map(record => ({
        id: record.id,
        fields: record.fields as Work['fields']
      }));
    } catch (error) {
      console.error('获取演员作品失败:', error);
      throw error;
    }
  }

  // 获取所有唯一标签
  static async getAllTags(): Promise<string[]> {
    try {
      const actors = await this.getActors();
      const allTags = new Set<string>();
      
      actors.forEach(actor => {
        if (actor.fields.Tags) {
          try {
            const tagsArray = JSON.parse(actor.fields.Tags);
            tagsArray.forEach((tag: string) => allTags.add(tag));
          } catch (error) {
            console.error('解析标签失败:', error);
          }
        }
      });
      
      return Array.from(allTags);
    } catch (error) {
      console.error('获取标签失败:', error);
      throw error;
    }
  }

  // 创建选择记录
  static async createSelectedRecord(record: SelectedRecord): Promise<SelectedRecord> {
    try {
      const createdRecord = await base(AIRTABLE_CONFIG.tables.selected).create(record.fields);
      return {
        id: createdRecord.id,
        fields: createdRecord.fields as SelectedRecord['fields']
      };
    } catch (error) {
      console.error('创建选择记录失败:', error);
      throw error;
    }
  }

  // 搜索演员
  static async searchActors(query: string): Promise<Actor[]> {
    try {
      const records = await base(AIRTABLE_CONFIG.tables.actors)
        .select({
          filterByFormula: `SEARCH(LOWER("${query}"), LOWER({CName}))`
        })
        .all();

      return records.map(record => ({
        id: record.id,
        fields: record.fields as Actor['fields']
      }));
    } catch (error) {
      console.error('搜索演员失败:', error);
      throw error;
    }
  }

  // 获取所有提交记录
  static async getSelectedRecords(): Promise<SelectedRecord[]> {
    try {
      const records = await base(AIRTABLE_CONFIG.tables.selected)
        .select({
          sort: [{ field: 'SelectionDate', direction: 'desc' }]
        })
        .all();

      return records.map(record => ({
        id: record.id,
        fields: record.fields as SelectedRecord['fields']
      }));
    } catch (error) {
      console.error('获取提交记录失败:', error);
      throw error;
    }
  }

  // 更新提交记录
  static async updateSelectedRecord(recordId: string, fields: Partial<SelectedRecord['fields']>): Promise<SelectedRecord> {
    try {
      const updatedRecord = await base(AIRTABLE_CONFIG.tables.selected).update(recordId, fields);
      return {
        id: updatedRecord.id,
        fields: updatedRecord.fields as SelectedRecord['fields']
      };
    } catch (error) {
      console.error('更新提交记录失败:', error);
      throw error;
    }
  }

  // 删除提交记录
  static async deleteSelectedRecord(recordId: string): Promise<void> {
    try {
      await base(AIRTABLE_CONFIG.tables.selected).destroy(recordId);
    } catch (error) {
      console.error('删除提交记录失败:', error);
      throw error;
    }
  }
}
