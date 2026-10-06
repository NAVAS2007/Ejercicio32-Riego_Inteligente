Bitácora de Prompts
P0 · Prompt cero
Prompt textual:
```text
ROL: Sos un desarrollador senior de aplicaciones web.

CONTEXTO: Estoy construyendo una app llamada "Riego Inteligente" para un pequeño agricultor o huerta escolar. El problema que resuelve es: "Se riega el cultivo aunque vaya a llover en la tarde".

TAREA: Generá la primera versión funcional, con estas tres funciones y nada más:
1. Consultar el pronóstico del municipio desde una API pública (por ejemplo Open-Meteo).
2. Recomendación de riego: SÍ o NO, con el motivo basado en el pronóstico.
3. Historial de decisiones tomadas.

RESTRICCIONES: En español, sin librerías de pago, sin login, sin base de datos en servidor todavía. Que se vea bien en un celular. Código en HTML, CSS y JavaScript vanilla (sin React ni Vite). Código comentado en los puntos donde alguien vaya a equivocarse.

FORMATO DE SALIDA: Los archivos completos (index.html, styles.css, app.js), cada uno con su nombre, y al final una lista de lo que NO hiciste y por qué.

CRITERIO DE ACEPTACIÓN: Abro la app, consulto el pronóstico del municipio y veo si debo regar o no sin ningún error en la consola. Asegúrate de incluir el manejo de errores para peticiones fallidas a la API. hazlo para El Salvador y usa la API de OpenWeatherMap con validación de ubicaciones locales.
```
Qué devolvió: La estructura base completa en tres archivos (HTML, CSS y JS vanilla) con el catálogo de los 14 departamentos de El Salvador, consulta a API meteorológica y recomendación básica.
Qué acepté: La arquitectura sin frameworks en cliente, la delimitación geográfica de coordenadas salvadoreñas y el panel colapsable de opciones para la API.
Qué corregí a mano: Configuré Open-Meteo como proveedor predeterminado gratuito para que la app no fallara si el usuario no contaba con una API Key activa de OpenWeatherMap.
Evidencia: `evidencias/E0-inicial.png`
Commit: `4f1a28c`
---
M1 · Función
Prompt textual:
```text
ROL: Sos un desarrollador senior optimizando la lógica de negocio.

CONTEXTO: Tenemos la versión inicial P0 de "Riego Inteligente". Ahora necesitamos asegurar que la consulta de clima y la lógica de decisión funcionen sin fallos y den resultados útiles.

TAREA (M1):
1. Asegurar que la consulta a Open-Meteo obtenga correctamente la temperatura, la probabilidad de lluvia y la precipitación del día actual para el municipio seleccionado.
2. Implementar una regla clara de decisión: si la probabilidad de lluvia es mayor al 50% o la precipitación prevista es mayor a 2mm, recomendar "NO REGAR" con la justificación correspondiente. En caso contrario, recomendar "REGAR".
3. Mostrar claramente el estado del clima actual y la sugerencia final en la interfaz.

FORMATO DE SALIDA: Los archivos actualizados (index.html, styles.css, app.js).
```
Qué devolvió: Lógica agronómica con umbrales matemáticos claros, extracción de `precipitation_probability_max` y `precipitation_sum` en Open-Meteo, y banner de veredicto con justificación técnica.
Qué acepté: La regla condicional estricta (`probLluvia > 50 || precipitacionMm > 2`), el cálculo de respaldo horario y la tarjeta visual con etiquetas de superación de umbrales.
Qué corregí a mano: Redacté justificaciones agronómicas más detalladas sobre lavado de abonos, asfixia de raíces y horas recomendadas para regar temprano en la mañana.
Evidencia: `evidencias/E1-antes.png` / `evidencias/E1-despues.png`
Commit: `8b29d10`
---
M2 · Datos
Prompt textual:
```text
ROL: Sos un desarrollador senior mejorando la persistencia de datos.

CONTEXTO: Ya tenemos funcionando la consulta de clima y la recomendación (M1). Ahora necesitamos que la aplicación recuerde las decisiones tomadas para que el agricultor pueda llevar un registro.

TAREA (M2):
1. Implementar almacenamiento local utilizando `localStorage` para guardar el historial de decisiones.
2. Cada registro del historial debe guardar: la fecha y hora, el municipio, el clima reportado y la decisión tomada (REGAR o NO REGAR).
3. Asegurar que al recargar la página, el historial guardado anteriormente no se pierda y se muestre en pantalla.
4. Agregar la opción para vaciar o borrar el historial completo si el usuario lo desea.

FORMATO DE SALIDA: Los archivos actualizados (index.html, styles.css, app.js).
```
Qué devolvió: Métodos de guardado y lectura en `localStorage` con clave `riego_historial_sv`, serialización JSON, formateo local de fecha/hora para El Salvador y botones de borrado total e individual.
Qué acepté: La estructura de cada objeto del historial con ID único, timestamp, clima completo y la persistencia automática que se recarga al abrir la página.
Qué corregí a mano: Añadí un diálogo nativo de confirmación (`confirm()`) antes de borrar todo el historial para evitar pérdidas accidental de datos en el campo.
Evidencia: `evidencias/E2-antes.png` / `evidencias/E2-despues.png`
Commit: `c37d45e`
---
M3 · Experiencia
Prompt textual:
```text
ROL: Sos un desarrollador senior enfocado en la experiencia de usuario móvil (UX/UI Responsive).

CONTEXTO: Tenemos funcionando la consulta de clima y el guardado en localStorage (M2). Ahora debemos asegurar que la aplicación sea extremadamente cómoda y legible en pantallas de teléfonos celulares, pensando en agricultores que la usarán en el campo con luz solar.

TAREA (M3):
1. Diseñar y ajustar el CSS para que la interfaz sea 100% responsive y Mobile-First.
2. Usar un diseño de tarjetas claras con alto contraste y botones con áreas de toque grandes (mínimo 48px de altura) para facilitar la lectura al aire libre.
3. Formatear la lista del historial para que no desborde horizontalmente y se adapte de forma limpia a pantallas estrechas.
4. Agregar estados visuales amigables cuando el historial esté vacío (empty state) con una ilustración o mensaje orientador.

FORMATO DE SALIDA: Los archivos actualizados (index.html, styles.css, app.js).
```
Qué devolvió: Hoja de estilos Mobile-First con contraste elevado (WCAG AAA/AA), botones de 52 px de altura, rejilla de métricas compacta y un Empty State ilustrado en SVG vectorial.
Qué acepté: El diseño de tarjetas de color blanco puro sobre fondo anti-reflejo, la eliminación de scroll horizontal y la ilustración del brote germinando con gotas de agua para el estado vacío.
Qué corregí a mano: Incrementé el grosor de los bordes a 2 px con colores contrastantes para compensar el reflejo y la pérdida de nitidez en pantallas de celular bajo la luz directa del sol.
Evidencia: `evidencias/E3-celular.png` / `evidencias/E3-vacio.png`
Commit: `e901f22`
---
M4 · Robustez
Prompt textual:
```text
ROL: Sos un desarrollador senior enfocado en la resiliencia, manejo de errores y validación de datos.

CONTEXTO: Tenemos la interfaz adaptable y responsive (M3). Ahora debemos asegurar que la aplicación maneje de forma robusta los errores de red, fallos de API o entradas no válidas para que nunca se quede colgada ni muestre pantallas en blanco.

TAREA (M4):
1. Agregar validaciones estrictas a las entradas del usuario (asegurar que haya un municipio seleccionado antes de consultar).
2. Implementar un indicador de carga claro (loading spinner o mensaje) mientras se realiza la consulta a la API de clima.
3. Manejar adecuadamente los errores de red o caídas de la API (usando bloques try/catch) mostrando un mensaje de alerta amigable e instructivo en pantalla en lugar de fallar silenciosamente.
4. Asegurar que las consultas con timeout o datos incompletos no corrompan el historial guardado en localStorage.

FORMATO DE SALIDA: Los archivos actualizados (index.html, styles.css, app.js).
```
Qué devolvió: Validación obligatoria del selector de municipios con animación shake, spinner animado con mensajes accesibles (`role="status"`), timeout de 9 segundos con `AbortController` y sanitización defensiva en `localStorage`.
Qué acepté: El manejo clasificado de fallos (sin internet, timeout, error 500, JSON malformado) con botones de reintento en pantalla y la desactivación del botón de consulta para prevenir dobles clics.
Qué corregí a mano: Agregué detectores de eventos globales `window.addEventListener('offline')` y `online` para notificar al usuario de forma reactiva en zonas con señal inestable.
Evidencia: `evidencias/E4-error.png`
Commit: `1a64b90`
---
M5 · Inteligencia
Prompt textual:
```text
ROL: Sos un desarrollador senior especialista en integración de modelos de lenguaje e inteligencia artificial con salida estructurada.

CONTEXTO: Ya tenemos la aplicación estable, resiliente y con almacenamiento local (M4). Ahora vamos a integrar la API de Google Gemini (gemini-2.5-flash) para que actúe como un agrónomo experto que analice el pronóstico del clima y tome la decisión de riego devolviendo una respuesta strictly en JSON Schema.

TAREA (M5):
1. Integrar la llamada a la API de Google Gemini (utilizando el modelo gemini-2.5-flash) enviándole los datos meteorológicos obtenidos de Open-Meteo (temperatura, precipitación, probabilidad de lluvia y humedad).
2. Configurar el parámetro `responseSchema` en la llamada a la API de Gemini para obligar al modelo a devolver una respuesta JSON estructurada con la siguiente forma:
   {
     "regar": boolean,
     "justificacion": string,
     "recomendacion_adicional": string
   }
3. Procesar ese JSON en JavaScript para mostrar de forma destacada si se debe regar o no, la justificación técnica del modelo y la recomendación adicional para el agricultor.
4. Incluir un mecanismo de contingencia (fallback): si la API de Gemini falla o no hay clave API configurada, la app debe calcular la recomendación utilizando la regla lógica local de M1 sin interrumpir la experiencia del usuario.

FORMATO DE SALIDA: Los archivos actualizados (index.html, styles.css, app.js).
```
Qué devolvió: Integración de Google Gemini mediante proxy server-side Express (`/api/evaluar-riego`) y llamada directa, esquema estricto `responseSchema`, tarjetas para consejo agronómico y fallback transparente a la regla M1.
Qué acepté: La estructura JSON tipada con booleanos y strings, la separación en dos tarjetas (justificación técnica + consejo práctico) y el badge visual que indica si la decisión provino de Gemini o del modo de contingencia.
Qué corregí a mano: Al probar en vivo, el endpoint reportó deprecación del modelo `gemini-2.5-flash`, por lo que implementé una transición inteligente en el servidor que intenta `gemini-2.5-flash` y conmuta de forma automática y transparente a `gemini-3.8-flash`, asegurando que la IA siempre responda con éxito.
Evidencia: `evidencias/E5-json.png` / `evidencias/E5-app.png` / `evidencias/E5-falla.png`
Commit: `7d5c31b`
---
Cierre
Prompts que escribí en total: 6 prompts principales de desarrollo (P0, M1, M2, M3, M4, M5) más 2 prompts de ajuste de documentación y resolución de errores.
El prompt que más me sirvió y por qué: El prompt de M5 (Inteligencia), porque forzar a la IA a responder con un `responseSchema` estricto en JSON eliminó cualquier texto de relleno o formato ambiguo, permitiendo procesar y pintar en la interfaz web el veredicto, la justificación y los consejos agrícolas de manera limpia y predecible.
El error más caro que cometí: En P0, haber solicitado en el mismo prompt OpenWeatherMap y Open-Meteo sin definir cuál era el servicio por defecto; esto provocaba fallos de autorización si no había una clave `appid` de OpenWeatherMap guardada, lo que obligó a rediseñar la estrategia de proveedor meteorológico hacia Open-Meteo como fuente principal gratuita.
Lo que haría distinto la próxima vez: Definiría la estrategia de pruebas con datos simulados (mocking) y manejo de fallback desde el hito P0 en lugar de esperar hasta M4 y M5; esto hubiera acelerado las pruebas de conexión intermitente en celulares antes de tocar la capa de presentación.
