import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { DocumentEntity } from '@domain/entities/Document';
import { DocumentMapper } from '../mappers/DocumentMapper';
import { createClerkSupabaseClient, supabaseClient } from '../storage/SupabaseClient';

export class SupabaseDocumentRepository implements DocumentRepository {
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

  public async findById(id: string): Promise<DocumentEntity | null> {
    const { data, error } = await this.getClient()
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return DocumentMapper.toDomain(data);
  }

  public async findAll(): Promise<DocumentEntity[]> {
    const { data, error } = await this.getClient()
      .from('documents')
      .select('*');

    if (error || !data) return [];

    return data.map(row => DocumentMapper.toDomain(row));
  }

  public async save(document: DocumentEntity): Promise<void> {
    const client = this.getClient();
    const userId = this.userId || 'unknown';

    console.log('[SupabaseDocumentRepository] Saving document...', {
      hasClerkToken: !!this.getTokenFn,
      userId,
      documentId: document.id,
    });

    if (userId !== 'unknown') {
      const { error: userError } = await client.from('users').upsert({ id: userId }, { onConflict: 'id' });
      if (userError) {
        console.error('[SupabaseDocumentRepository] Error upserting user:', userError);
      }
    }

    const payload = DocumentMapper.toPersistence(document, userId);

    console.log('Upserting document with payload:', payload);

    const { error } = await client
      .from('documents')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving document to Supabase:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document from Supabase:', error);
      throw error;
    }
  }
}
