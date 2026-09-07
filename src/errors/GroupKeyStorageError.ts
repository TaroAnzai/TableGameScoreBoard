export class GroupKeyStorageError extends Error {
  readonly groupKey: string;
  readonly cause: unknown;

  constructor(groupKey: string, cause: unknown) {
    super('The group was created, but its key could not be saved on this device');
    this.name = 'GroupKeyStorageError';
    this.groupKey = groupKey;
    this.cause = cause;
  }
}

export const isGroupKeyStorageError = (error: unknown): error is GroupKeyStorageError =>
  error instanceof GroupKeyStorageError;
