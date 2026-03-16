import { planRoutes, Warehouse, Delivery, Truck } from './greedy-route-planner';

const warehouse: Warehouse = {
  lat: -34.6037,
  lon: -58.3816,
  address: 'Obelisco, Buenos Aires',
};

function makeTruck(overrides: Partial<Truck> & { truckId: string }): Truck {
  return {
    weightCapacityKg: 1000,
    volumeCapacityM3: 10,
    ...overrides,
  };
}

function makeDelivery(
  overrides: Partial<Delivery> & { deliveryCode: string },
): Delivery {
  return {
    lat: warehouse.lat,
    lon: warehouse.lon,
    weightKg: 10,
    volumeM3: 1,
    ...overrides,
  };
}

describe('Greedy Route Planner', () => {
  // ── 1. Happy Path ──────────────────────────────────────────────

  it('asigna todas las entregas cuando hay capacidad suficiente', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'D1', lat: -34.61, lon: -58.38 }),
      makeDelivery({ deliveryCode: 'D2', lat: -34.62, lon: -58.39 }),
    ];
    const trucks: Truck[] = [
      makeTruck({ truckId: 'T1', weightCapacityKg: 500, volumeCapacityM3: 50 }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.unassignedDeliveries).toHaveLength(0);
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].truckId).toBe('T1');
    expect(result.routes[0].stops).toHaveLength(2);
    expect(result.routes[0].assignedRouteId).toMatch(/^route_/);
  });

  // ── 2. Falta de Flota ─────────────────────────────────────────

  it('marca todas las entregas como no asignadas si el camión no alcanza', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'D1', weightKg: 100 }),
      makeDelivery({ deliveryCode: 'D2', weightKg: 100 }),
      makeDelivery({ deliveryCode: 'D3', weightKg: 100 }),
    ];
    const trucks: Truck[] = [
      makeTruck({ truckId: 'T1', weightCapacityKg: 50, volumeCapacityM3: 50 }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(3);
    result.unassignedDeliveries.forEach((u) => {
      expect(u.reason).toBeDefined();
    });
  });

  // ── 3. Volumen vs. Peso (restricciones cruzadas) ──────────────

  it('rechaza un paquete que entra por peso pero no por volumen', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'PLUMAS', weightKg: 1, volumeM3: 10 }),
    ];
    const trucks: Truck[] = [
      makeTruck({ truckId: 'T1', weightCapacityKg: 1000, volumeCapacityM3: 5 }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
    expect(result.unassignedDeliveries[0].deliveryCode).toBe('PLUMAS');
  });

  it('rechaza un paquete que entra por volumen pero no por peso', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'PLOMO', weightKg: 500, volumeM3: 0.1 }),
    ];
    const trucks: Truck[] = [
      makeTruck({ truckId: 'T1', weightCapacityKg: 100, volumeCapacityM3: 50 }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
    expect(result.unassignedDeliveries[0].deliveryCode).toBe('PLOMO');
  });

  // ── 4. Cercanía (el corazón del algoritmo greedy) ─────────────

  it('asigna primero la entrega más cercana al depósito', () => {
    // Paquete A: lejos (~11 km al sur)
    // Paquete B: cerca (~1 km al sur)
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'LEJOS', lat: -34.7, lon: -58.38 }),
      makeDelivery({ deliveryCode: 'CERCA', lat: -34.61, lon: -58.38 }),
    ];
    const trucks: Truck[] = [
      makeTruck({
        truckId: 'T1',
        weightCapacityKg: 10000,
        volumeCapacityM3: 100,
      }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(1);
    const stops = result.routes[0].stops;
    expect(stops[0].deliveryCode).toBe('CERCA');
    expect(stops[0].stopNumber).toBe(1);
    expect(stops[1].deliveryCode).toBe('LEJOS');
    expect(stops[1].stopNumber).toBe(2);
  });

  it('encadena la cercanía desde la última parada, no desde el depósito', () => {
    // Depot en (0, 0). A en (0, 1), B en (0, 2), C en (0, 10).
    // Greedy: depot->A(1)  ->B(1 from A)  ->C(8 from B)
    const depot: Warehouse = { lat: 0, lon: 0, address: 'Origin' };
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'C', lat: 0, lon: 10 }),
      makeDelivery({ deliveryCode: 'A', lat: 0, lon: 1 }),
      makeDelivery({ deliveryCode: 'B', lat: 0, lon: 2 }),
    ];
    const trucks: Truck[] = [
      makeTruck({
        truckId: 'T1',
        weightCapacityKg: 10000,
        volumeCapacityM3: 100,
      }),
    ];

    const result = planRoutes(depot, deliveries, trucks);

    const codes = result.routes[0].stops.map((s) => s.deliveryCode);
    expect(codes).toEqual(['A', 'B', 'C']);
  });

  // ── 5. Edge Cases ─────────────────────────────────────────────

  it('devuelve todo vacío cuando no hay camiones', () => {
    const deliveries: Delivery[] = [makeDelivery({ deliveryCode: 'D1' })];

    const result = planRoutes(warehouse, deliveries, []);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
  });

  it('devuelve todo vacío cuando no hay entregas', () => {
    const trucks: Truck[] = [makeTruck({ truckId: 'T1' })];

    const result = planRoutes(warehouse, [], trucks);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(0);
  });

  it('devuelve vacío si no hay camiones ni entregas', () => {
    const result = planRoutes(warehouse, [], []);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(0);
  });

  // ── 6. Múltiples camiones ─────────────────────────────────────

  it('reparte entregas entre varios camiones cuando uno se llena', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'D1', weightKg: 80 }),
      makeDelivery({ deliveryCode: 'D2', weightKg: 80 }),
      makeDelivery({ deliveryCode: 'D3', weightKg: 80 }),
    ];
    const trucks: Truck[] = [
      makeTruck({
        truckId: 'T1',
        weightCapacityKg: 100,
        volumeCapacityM3: 100,
      }),
      makeTruck({
        truckId: 'T2',
        weightCapacityKg: 200,
        volumeCapacityM3: 100,
      }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.unassignedDeliveries).toHaveLength(0);
    expect(result.routes).toHaveLength(2);

    const allStops = result.routes.flatMap((r) => r.stops);
    expect(allStops).toHaveLength(3);
  });

  it('genera un assignedRouteId único por ruta', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'D1', weightKg: 50 }),
      makeDelivery({ deliveryCode: 'D2', weightKg: 50 }),
    ];
    const trucks: Truck[] = [
      makeTruck({ truckId: 'T1', weightCapacityKg: 60, volumeCapacityM3: 100 }),
      makeTruck({ truckId: 'T2', weightCapacityKg: 60, volumeCapacityM3: 100 }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    const routeIds = result.routes.map((r) => r.assignedRouteId);
    expect(new Set(routeIds).size).toBe(routeIds.length);
  });

  // ── 7. Capacidad se consume correctamente ─────────────────────

  it('no asigna más entregas cuando la capacidad restante no alcanza', () => {
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'D1', weightKg: 60 }),
      makeDelivery({ deliveryCode: 'D2', weightKg: 60 }),
    ];
    const trucks: Truck[] = [
      makeTruck({
        truckId: 'T1',
        weightCapacityKg: 100,
        volumeCapacityM3: 100,
      }),
    ];

    const result = planRoutes(warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].stops).toHaveLength(1);
    expect(result.unassignedDeliveries).toHaveLength(1);
  });
});