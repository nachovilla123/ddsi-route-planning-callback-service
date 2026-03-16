import { planRoutes } from './greedy-route-planner';

// 1. El "Happy Path" (Ruta Feliz)

// Qué probar: Exactamente el payload que acabamos de usar.

// Qué esperar: Que asigne todo correctamente, que unassignedDeliveries esté vacío, y que el orden de las paradas (stops) sea el correcto.

// 2. El escenario "Falta de Flota" (Capacidad Excedida)

// Qué probar: Mandar 5 entregas de 100kg cada una, pero enviar un solo camión que soporta 50kg.

// Qué esperar: El arreglo routes vuelve vacío, y todos los paquetes terminan en el arreglo unassignedDeliveries con el reason correspondiente.

// 3. La trampa del "Volumen vs. Peso" (Restricciones Cruzadas)

// Qué probar: Un paquete pesa solo 1kg (entra perfecto por peso) pero ocupa 10m3 (es una caja gigante llena de plumas). El camión soporta 1000kg, pero solo tiene 5m3 de espacio.

// Qué esperar: El algoritmo debe rechazar el paquete y mandarlo a unassignedDeliveries. (Esto prueba que tu && en el condicional de capacidad funciona perfecto).

// 4. El test de "Pura Cercanía" (El corazón del algoritmo)

// Qué probar: Un camión gigante (capacidad infinita), el depósito en el centro, el Paquete A a 5km y el Paquete B a 1km.

// Qué esperar: Asegurar estrictamente que la parada 1 (stopNumber: 1) sea el Paquete B, y la parada 2 sea el Paquete A. (Esto valida que tu ciclo de minDistance y la fórmula de Haversine están calculando bien).

// 5. Los "Edge Cases" (Casos Extremos)

// Cero Camiones: Le mandas entregas, pero la lista de camiones está vacía []. Todo debe ir a unassigned.

// Cero Entregas: Le mandas camiones, pero ninguna entrega. Debe devolver todo vacío sin crashear.

describe('Greedy Route Planner (VRP)', () => {
  it('debería asignar todas las rutas correctamente en el Happy Path', () => {
    // 1. Arrange (Preparar datos)
    const warehouse = { lat: -34.6037, lon: -58.3816, address: 'Centro' };
    const deliveries = [
      /* ... tu array ... */
    ];
    const trucks = [
      /* ... tu array ... */
    ];

    // 2. Act (Ejecutar)
    const result = planRoutes(warehouse, deliveries, trucks);

    // 3. Assert (Validar)
    expect(result.unassignedDeliveries.length).toBe(0);
    expect(result.routes.length).toBe(2);
    expect(result.routes[0].truckId).toBe('CAMION-CHICO');
  });

  it('debería rechazar paquetes si el camión no tiene suficiente volumen', () => {
    // ... armas el test del caso 3
  });
});
