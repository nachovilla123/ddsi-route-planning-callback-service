import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { IngestionService } from '../services/ingestion.service';
import { PlanRouteDto } from '../dtos/request/plan-route.request.dto';
import { PlanRouteResponseDto } from '../dtos/response/plan-route.response.dto';
import { GetRouteStatusResponseDto } from '../dtos/response/get-route.response.dto';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Plan Route')
@ApiBearerAuth()
@Controller('plan-route')
@UseGuards(ApiKeyGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(202)
  @ApiOperation({
    summary: 'Solicitar planificación de rutas (Asíncrono)',
    description: `
Recibe un listado de entregas y camiones para calcular las rutas óptimas. El procesamiento es asíncrono.

### 🪝 Webhook Callback (Notificación de finalización)
Una vez que el motor matemático termine el cálculo (o falle), nuestro \`DispatchService\` enviará un \`POST\` a la URL (\`callbackUrl\`) que configuraste para tu grupo.

#### 🛡️ Seguridad (Verificación de Firma)
Para garantizar que la petición proviene de nuestro motor y no de un tercero malicioso, incluimos una firma criptográfica en los headers.

* **Header:** \`X-Signature\`
* **Formato:** La firma siempre comienza con el prefijo \`sha256=\` seguido del hash en formato hexadecimal.
* **Generación:** El hash se genera usando un **HMAC SHA-256**, utilizando tu \`clientSecret\` como llave secreta y el cuerpo crudo de la petición como mensaje.
* **Codificación:** Asegúrate de procesar el payload como **UTF-8** para evitar errores de firma con caracteres especiales.
* **Prevención de Timing Attacks:** Utiliza funciones de comparación de tiempo constante (ej: \`MessageDigest.isEqual\` en Java o \`crypto.timingSafeEqual\` en Node.js) en lugar del operador \`==\`.

#### 📦 Payload de Ejemplo Completo
\`\`\`json
{
  "event_id": "evt_7b92a18c-4e5d-4a11-b2c3-9f8d7e6c5b4a",
  "event_type": "routing.completed",
  "request_id": "123e4567-e89b-12d3-a456-425614134023",
  "timestamp": "2026-03-18T08:05:00.000Z",
  "data": {
    "routes": [
      {
        "truckId": "CAMION-CHICO",
        "assignedRouteId": "ROUTE-74EA598C",
        "estimatedStartTime": "2026-03-18T08:00:00.000Z",
        "estimatedEndTime": "2026-03-18T08:47:00.000Z",
        "totalDistanceKm": 8.27,
        "totalDurationMins": 47,
        "stops": [
          {
            "stopNumber": 1,
            "deliveryCode": "ENT-001",
            "estimatedArrivalTime": "2026-03-18T08:04:00.000Z"
          },
          {
            "stopNumber": 2,
            "deliveryCode": "ENT-002",
            "estimatedArrivalTime": "2026-03-18T08:32:00.000Z"
          }
        ]
      }
    ],
    "unassignedDeliveries": [
      {
        "deliveryCode": "ENT-003",
        "reason": "Capacity exceeded, no trucks available, or time window exceeded"
      }
    ]
  }
}
\`\`\`

#### 📊 Diccionario de Datos (Schema)
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| \`event_id\` | \`String (UUID)\` | Identificador único de este evento de webhook. |
| \`event_type\` | \`String\` | Tipo de evento. Siempre será \`routing.completed\` o \`routing.failed\`. |
| \`request_id\` | \`String (UUID)\` | El ID de la solicitud original que enviaste al motor. |
| \`timestamp\` | \`String (ISO 8601)\`| Fecha y hora exacta de la generación del evento. |
| \`data.routes\` | \`Array<Object>\` | Lista de rutas asignadas a los camiones. |
| \`...truckId\` | \`String\` | Identificador del camión asignado a esta ruta. |
| \`...assignedRouteId\` | \`String\` | Identificador único interno de la ruta generada. |
| \`...estimatedStartTime\`| \`String (ISO 8601)\`| Hora estimada de salida del depósito. |
| \`...estimatedEndTime\` | \`String (ISO 8601)\`| Hora estimada de finalización de la última entrega. |
| \`...totalDistanceKm\` | \`Float\` | Distancia total a recorrer en kilómetros. |
| \`...totalDurationMins\` | \`Integer\` | Duración total de la ruta en minutos (viaje + descargas). |
| \`...stops\` | \`Array<Object>\` | Secuencia ordenada de paradas que debe realizar el camión. |
| \`......stopNumber\` | \`Integer\` | Número de orden de la parada (1, 2, 3...). |
| \`......deliveryCode\` | \`String\` | Código de la entrega asignada a esta parada. |
| \`......estimatedArrivalTime\`| \`String (ISO 8601)\`| Hora estimada de llegada al punto de entrega. |
| \`data.unassignedDeliveries\`| \`Array<Object>\` | Lista de entregas que no pudieron ser ruteadas. |
| \`...deliveryCode\` | \`String\` | Código de la entrega rechazada. |
| \`...reason\` | \`String\` | Motivo del rechazo (falta de tiempo, peso o volumen). |

#### ⏱️ Expectativas de Respuesta
Tu servidor debe responder al webhook con un código HTTP \`200 OK\` en menos de **5 segundos**.
    `,
  })
  @ApiResponse({
    status: 202,
    description: 'Solicitud aceptada para procesamiento',
    type: PlanRouteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de solicitud invalidos' })
  @ApiResponse({ status: 401, description: 'API key invalida o ausente' })
  planRoute(
    @Body() dto: PlanRouteDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<PlanRouteResponseDto> {
    return this.ingestionService.saveRoutingRequest(dto, group.id);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Consultar el estado y resultado de una planificacion (Polling)',
  })
  @ApiParam({ name: 'id', description: 'ID de la solicitud (requestId)' })
  @ApiResponse({
    status: 200,
    description: 'Estado actual de la solicitud y sus resultados si finalizo',
    type: GetRouteStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada o no pertenece a tu grupo',
  })
  @ApiResponse({ status: 401, description: 'API key invalida o ausente' })
  getPlannedRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentGroup() group: StudentGroup,
  ): Promise<GetRouteStatusResponseDto> {
    return this.ingestionService.getRoutingStatus(id, group.id);
  }
}
