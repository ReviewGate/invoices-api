import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Tenant } from '../common/tenant';

export interface TenantRequest extends Request {
  tenant?: Tenant;
}

/** Demo directory of API keys. A real deployment reads them from a store. */
const API_KEYS: ReadonlyMap<string, Tenant> = new Map([
  ['key-acme', { id: 'acme', name: 'Acme Ltd' }],
  ['key-globex', { id: 'globex', name: 'Globex Inc' }],
]);

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const header = request.header('x-api-key');
    if (!header) {
      throw new UnauthorizedException('Missing x-api-key header');
    }
    const tenant = API_KEYS.get(header);
    if (!tenant) {
      throw new UnauthorizedException('Unknown API key');
    }
    request.tenant = tenant;
    return true;
  }
}
