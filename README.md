# Motor de Ruteo Logístico (Route Generator API)
Este proyecto provee un motor matemático asíncrono diseñado para resolver la generación de rutas.

Dada una flota de camiones (con límites de peso y volumen), un punto de partida (depósito), y una lista de entregas, el motor calcula la distribución óptima para minimizar la distancia y el tiempo, respetando las restricciones físicas y horarias.

# Arquitectura y Conceptos Core
Calcular rutas matemáticas óptimas es un proceso intensivo a nivel de CPU (NP-Hard). Por este motivo, nuestra API está diseñada con una Arquitectura Asíncrona basada en Eventos.

El flujo de trabajo principal no es bloqueante:

1. Envías la solicitud: Le entregas los datos al motor.

2. Recibes un Ticket: El servidor responde instantáneamente con un código 202 Accepted y un requestId. El cálculo entra a una cola de procesamiento en segundo plano.

3. Notificación (Webhook): Una vez que el motor termina los cálculos, te enviamos el resultado de vuelta a tu servidor.

# Patrones de Integración
Existen dos formas de interactuar con el motor para obtener los resultados de tus rutas. Te recomendamos implementar el flujo por Webhook para un diseño de sistema más moderno y eficiente.

## Opción A: Webhook (Recomendado)
Un webhook es un "callback HTTP". En lugar de que tú nos preguntes repetidamente si el cálculo terminó, **nosotros te avisamos**.

1. Registras la URL de tu servidor mediante el endpoint POST /groups/register.

2. Envías tu solicitud de ruteo al motor.

3. Cuando el motor finaliza, hace un POST a tu URL con los resultados de las rutas asignadas.

4. Tu servidor debe procesar el JSON y respondernos con un 200 OK en menos de 5 segundos.

**Seguridad (Firmas HMAC):** Para que estés seguro de que el webhook fue enviado por nuestro motor y no por un atacante, todas nuestras peticiones incluyen un header X-Signature. Deberás validar esta firma utilizando tu clientSecret y una función de comparación de tiempo constante.

## Opción B: Polling (Alternativa)
Si por cuestiones de infraestructura no puedes exponer un endpoint público para recibir webhooks, puedes consultar activamente el estado de tu solicitud.

1. Envías la solicitud de ruteo y guardas el requestId.

2. Realizas peticiones periódicas (ej: cada 10 segundos) a GET /plan-route/{requestId}.

3. El motor te responderá con estado PENDING hasta que el cálculo finalice, momento en el cual el estado cambiará a COMPLETED y adjuntará el resultado.

# Buenas Prácticas de Implementación
Para asegurar que tu sistema se integre de forma robusta con el motor, te recomendamos seguir estos principios de diseño:

### 1. Idempotencia y Reintentos
Las redes son inestables. ¿Qué pasa si envías una solicitud de ruteo y tu conexión a internet se corta antes de recibir la respuesta?

Nuestra API es idempotente gracias al uso del requestId (UUID). Si no estás seguro de si recibimos tu solicitud, vuelve a enviarla exactamente con el mismo JSON y el mismo requestId.

Si no la teníamos, la encolaremos.

Si ya la estábamos procesando, simplemente te devolveremos un 200 OK confirmando que ya estamos trabajando en ese mismo ID, sin duplicar el cálculo.

### 2. Manejo de Entregas No Asignadas
No todas las rutas tienen solución matemática perfecta. Si envías 10.000 kg de mercadería pero tu flota solo soporta 5.000 kg, o si la ventana horaria del depósito es muy corta, el motor hará su mejor esfuerzo.

El resultado final siempre incluirá un arreglo llamado unassignedDeliveries. Tu sistema debe ser capaz de leer este arreglo y alertar a los operadores logísticos sobre qué paquetes quedaron en el depósito y los motivos del rechazo.

Especificación de la API (Swagger)
La documentación técnica detallada, los esquemas de datos exactos (DTOs), los formatos de fecha esperados (ISO-8601 UTC) y los códigos de error HTTP se encuentran disponibles en la interfaz interactiva de Swagger.

Una vez que el motor esté en ejecución, puedes acceder a la documentación completa ingresando desde tu navegador a:

``` http://localhost:3000/api/v1/docs ```

Allí encontrarás ejemplos concretos de los payloads, validaciones requeridas (como el uso estricto de números positivos para pesos y volúmenes) y el contrato completo del Webhook.

# Despliegue y Ejecución local
Próximamente: Se publicarán las instrucciones y el archivo docker-compose.yml para levantar el motor de forma local mediante nuestra imagen oficial en Docker Hub.