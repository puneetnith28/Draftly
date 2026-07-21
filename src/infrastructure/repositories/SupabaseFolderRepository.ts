import { FolderRepository } from '@domain/repositories/FolderRepository';
import { FolderEntity } from '@domain/entities/Folder';
import { FolderMapper } from '../mappers/FolderMapper';
import { createClerkSupabaseClient, supabaseClient } from '../storage/SupabaseClient';

export class SupabaseFolderRepository implements FolderRepository {
  private getTokenFn: (() => Promise<string | null>) | null = null;
  private userId: string | null = null;

  public setAuthToken(getTokenFn: () => Promise<string | null>, userId?: string | null): void {
    this.getTokenFn = getTokenFn;
    if (userId) this.userId = userId;
  }

  private getClient() {
    if (this.getTokenFn) {
      return createClerkSupabaseClient(this.getTokenFn);
    }
    return supabaseClient;
  }

  public async findById(id: string): Promise<FolderEntity | null> {
    const { data, error } = await this.getClient()
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return FolderMapper.toDomain(data);
  }

  public async findAll(): Promise<FolderEntity[]> {
    const { data, error } = await this.getClient()
      .from('folders')
      .select('*');

    if (error || !data) return [];

    return data.map(row => FolderMapper.toDomain(row));
  }

  public async save(folder: FolderEntity): Promise<void> {
    const client = this.getClient();
    const userId = this.userId || 'unknown';

    if (userId !== 'unknown') {
      await client.from('users').upsert({ id: userId }, { onConflict: 'id' });
    }

    const payload = FolderMapper.toPersistence(folder, userId);

    const { error } = await client
      .from('folders')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving folder to Supabase:', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting folder from Supabase:', error);
      throw error;
    }
  }
}
