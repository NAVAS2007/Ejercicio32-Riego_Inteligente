# Riego Inteligente El Salvador 

> Asesora a pequeños agricultores y huertas escolares salvadoreñas sobre si deben regar o no su cultivo hoy, evitando el desperdicio de agua y la asfixia radicular cuando va a llover por la tarde.


## 1. Probala ahora
- **App publicada:** [https://ais-pre-es5acdch42lmigmrhnuehh-510382175946.us-east1.run.app](https://ais-pre-es5acdch42lmigmrhnuehh-510382175946.us-east1.run.app)
- **Usuario de prueba:** No requiere registro ni contraseña (acceso libre e inmediato desde cualquier celular).



## 2. Capturas
| Inicio y Selección | Pronóstico y Evaluación | Asesoría IA en Acción |
|:---:|:---:|:---:|
| ![Pantalla de inicio en celular](evidencias/.png) | ![Evaluación del clima y decisión](evidencias/.png) | ![Recomendación de Gemini con JSON Schema](evidencias.png) 


## 3. Qué hace
- **Consulta meteorológica en tiempo real:** Obtiene temperatura, precipitación acumulada estimada (mm), probabilidad máxima de lluvia (%) y humedad relativa para cualquiera de los municipios en los 14 departamentos de El Salvador usando la API pública de Open-Meteo (con soporte opcional de OpenWeatherMap).
- **Decisión agronómica con IA estructurada (Google Gemini):** Un modelo de lenguaje (`gemini-2.5-flash` / `gemini-3.8-flash`) actúa como agrónomo experto analizando las variables atmosféricas y retornando estrictamente un JSON Schema con el veredicto (**REGAR** o **NO REGAR**), la justificación técnica del cultivo y un consejo práctico adicional.
- **Modo de contingencia (Fallback) resiliente:** Si se pierde la conexión a internet, hay saturación o no se dispone de clave de IA, la app nunca se congela ni muestra pantallas en blanco: ejecuta automáticamente la regla técnica local M1 (si probabilidad de lluvia > 50% o precipitación > 2 mm ➔ NO REGAR).
- **Historial local persistente:** Guarda un registro permanente en el teléfono (`localStorage`) con fecha, hora, municipio, clima medido, decisión tomada y el consejo agronómico, permitiendo consultar decisiones previas o vaciar el registro cuando se desee.
- **Diseño Mobile-First para luz solar directa:** Interfaz de alto contraste, tipografía nítida y botones táctiles con altura mínima de 52 px pensados para su uso con una sola mano en el campo o huerto escolar.



## 4. Cómo correrlo en tu máquina

```bash
# 1. Clonar el repositorio
git clone https://github.com/usuario/riego-inteligente-sv.git
cd riego-inteligente-sv

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional para IA del servidor)
cp .env.example .env
# Editar .env y colocar tu GEMINI_API_KEY (si deseas utilizar la IA de Google Gemini)

# 4. Iniciar en modo desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:3000
