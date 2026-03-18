import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';
import {
  PlanningResult,
  Delivery,
  Truck,
  Warehouse,
} from '../utils/greedy-route-planner';
import { TimeWindowInfo } from 'src/ingestion/entities/routing-payload';

@Injectable()
export class VrpWorkerService implements OnModuleDestroy {
  async run(
    timeWindow: TimeWindowInfo,
    warehouse: Warehouse,
    deliveries: Delivery[],
    trucks: Truck[],
  ): Promise<PlanningResult> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, '..', 'utils', 'vrp.worker.js');
      const worker = new Worker(workerPath, {
        workerData: { timeWindow, warehouse, deliveries, trucks },
      });
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      });
    });
  }

  onModuleDestroy() {
    // cleanup if needed
  }
}
