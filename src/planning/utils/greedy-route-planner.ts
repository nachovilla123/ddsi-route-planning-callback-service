// TODO: Migrate VRP algorithm from class-diagram.puml
// Nearest-neighbor greedy algorithm for Vehicle Routing Problem

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

export function planRoutes(
  warehouse: Warehouse,
  deliveries: Delivery[],
  trucks: Truck[],
): PlanningResult {
  console.log('Planning routes with Greedy Nearest-Neighbor algorithm', {
    warehouse,
    deliveries,
    trucks,
  });
  // TODO: implement greedy nearest-neighbor VRP
  return { routes: [], unassignedDeliveries: [] };
}
