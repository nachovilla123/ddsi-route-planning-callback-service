import { haversine } from './haversine';
import { randomUUID } from 'crypto';

export interface Delivery {
  deliveryCode: string;
  lat: number;
  lon: number;
  weightKg: number;
  volumeM3: number;
}

export interface Truck {
  truckId: string;
  weightCapacityKg: number;
  volumeCapacityM3: number;
}

export interface Warehouse {
  lat: number;
  lon: number;
  address: string;
}

export interface RouteResult {
  truckId: string;
  assignedRouteId: string;
  stops: Array<{ stopNumber: number; deliveryCode: string }>;
}

export interface PlanningResult {
  routes: RouteResult[];
  unassignedDeliveries: Array<{ deliveryCode: string; reason: string }>;
}

interface TruckCapacity {
  remainingWeightKg: number;
  remainingVolumeM3: number;
}

interface Location {
  lat: number;
  lon: number;
}

function fitsInTruck(delivery: Delivery, capacity: TruckCapacity): boolean {
  return (
    delivery.weightKg <= capacity.remainingWeightKg &&
    delivery.volumeM3 <= capacity.remainingVolumeM3
  );
}

function findNearestFittingDeliveryIndex(
  candidates: Delivery[],
  currentLocation: Location,
  capacity: TruckCapacity,
): number {
  let nearestIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    if (!fitsInTruck(candidate, capacity)) continue;

    const dist = haversine(
      currentLocation.lat,
      currentLocation.lon,
      candidate.lat,
      candidate.lon,
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}

function buildRouteForTruck(
  truck: Truck,
  warehouse: Warehouse,
  unassignedPool: Delivery[],
): RouteResult | null {
  let currentLocation: Location = { lat: warehouse.lat, lon: warehouse.lon };
  const capacity: TruckCapacity = {
    remainingWeightKg: truck.weightCapacityKg,
    remainingVolumeM3: truck.volumeCapacityM3,
  };

  const stops: Array<{ stopNumber: number; deliveryCode: string }> = [];
  let stopCounter = 1;

  while (unassignedPool.length > 0) {
    const nearestIndex = findNearestFittingDeliveryIndex(
      unassignedPool,
      currentLocation,
      capacity,
    );

    if (nearestIndex === -1) break;

    const selected = unassignedPool[nearestIndex];

    stops.push({
      stopNumber: stopCounter++,
      deliveryCode: selected.deliveryCode,
    });

    currentLocation = { lat: selected.lat, lon: selected.lon };
    capacity.remainingWeightKg -= selected.weightKg;
    capacity.remainingVolumeM3 -= selected.volumeM3;

    unassignedPool.splice(nearestIndex, 1);
  }

  if (stops.length === 0) return null;

  return {
    truckId: truck.truckId,
    assignedRouteId: `route_${randomUUID()}`,
    stops,
  };
}

function markUnassigned(
  leftoverDeliveries: Delivery[],
): Array<{ deliveryCode: string; reason: string }> {
  return leftoverDeliveries.map((d) => ({
    deliveryCode: d.deliveryCode,
    reason: 'Capacity exceeded or insufficient trucks available',
  }));
}

export function planRoutes(
  warehouse: Warehouse,
  deliveries: Delivery[],
  trucks: Truck[],
): PlanningResult {
  const unassignedPool = [...deliveries];
  const routes: RouteResult[] = [];

  for (const truck of trucks) {
    const route = buildRouteForTruck(truck, warehouse, unassignedPool);
    if (route) routes.push(route);
  }

  return {
    routes,
    unassignedDeliveries: markUnassigned(unassignedPool),
  };
}
