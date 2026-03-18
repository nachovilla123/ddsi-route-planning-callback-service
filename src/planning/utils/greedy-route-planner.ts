import { haversine } from './haversine';
import { randomUUID } from 'crypto';

const AVERAGE_SPEED_KMH = 30;
const MINUTES_PER_KM = 60 / AVERAGE_SPEED_KMH;
const DROPOFF_TIME_MINS = 15;

export interface TimeWindow {
  start: string;
  end: string;
}

export interface Delivery {
  deliveryCode: string;
  lat: number;
  lon: number;
  address: string;
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
  estimatedStartTime: string;
  estimatedEndTime: string;
  totalDistanceKm: number;
  totalDurationMins: number;
  stops: Array<{
    stopNumber: number;
    deliveryCode: string;
    estimatedArrivalTime: string;
  }>;
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
  timeWindow: TimeWindow,
  unassignedPool: Delivery[],
): RouteResult | null {
  let currentLocation: Location = { lat: warehouse.lat, lon: warehouse.lon };
  const capacity: TruckCapacity = {
    remainingWeightKg: truck.weightCapacityKg,
    remainingVolumeM3: truck.volumeCapacityM3,
  };

  const stops: Array<{
    stopNumber: number;
    deliveryCode: string;
    estimatedArrivalTime: string;
  }> = [];
  let stopCounter = 1;

  let totalDistanceKm = 0;
  let totalDurationMins = 0;

  const startTime = new Date(timeWindow.start);
  const endTime = new Date(timeWindow.end);
  const currentTimeTracker = new Date(startTime.getTime());

  while (unassignedPool.length > 0) {
    const nearestIndex = findNearestFittingDeliveryIndex(
      unassignedPool,
      currentLocation,
      capacity,
    );

    if (nearestIndex === -1) break;

    const selected = unassignedPool[nearestIndex];

    const distToNext = haversine(
      currentLocation.lat,
      currentLocation.lon,
      selected.lat,
      selected.lon,
    );

    const travelTimeMins = distToNext * MINUTES_PER_KM;

    const estimatedArrival = new Date(
      currentTimeTracker.getTime() + travelTimeMins * 60000,
    );
    const estimatedDropoffCompletion = new Date(
      estimatedArrival.getTime() + DROPOFF_TIME_MINS * 60000,
    );

    if (estimatedDropoffCompletion > endTime) {
      break;
    }

    totalDistanceKm += distToNext;
    totalDurationMins += travelTimeMins + DROPOFF_TIME_MINS;

    currentTimeTracker.setTime(estimatedArrival.getTime());

    stops.push({
      stopNumber: stopCounter++,
      deliveryCode: selected.deliveryCode,
      estimatedArrivalTime: currentTimeTracker.toISOString(),
    });

    currentTimeTracker.setTime(estimatedDropoffCompletion.getTime());

    currentLocation = { lat: selected.lat, lon: selected.lon };
    capacity.remainingWeightKg -= selected.weightKg;
    capacity.remainingVolumeM3 -= selected.volumeM3;

    unassignedPool.splice(nearestIndex, 1);
  }

  if (stops.length === 0) return null;

  return {
    truckId: truck.truckId,
    assignedRouteId: `ROUTE-${randomUUID().split('-')[0].toUpperCase()}`,
    estimatedStartTime: startTime.toISOString(),
    estimatedEndTime: currentTimeTracker.toISOString(),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalDurationMins: Math.round(totalDurationMins),
    stops,
  };
}

function markUnassigned(
  leftoverDeliveries: Delivery[],
): Array<{ deliveryCode: string; reason: string }> {
  return leftoverDeliveries.map((d) => ({
    deliveryCode: d.deliveryCode,
    reason: 'Capacity exceeded, no trucks available, or time window exceeded',
  }));
}

export function planRoutes(
  timeWindow: TimeWindow,
  warehouse: Warehouse,
  deliveries: Delivery[],
  trucks: Truck[],
): PlanningResult {
  const unassignedPool = [...deliveries];
  const routes: RouteResult[] = [];

  for (const truck of trucks) {
    const route = buildRouteForTruck(
      truck,
      warehouse,
      timeWindow,
      unassignedPool,
    );
    if (route) routes.push(route);
  }

  return {
    routes,
    unassignedDeliveries: markUnassigned(unassignedPool),
  };
}
