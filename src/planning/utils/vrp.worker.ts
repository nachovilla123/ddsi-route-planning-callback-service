// This file runs inside a worker_threads context — no NestJS DI here.
import { workerData, parentPort } from 'worker_threads';
import { planRoutes } from './greedy-route-planner';

const { timeWindow, warehouse, deliveries, trucks } = workerData as {
  timeWindow: Parameters<typeof planRoutes>[0];
  warehouse: Parameters<typeof planRoutes>[1];
  deliveries: Parameters<typeof planRoutes>[2];
  trucks: Parameters<typeof planRoutes>[3];
};

const result = planRoutes(timeWindow, warehouse, deliveries, trucks);
parentPort?.postMessage(result);
