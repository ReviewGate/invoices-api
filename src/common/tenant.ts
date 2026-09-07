/**
 * Every request belongs to exactly one tenant. Repositories never return rows
 * from another tenant, and services must pass the caller's tenant down.
 */
export interface Tenant {
  readonly id: string;
  readonly name: string;
}

export class TenantMismatchError extends Error {
  constructor(resource: string) {
    super(`Resource ${resource} belongs to another tenant`);
    this.name = 'TenantMismatchError';
  }
}
