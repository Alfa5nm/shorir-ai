export interface ObjectStorage {
  enabled: boolean;
  putObject(key: string, data: Buffer, contentType: string): Promise<{ key: string; url?: string }>;
  deleteObject(key: string): Promise<void>;
}
