// This file runs inside a worker_threads context — no NestJS DI here.
import { workerData, parentPort } from 'worker_threads';
import { planRoutes } from './greedy-route-planner';

const { warehouse, deliveries, trucks } = workerData as {
  warehouse: Parameters<typeof planRoutes>[0];
  deliveries: Parameters<typeof planRoutes>[1];
  trucks: Parameters<typeof planRoutes>[2];
};

const result = planRoutes(warehouse, deliveries, trucks);
parentPort?.postMessage(result);
