import {
  planRoutes,
  Warehouse,
  Delivery,
  Truck,
  TimeWindow,
} from './greedy-route-planner';

const warehouse: Warehouse = {
  lat: -34.6037,
  lon: -58.3816,
  address: 'Obelisco, Buenos Aires',
};

// Mock de Jornada: 8 horas operativas
const timeWindow: TimeWindow = {
  start: '2025-09-21T09:00:00Z',
  end: '2025-09-21T17:00:00Z',
};

function makeTruck(overrides: Partial<Truck> & { truckId: string }): Truck {
  return { weightCapacityKg: 1000, volumeCapacityM3: 10, ...overrides };
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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    expect(result.unassignedDeliveries).toHaveLength(0);
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].truckId).toBe('T1');
    expect(result.routes[0].stops).toHaveLength(2);
    expect(result.routes[0].assignedRouteId).toMatch(/^ROUTE-/);
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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
    expect(result.unassignedDeliveries[0].deliveryCode).toBe('PLOMO');
  });

  // ── 4. Cercanía (el corazón del algoritmo greedy) ─────────────

  it('asigna primero la entrega más cercana al depósito', () => {
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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    expect(result.routes).toHaveLength(1);
    const stops = result.routes[0].stops;
    expect(stops[0].deliveryCode).toBe('CERCA');
    expect(stops[0].stopNumber).toBe(1);
    expect(stops[1].deliveryCode).toBe('LEJOS');
    expect(stops[1].stopNumber).toBe(2);
  });

  // ── 5. Edge Cases ─────────────────────────────────────────────

  it('devuelve todo vacío cuando no hay camiones', () => {
    const deliveries: Delivery[] = [makeDelivery({ deliveryCode: 'D1' })];

    const result = planRoutes(timeWindow, warehouse, deliveries, []);

    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
  });

  it('devuelve todo vacío cuando no hay entregas', () => {
    const trucks: Truck[] = [makeTruck({ truckId: 'T1' })];

    const result = planRoutes(timeWindow, warehouse, [], trucks);

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

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    expect(result.unassignedDeliveries).toHaveLength(0);
    expect(result.routes).toHaveLength(2);
  });

  // ── 7. NUEVO: Restricciones de Tiempo (VRPTW) ─────────────────

  it('rechaza entregas si no alcanzan a completarse dentro de la ventana horaria', () => {
    // Paquete extremadamente lejos (ej. otra provincia)
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'MUY-LEJOS', lat: -38.0, lon: -58.38 }),
    ];
    const trucks: Truck[] = [
      makeTruck({
        truckId: 'T1',
        weightCapacityKg: 5000,
        volumeCapacityM3: 50,
      }),
    ];

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    // El camión tiene capacidad de peso/volumen, pero NO tiene tiempo en sus 8 horas.
    expect(result.routes).toHaveLength(0);
    expect(result.unassignedDeliveries).toHaveLength(1);
    expect(result.unassignedDeliveries[0].deliveryCode).toBe('MUY-LEJOS');
  });

  it('calcula correctamente los tiempos de llegada y descarga (15 mins base)', () => {
    const deliveries: Delivery[] = [
      // Mismo punto exacto (distancia 0), solo tarda los 15 min de descarga
      makeDelivery({
        deliveryCode: 'AQUI-MISMO',
        lat: -34.6037,
        lon: -58.3816,
      }),
    ];
    const trucks: Truck[] = [makeTruck({ truckId: 'T1' })];

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    const route = result.routes[0];
    expect(route.totalDistanceKm).toBe(0);
    expect(route.totalDurationMins).toBe(15);
    expect(route.estimatedStartTime).toBe('2025-09-21T09:00:00.000Z');

    // Debería terminar a las 09:15 AM
    expect(route.estimatedEndTime).toBe('2025-09-21T09:15:00.000Z');
    expect(route.stops[0].estimatedArrivalTime).toBe(
      '2025-09-21T09:00:00.000Z',
    );
  });

  it('acumula el tiempo de viaje correctamente para múltiples paradas', () => {
    // Para no depender del math exacto de haversine, comprobamos que el fin es mayor al inicio
    const deliveries: Delivery[] = [
      makeDelivery({ deliveryCode: 'P1', lat: -34.61, lon: -58.38 }),
      makeDelivery({ deliveryCode: 'P2', lat: -34.62, lon: -58.39 }),
    ];
    const trucks: Truck[] = [makeTruck({ truckId: 'T1' })];

    const result = planRoutes(timeWindow, warehouse, deliveries, trucks);

    const route = result.routes[0];
    const startTimestamp = new Date(route.estimatedStartTime).getTime();
    const endTimestamp = new Date(route.estimatedEndTime).getTime();

    // Al haber distancia y dos paradas, el tiempo total debe ser mayor a 30 mins (2 * 15m dropoff)
    expect(endTimestamp - startTimestamp).toBeGreaterThan(30 * 60000);
    expect(route.totalDurationMins).toBeGreaterThan(30);
    expect(route.totalDistanceKm).toBeGreaterThan(0);
  });
});
