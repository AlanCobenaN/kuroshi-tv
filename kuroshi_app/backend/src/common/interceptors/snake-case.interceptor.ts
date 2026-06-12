import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.toSnakeCase(data)));
  }

  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.toSnakeCase(item));
    if (obj instanceof Date) return obj;
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const transformed: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        transformed[snakeKey] = this.toSnakeCase(obj[key]);
      }
      return transformed;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') return obj;
    return obj;
  }
}
