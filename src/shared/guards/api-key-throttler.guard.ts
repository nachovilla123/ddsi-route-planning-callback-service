import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.slice(7);
      return Promise.resolve(`apikey-${apiKey}`);
    }

    const ip =
      req.ips && req.ips.length > 0 ? req.ips[0] : req.ip || 'unknown-ip';

    return Promise.resolve(`ip-${ip}`);
  }
}
