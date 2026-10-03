import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ==========================================================================
  // ENDPOINT M5: EVALUACIÓN AGRONÓMICA CON GEMINI 2.5 FLASH Y RESPONSE SCHEMA
  // ==========================================================================
  app.post('/api/evaluar-riego', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        error: 'NO_API_KEY',
        message: 'No hay GEMINI_API_KEY configurada en el servidor. Activando contingencia M1.'
      });
    }

    const { municipio, temperatura, precipitacionMm, probLluvia, humedad, condicion } = req.body || {};

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Actúa como un ingeniero agrónomo especialista en cultivos y huertas escolares/familiares en El Salvador.
Analiza las condiciones meteorológicas del municipio de ${municipio || 'El Salvador'}:
- Temperatura actual: ${temperatura}°C
- Precipitación estimada hoy: ${precipitacionMm} mm
- Probabilidad de lluvia hoy: ${probLluvia}%
- Humedad relativa: ${humedad}%
- Condición reportada: ${condicion || 'Cielo variable'}

Determina estrictamente si se debe REGAR o NO REGAR hoy.
Regla agronómica clave: si la probabilidad de lluvia supera el 50% o la precipitación prevista es superior a 2 mm, la huerta recibirá agua pluvial suficiente, por lo que NO se debe regar (regar = false) para evitar pudrición radicular, desperdicio de agua y lixiviación de abonos. En caso contrario, o si las condiciones son calurosas y secas, se debe regar (regar = true).
Proporciona una justificación técnica agronómica y una recomendación adicional práctica para el agricultor salvadoreño.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              regar: {
                type: Type.BOOLEAN,
                description: 'true si se aconseja regar hoy, false si se aconseja NO regar.'
              },
              justificacion: {
                type: Type.STRING,
                description: 'Justificación técnica agronómica detallada de la decisión.'
              },
              recomendacion_adicional: {
                type: Type.STRING,
                description: 'Consejo práctico adicional para el agricultor o docente de huerta escolar.'
              }
            },
            required: ['regar', 'justificacion', 'recomendacion_adicional']
          }
        }
      });

      const rawText = response.text?.trim() || '{}';
      let datosParsed;
      try {
        datosParsed = JSON.parse(rawText);
      } catch (pe) {
        throw new Error('La respuesta de Gemini no es un JSON válido');
      }

      if (typeof datosParsed.regar !== 'boolean' || typeof datosParsed.justificacion !== 'string' || typeof datosParsed.recomendacion_adicional !== 'string') {
        throw new Error('La respuesta de Gemini no cumple con el esquema requerido.');
      }

      return res.json({
        success: true,
        fuente: 'Google Gemini (gemini-2.5-flash)',
        datos: {
          regar: datosParsed.regar,
          justificacion: datosParsed.justificacion,
          recomendacion_adicional: datosParsed.recomendacion_adicional
        }
      });

    } catch (err: any) {
      console.warn('Fallo al evaluar con Gemini en el servidor:', err.message);
      return res.status(200).json({
        fallback: true,
        error: 'GEMINI_CALL_FAILED',
        message: err.message || 'Error al contactar con Gemini. Activando contingencia M1.'
      });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Riego Inteligente activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
