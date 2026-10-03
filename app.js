/**
 * ============================================================================
 * RIEGO INTELIGENTE - EL SALVADOR
 * Aplicación de apoyo a la toma de decisiones para pequeños agricultores
 * y huertas escolares salvadoreñas.
 * 
 * Código en JavaScript Vanilla (Sin dependencias ni librerías externas)
 * ============================================================================
 */

// Objeto global de la aplicación
const App = {
  // Configuración y estado
  state: {
    selectedMunicipio: null,
    weatherData: null,
    lastRecommendation: null,
    apiProvider: 'openmeteo', // 'openmeteo' (por defecto sin clave) o 'openweathermap'
    owmApiKey: localStorage.getItem('riego_owm_key') || '',
  },

  // ==========================================================================
  // CATÁLOGO LOCAL DE MUNICIPIOS DE EL SALVADOR
  // Con coordenadas oficiales (Latitud y Longitud)
  // ==========================================================================
  MUNICIPIOS_EL_SALVADOR: [
    // San Salvador
    { id: 'ss_centro', nombre: 'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)', depto: 'San Salvador', lat: 13.6989, lon: -89.1914 },
    { id: 'ss_este', nombre: 'San Salvador Este (Soyapango, Ilopango, San Martín, Tonacatepeque)', depto: 'San Salvador', lat: 13.7102, lon: -89.1399 },
    { id: 'ss_oeste', nombre: 'San Salvador Oeste (Apopa, Nejapa)', depto: 'San Salvador', lat: 13.8073, lon: -89.1792 },
    { id: 'ss_norte', nombre: 'San Salvador Norte (Aguilares, El Paisnal, Guazapa)', depto: 'San Salvador', lat: 13.9572, lon: -89.1895 },
    { id: 'ss_sur', nombre: 'San Salvador Sur (Panchimalco, Rosario de Mora, San Marcos, Santo Tomás, Santiago Texacuangos)', depto: 'San Salvador', lat: 13.6128, lon: -89.1802 },

    // Santa Ana
    { id: 'sa_centro', nombre: 'Santa Ana Centro (Santa Ana)', depto: 'Santa Ana', lat: 13.9942, lon: -89.5597 },
    { id: 'sa_norte', nombre: 'Santa Ana Norte (Metapán, Masahuat, Santa Rosa Guachipilín, Texistepeque)', depto: 'Santa Ana', lat: 14.3333, lon: -89.4444 },
    { id: 'sa_este', nombre: 'Santa Ana Este (Coatepeque, El Congo)', depto: 'Santa Ana', lat: 13.9100, lon: -89.4975 },
    { id: 'sa_oeste', nombre: 'Santa Ana Oeste (Chalchuapa, Candelaria de la Frontera, El Porvenir, San Antonio Pajonal, San Sebastián Salitrillo, Santiago de la Frontera)', depto: 'Santa Ana', lat: 13.9867, lon: -89.6811 },

    // San Miguel
    { id: 'sm_centro', nombre: 'San Miguel Centro (San Miguel, Comacarán, Uluazapa, Moncagua, Quelepa, Chirilagua)', depto: 'San Miguel', lat: 13.4833, lon: -88.1833 },
    { id: 'sm_norte', nombre: 'San Miguel Norte (Ciudad Barrios, Sesori, Nuevo Edén de San Juan, San Gerardo, San Luis de la Reina, Carolina, San Antonio del Mosco, Chapeltique)', depto: 'San Miguel', lat: 13.7667, lon: -88.2667 },
    { id: 'sm_oeste', nombre: 'San Miguel Oeste (Chinameca, Nueva Guadalupe, Lolotique, San Jorge, San Rafael Oriente, El Tránsito)', depto: 'San Miguel', lat: 13.5333, lon: -88.3500 },

    // La Libertad
    { id: 'll_sur', nombre: 'La Libertad Sur (Santa Tecla, Comasagua)', depto: 'La Libertad', lat: 13.6769, lon: -89.2797 },
    { id: 'll_centro', nombre: 'La Libertad Centro (San Juan Opico, Ciudad Arce)', depto: 'La Libertad', lat: 13.7761, lon: -89.3597 },
    { id: 'll_costa', nombre: 'La Libertad Costa (Puerto de La Libertad, Chiltiupán, Jicalapa, Tamanique, Teotepeque)', depto: 'La Libertad', lat: 13.4883, lon: -89.3222 },
    { id: 'll_norte', nombre: 'La Libertad Norte (Quezaltepeque, San Matías, San Pablo Tacachico)', depto: 'La Libertad', lat: 13.8314, lon: -89.2742 },
    { id: 'll_oeste', nombre: 'La Libertad Oeste (Colón, Jayaque, Sacacoyo, Tepecoyo, Talnique)', depto: 'La Libertad', lat: 13.7222, lon: -89.3639 },
    { id: 'll_este', nombre: 'La Libertad Este (Antiguo Cuscatlán, Huizúcar, Nuevo Cuscatlán, San José Villanueva, Zaragoza)', depto: 'La Libertad', lat: 13.6739, lon: -89.2367 },

    // Sonsonate
    { id: 'so_centro', nombre: 'Sonsonate Centro (Sonsonate, Sonzacate, Nahulingo, San Antonio del Monte, Santo Domingo de Guzmán)', depto: 'Sonsonate', lat: 13.7189, lon: -89.7242 },
    { id: 'so_norte', nombre: 'Sonsonate Norte (Juayúa, Nahuizalco, Salcoatitán, Santa Catarina Masahuat)', depto: 'Sonsonate', lat: 13.8417, lon: -89.7469 },
    { id: 'so_este', nombre: 'Sonsonate Este (Izalco, Armenia, Caluco, San Julián, Cuisnahuat, Santa Isabel Ishuatán)', depto: 'Sonsonate', lat: 13.7444, lon: -89.6736 },
    { id: 'so_oeste', nombre: 'Sonsonate Oeste (Acajutla)', depto: 'Sonsonate', lat: 13.5928, lon: -89.8275 },

    // Ahuachapán
    { id: 'ah_centro', nombre: 'Ahuachapán Centro (Ahuachapán, Apaneca, Concepción de Ataco, Tacuba)', depto: 'Ahuachapán', lat: 13.9214, lon: -89.8450 },
    { id: 'ah_norte', nombre: 'Ahuachapán Norte (Atiquizaya, El Refugio, San Lorenzo, Turín)', depto: 'Ahuachapán', lat: 13.9769, lon: -89.8258 },
    { id: 'ah_sur', nombre: 'Ahuachapán Sur (Guaymango, Jujutla, San Francisco Menéndez, San Pedro Puxtla)', depto: 'Ahuachapán', lat: 13.7500, lon: -89.9667 },

    // Usulután
    { id: 'us_este', nombre: 'Usulután Este (Usulután, Jucuarán, San Dionisio, Santa Elena, Santa María, Ereguayquín, Concepción Batres, Ozatlán)', depto: 'Usulután', lat: 13.3500, lon: -88.4500 },
    { id: 'us_oeste', nombre: 'Usulután Oeste (Jiquilisco, Puerto El Triunfo, San Agustín, San Francisco Javier)', depto: 'Usulután', lat: 13.3167, lon: -88.5833 },
    { id: 'us_norte', nombre: 'Usulután Norte (Santiago de María, Alegría, Berlín, Mercedes Umaña, Jucuapa, El Triunfo, Estanzuelas, San Buenaventura, Nueva Granada)', depto: 'Usulután', lat: 13.4833, lon: -88.4667 },

    // La Paz
    { id: 'lp_centro', nombre: 'La Paz Centro (Zacatecoluca, San Luis La Herradura, San Juan Nonualco)', depto: 'La Paz', lat: 13.5000, lon: -88.8667 },
    { id: 'lp_este', nombre: 'La Paz Este (San Juan Talpa, San Luis Talpa, San Pedro Masahuat, Tapalhuaca, Cuyultitán, Olocuilta)', depto: 'La Paz', lat: 13.4833, lon: -89.0833 },
    { id: 'lp_oeste', nombre: 'La Paz Oeste (San Pedro Nonualco, Santa María Ostuma, Santiago Nonualco, San Rafael Obrajuelo, El Rosario, Jerusalén, Mercedes La Ceiba, Paraíso de Osorio, San Antonio Masahuat, San Juan Tepezontes, San Miguel Tepezontes)', depto: 'La Paz', lat: 13.6000, lon: -88.9333 },

    // Chalatenango
    { id: 'ch_centro', nombre: 'Chalatenango Centro (Chalatenango, Arcatao, Azacualpa, Cancasque, Citalá, Comalapa, Concepción Quezaltepeque, Dulce Nombre de María, El Carrizal, El Paraíso, La Laguna, La Palma, La Reina, Las Vueltas, Nombre de Jesús, Nueva Concepción, Nueva Trinidad, Ojos de Agua, Potonico, San Antonio de la Cruz, San Antonio Los Ranchos, San Fernando, San Francisco Lempa, San Francisco Morazán, San Ignacio, San Isidro Labrador, San José Cancasque, San José Las Flores, San Luis del Carmen, San Miguel de Mercedes, San Rafael, Santa Rita, Tejutla)', depto: 'Chalatenango', lat: 14.0333, lon: -88.9333 },

    // Cuscatlán
    { id: 'cu_norte', nombre: 'Cuscatlán Norte (Suchitoto, San José Guayabal, Oratorio de Concepción, San Bartolomé Perulapía, San Pedro Perulapán)', depto: 'Cuscatlán', lat: 13.9389, lon: -89.0278 },
    { id: 'cu_sur', nombre: 'Cuscatlán Sur (Cojutepeque, Candelaria, El Carmen, El Rosario, Monte San Juan, San Cristóbal, San Rafael Cedros, San Ramón, Santa Cruz Analquito, Santa Cruz Michapa, Tenancingo)', depto: 'Cuscatlán', lat: 13.7214, lon: -88.9367 },

    // Cabañas
    { id: 'ca_este', nombre: 'Cabañas Este (Sensuntepeque, Victoria, Dolores, Guacotecti, San Isidro)', depto: 'Cabañas', lat: 13.8789, lon: -88.6319 },
    { id: 'ca_oeste', nombre: 'Cabañas Oeste (Ilobasco, Tejutepeque, Jutiapa, Cinquera)', depto: 'Cabañas', lat: 13.8433, lon: -88.8500 },

    // San Vicente
    { id: 'sv_sur', nombre: 'San Vicente Sur (San Vicente, Guadalupe, Verapaz, Tepetitán, Tecoluca, San Cayetano Istepeque)', depto: 'San Vicente', lat: 13.6444, lon: -88.7844 },
    { id: 'sv_norte', nombre: 'San Vicente Norte (Apastepeque, Santa Clara, San Ildefonso, San Esteban Catarina, San Sebastián, Santo Domingo)', depto: 'San Vicente', lat: 13.7167, lon: -88.7667 },

    // Morazán
    { id: 'mo_sur', nombre: 'Morazán Sur (San Francisco Gotera, Guatajiagua, Yamabal, Sensembra, Chilanga, Delicias de Concepción, El Divisadero, Jocoro, Lolotiquillo, San Carlos, San Isidro, Yoloaiquín, Sociedad)', depto: 'Morazán', lat: 13.6944, lon: -88.1067 },
    { id: 'mo_norte', nombre: 'Morazán Norte (Perquín, Arambala, Cacaopera, Corinto, El Rosario, Joateca, Jocoaitique, Meanguera, Osicala, San Fernando, San Simón, Torola)', depto: 'Morazán', lat: 13.9575, lon: -88.1611 },

    // La Unión
    { id: 'lu_sur', nombre: 'La Unión Sur (La Unión, Conchagua, El Carmen, Intipucá, Meanguera del Golfo, San Alejo, Yayantique, Yucuaiquín)', depto: 'La Unión', lat: 13.3369, lon: -87.8439 },
    { id: 'lu_norte', nombre: 'La Unión Norte (Santa Rosa de Lima, Anamorós, Bolívar, Concepción de Oriente, El Sauce, Lislique, Nueva Esparta, Pasaquina, Polorós, San José)', depto: 'La Unión', lat: 13.6247, lon: -87.8936 }
  ],

  // ==========================================================================
  // PUNTO CRÍTICO DE ERROR 1: Validación geográfica de El Salvador
  // Evita enviar coordenadas fuera de la República de El Salvador o datos corruptos
  // Límites geográficos: Latitud [13.15, 14.45], Longitud [-90.15, -87.68]
  // ==========================================================================
  validarUbicacionElSalvador: function(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return { valido: false, error: 'Las coordenadas no son números válidos.' };
    }

    const MIN_LAT = 13.10;
    const MAX_LAT = 14.50;
    const MIN_LON = -90.25;
    const MAX_LON = -87.60;

    const dentroDeLimites = (lat >= MIN_LAT && lat <= MAX_LAT && lon >= MIN_LON && lon <= MAX_LON);
    if (!dentroDeLimites) {
      return {
        valido: false,
        error: `Las coordenadas (${lat.toFixed(4)}, ${lon.toFixed(4)}) se encuentran fuera del territorio nacional de El Salvador.`
      };
    }

    return { valido: true };
  },

  // ==========================================================================
  // Inicialización de la aplicación
  // ==========================================================================
  init: function() {
    this.poblarSelectorMunicipios();
    this.vincularEventos();
    this.cargarHistorial();
    this.actualizarEstadoUIConfig();

    // Seleccionar automáticamente el primer municipio para facilidad del agricultor
    const select = document.getElementById('select-municipio');
    if (select && select.options.length > 1) {
      select.selectedIndex = 1;
      this.onMunicipioChange();
    }
  },

  // Poblar el elemento <select> agrupando por departamentos
  poblarSelectorMunicipios: function() {
    const select = document.getElementById('select-municipio');
    if (!select) return;

    select.innerHTML = '<option value="">-- Seleccione su municipio o zona --</option>';

    // Agrupar por departamento
    const porDepto = {};
    this.MUNICIPIOS_EL_SALVADOR.forEach(m => {
      if (!porDepto[m.depto]) {
        porDepto[m.depto] = [];
      }
      porDepto[m.depto].push(m);
    });

    // Crear optgroups para máxima facilidad de búsqueda en celular
    Object.keys(porDepto).sort().forEach(depto => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = `Departamento: ${depto}`;

      porDepto[depto].forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.nombre;
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });
  },

  // Vincular eventos del DOM
  vincularEventos: function() {
    // Cambio en selector de municipio
    const select = document.getElementById('select-municipio');
    if (select) {
      select.addEventListener('change', () => this.onMunicipioChange());
    }

    // Botón principal de consultar
    const btnConsultar = document.getElementById('btn-consultar');
    if (btnConsultar) {
      btnConsultar.addEventListener('click', () => this.consultarPronostico());
    }

    // Toggle de configuración de API
    const toggleConfig = document.getElementById('toggle-config');
    const panelConfig = document.getElementById('api-config-panel');
    if (toggleConfig && panelConfig) {
      toggleConfig.addEventListener('click', () => {
        panelConfig.classList.toggle('open');
      });
    }

    // Cambio de proveedor de API (Open-Meteo vs OpenWeatherMap)
    const selectProvider = document.getElementById('select-provider');
    if (selectProvider) {
      selectProvider.addEventListener('change', (e) => {
        this.state.apiProvider = e.target.value;
        this.actualizarEstadoUIConfig();
      });
    }

    // Guardado de API key de OpenWeatherMap
    const btnSaveKey = document.getElementById('btn-guardar-key');
    const inputKey = document.getElementById('input-owm-key');
    if (btnSaveKey && inputKey) {
      btnSaveKey.addEventListener('click', () => {
        const key = inputKey.value.trim();
        this.state.owmApiKey = key;
        try {
          localStorage.setItem('riego_owm_key', key);
          this.mostrarMensaje('Clave de OpenWeatherMap guardada localmente.', 'info');
        } catch (e) {
          console.warn('No se pudo guardar la clave en localStorage', e);
        }
      });
    }

    // Botones de acción del historial rápido
    const btnLogNo = document.getElementById('btn-log-no');
    const btnLogSi = document.getElementById('btn-log-si');
    if (btnLogNo) {
      btnLogNo.addEventListener('click', () => this.guardarDecision('NO regué (seguí el pronóstico)'));
    }
    if (btnLogSi) {
      btnLogSi.addEventListener('click', () => this.guardarDecision('SÍ regué'));
    }

    // Botón limpiar historial
    const btnLimpiarHistorial = document.getElementById('btn-limpiar-historial');
    if (btnLimpiarHistorial) {
      btnLimpiarHistorial.addEventListener('click', () => this.limpiarHistorial());
    }
  },

  onMunicipioChange: function() {
    const select = document.getElementById('select-municipio');
    const id = select.value;
    const municipio = this.MUNICIPIOS_EL_SALVADOR.find(m => m.id === id);
    this.state.selectedMunicipio = municipio || null;

    // Actualizar indicador de coordenadas
    const coordsEl = document.getElementById('municipio-coords');
    if (coordsEl) {
      if (municipio) {
        coordsEl.textContent = `📍 Coordenadas: ${municipio.lat.toFixed(4)} N, ${municipio.lon.toFixed(4)} W (${municipio.depto})`;
      } else {
        coordsEl.textContent = '';
      }
    }
  },

  actualizarEstadoUIConfig: function() {
    const selectProvider = document.getElementById('select-provider');
    const containerKey = document.getElementById('container-owm-key');
    const inputKey = document.getElementById('input-owm-key');

    if (selectProvider) {
      selectProvider.value = this.state.apiProvider;
    }
    if (inputKey && this.state.owmApiKey) {
      inputKey.value = this.state.owmApiKey;
    }
    if (containerKey) {
      containerKey.style.display = (this.state.apiProvider === 'openweathermap') ? 'block' : 'none';
    }
  },

  // ==========================================================================
  // FUNCIÓN PRINCIPAL: CONSULTAR PRONÓSTICO
  // ==========================================================================
  consultarPronostico: async function() {
    if (!this.state.selectedMunicipio) {
      this.mostrarMensaje('Por favor, selecciona un municipio de El Salvador primero.', 'warning');
      return;
    }

    const { lat, lon, nombre } = this.state.selectedMunicipio;

    // Validación geográfica estricta
    const validacion = this.validarUbicacionElSalvador(lat, lon);
    if (!validacion.valido) {
      this.mostrarMensaje(validacion.error, 'danger');
      return;
    }

    this.mostrarCargando(true);
    this.ocultarMensaje();

    try {
      let datosClima = null;

      if (this.state.apiProvider === 'openweathermap') {
        // Consultar OpenWeatherMap
        datosClima = await this.fetchOpenWeatherMap(lat, lon, nombre);
      } else {
        // Consultar Open-Meteo (pública, sin clave)
        datosClima = await this.fetchOpenMeteo(lat, lon, nombre);
      }

      this.state.weatherData = datosClima;
      this.procesarRecomendacionRiego(datosClima);

    } catch (error) {
      // Manejo de errores amigable y constructivo
      console.error('Error al consultar pronóstico:', error);

      // Si falló OpenWeatherMap por falta de clave o 401, ofrecer fallback inmediato
      if (this.state.apiProvider === 'openweathermap') {
        this.mostrarMensaje(
          `Error en OpenWeatherMap: ${error.message}. ¿Deseas consultar con la API pública de Open-Meteo sin clave?`,
          'danger'
        );
        this.crearBotonFallbackOpenMeteo();
      } else {
        this.mostrarMensaje(
          `No se pudo obtener el pronóstico del clima: ${error.message}. Verifica tu conexión a internet e intenta nuevamente.`,
          'danger'
        );
      }
    } finally {
      this.mostrarCargando(false);
    }
  },

  // ==========================================================================
  // PUNTO CRÍTICO DE ERROR 2: Consulta y manejo de OpenWeatherMap
  // Errores frecuentes:
  // - Falta de API key o key inválida (HTTP 401)
  // - Límite de peticiones excedido (HTTP 429)
  // - Formato de datos no esperado o fallos de red
  // ==========================================================================
  fetchOpenWeatherMap: async function(lat, lon, nombre) {
    const key = this.state.owmApiKey.trim();

    if (!key) {
      throw new Error('No has ingresado una API Key de OpenWeatherMap. Puedes colocarla en "Configuración de Proveedor de Clima" o usar Open-Meteo.');
    }

    // Usamos el endpoint 5 Day / 3 Hour Forecast para obtener lluvia horaria
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${encodeURIComponent(key)}`;

    let response;
    try {
      response = await fetch(url);
    } catch (netError) {
      throw new Error('Fallo de conexión al contactar a OpenWeatherMap. Comprueba tu conexión.');
    }

    /* PUNTO CRÍTICO DE ERROR 3: Validación del estado HTTP antes de procesar JSON */
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Clave de API de OpenWeatherMap inválida o no activada aún (puede tardar un par de horas tras registrarse).');
      } else if (response.status === 429) {
        throw new Error('Límite de peticiones gratuitas alcanzado en OpenWeatherMap.');
      } else {
        throw new Error(`Error en el servidor de OpenWeatherMap (Código ${response.status}).`);
      }
    }

    const json = await response.json();
    if (!json || !json.list || !Array.isArray(json.list)) {
      throw new Error('La respuesta de OpenWeatherMap no contiene el formato esperado.');
    }

    return this.normalizarDatosOpenWeatherMap(json, nombre);
  },

  // Normalización de respuesta OpenWeatherMap a un formato común
  normalizarDatosOpenWeatherMap: function(json, nombre) {
    const list = json.list;
    // Tomamos las próximas 8 lecturas de 3h (próximas 24 horas)
    const proximasLecturas = list.slice(0, 8);

    let maxProbabilidadLluvia = 0;
    let lluviaAcumuladaMm = 0;
    let probLluviaTarde = 0;
    let lluviaMmTarde = 0;

    proximasLecturas.forEach(item => {
      // pop = probability of precipitation (0 a 1)
      const popPercent = Math.round((item.pop || 0) * 100);
      if (popPercent > maxProbabilidadLluvia) {
        maxProbabilidadLluvia = popPercent;
      }

      // Lluvia en mm en el bloque de 3h
      const rainVol = (item.rain && item.rain['3h']) ? item.rain['3h'] : 0;
      lluviaAcumuladaMm += rainVol;

      // Evaluar si cae en la tarde (12:00 a 18:00 hora de El Salvador)
      // dt_txt tiene formato: "YYYY-MM-DD HH:mm:ss" UTC
      const fecha = new Date(item.dt * 1000);
      const horaLocal = fecha.getHours(); // en zona horaria local

      if (horaLocal >= 12 && horaLocal <= 18) {
        if (popPercent > probLluviaTarde) probLluviaTarde = popPercent;
        lluviaMmTarde += rainVol;
      }
    });

    const primeraLectura = list[0] || {};
    const tempActual = primeraLectura.main ? primeraLectura.main.temp : 25;
    const humedad = primeraLectura.main ? primeraLectura.main.humidity : 60;
    const condicion = (primeraLectura.weather && primeraLectura.weather[0]) ? primeraLectura.weather[0].description : 'Parcialmente nublado';

    return {
      fuente: 'OpenWeatherMap',
      municipio: nombre,
      tempActual: Math.round(tempActual),
      humedad: humedad,
      condicion: condicion.charAt(0).toUpperCase() + condicion.slice(1),
      probLluviaMax: Math.max(maxProbabilidadLluvia, probLluviaTarde),
      probLluviaTarde: probLluviaTarde || maxProbabilidadLluvia,
      lluviaMmAcumulada: parseFloat(lluviaAcumuladaMm.toFixed(1)),
      lluviaMmTarde: parseFloat(lluviaMmTarde.toFixed(1)),
    };
  },

  // ==========================================================================
  // CONSULTA A OPEN-METEO (API Pública gratuita, sin necesidad de clave)
  // Utiliza el modelo meteorológico de alta resolución para Centroamérica
  // ==========================================================================
  fetchOpenMeteo: async function(lat, lon, nombre) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=precipitation_probability,precipitation&daily=precipitation_probability_max,precipitation_sum,temperature_2m_max&timezone=America%2FEl_Salvador&forecast_days=2`;

    let response;
    try {
      response = await fetch(url);
    } catch (e) {
      throw new Error('Fallo de red al conectar con Open-Meteo.');
    }

    if (!response.ok) {
      throw new Error(`Open-Meteo devolvió un estado HTTP ${response.status}.`);
    }

    const data = await response.json();
    return this.normalizarDatosOpenMeteo(data, nombre);
  },

  // Normalización de respuesta Open-Meteo
  normalizarDatosOpenMeteo: function(data, nombre) {
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    // Obtener la hora actual de El Salvador
    const ahora = new Date();
    const horaActual = ahora.getHours();

    // Extraer horas de la tarde de hoy (de 12:00 a 18:00)
    let probTardeMax = 0;
    let lluviaTardeSum = 0;
    let prob24hMax = 0;
    let lluvia24hSum = 0;

    if (hourly.time && hourly.precipitation_probability) {
      for (let i = 0; i < Math.min(hourly.time.length, 24); i++) {
        const timeStr = hourly.time[i]; // formato "YYYY-MM-DDTHH:00"
        const hora = parseInt(timeStr.substring(11, 13), 10);
        const prob = hourly.precipitation_probability[i] || 0;
        const mm = (hourly.precipitation && hourly.precipitation[i]) ? hourly.precipitation[i] : 0;

        if (prob > prob24hMax) prob24hMax = prob;
        lluvia24hSum += mm;

        if (hora >= 12 && hora <= 18) {
          if (prob > probTardeMax) probTardeMax = prob;
          lluviaTardeSum += mm;
        }
      }
    }

    const dailyProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || prob24hMax;
    const dailySum = (daily.precipitation_sum && daily.precipitation_sum[0]) || lluvia24hSum;

    return {
      fuente: 'Open-Meteo',
      municipio: nombre,
      tempActual: Math.round(current.temperature_2m ?? 26),
      humedad: Math.round(current.relative_humidity_2m ?? 65),
      condicion: this.interpretarCodigoClimaWMO(current.weather_code),
      probLluviaMax: dailyProb,
      probLluviaTarde: probTardeMax || dailyProb,
      lluviaMmAcumulada: parseFloat(dailySum.toFixed(1)),
      lluviaMmTarde: parseFloat(lluviaTardeSum.toFixed(1))
    };
  },

  // Traductor de códigos meteorológicos WMO
  interpretarCodigoClimaWMO: function(code) {
    if (code === 0) return 'Cielo despejado';
    if (code === 1) return 'Principalmente despejado';
    if (code === 2) return 'Parcialmente nublado';
    if (code === 3) return 'Nublado';
    if (code >= 51 && code <= 55) return 'Llovizna ligera';
    if (code >= 61 && code <= 65) return 'Lluvia constante';
    if (code >= 80 && code <= 82) return 'Chubascos aislados';
    if (code >= 95) return 'Tormenta eléctrica';
    return 'Cielo variable';
  },

  // ==========================================================================
  // PUNTO CRÍTICO DE ERROR 5: MOTOR DE RECOMENDACIÓN AGRÍCOLA
  // Resuelve el problema: "Se riega el cultivo aunque vaya a llover en la tarde"
  // Reglas agronómicas para huerta pequeña / cultivo escolar:
  // - Si hay >= 40% de lluvia en la tarde o acumulación >= 2.0 mm: NO REGAR.
  //   Motivo: Evita lavado de fertilizantes/compost, asfixia radicular y hongos (Phytophthora/tizón).
  // - Si probabilidad es 20-39%: ESPERAR / RIEGO MODERADO.
  // - Si probabilidad < 20%: SÍ REGAR (preferiblemente mañana o tarde fresca).
  // ==========================================================================
  procesarRecomendacionRiego: function(clima) {
    const probTarde = clima.probLluviaTarde;
    const lluviaTardeMm = clima.lluviaMmTarde;
    const probMax = clima.probLluviaMax;
    const lluviaTotal = clima.lluviaMmAcumulada;

    let veredicto = 'NO';
    let claseCss = 'no-regar';
    let tituloVeredicto = '🛑 NO REGAR';
    let resumen = '';
    let motivo = '';

    if (probTarde >= 40 || lluviaTardeMm >= 1.5 || probMax >= 55 || lluviaTotal >= 3.0) {
      // CASO: VA A LLOVER EN LA TARDE / NOCHE
      veredicto = 'NO';
      claseCss = 'no-regar';
      tituloVeredicto = '🛑 NO REGAR';
      resumen = 'Se pronostican lluvias significativas para esta tarde o noche.';
      motivo = `El pronóstico indica un ${probTarde}% de probabilidad de lluvia en horas de la tarde con una acumulación estimada de ${lluviaTotal} mm. Regar la huerta ahora provocaría encharcamiento del suelo, desperdicio innecesario de agua y riesgo de asfixia en las raíces o proliferación de hongos en el cultivo. La lluvia natural se encargará del riego.`;
    } else if (probTarde >= 25 || probMax >= 35) {
      // CASO DUDOSO: PROBABILIDAD MODERADA
      veredicto = 'ESPERAR';
      claseCss = 'esperar';
      tituloVeredicto = '⚠️ ESPERAR / RIEGO MÍNIMO';
      resumen = 'Probabilidad moderada de chubascos o lluvia dispersa.';
      motivo = `Existe una probabilidad de lluvia moderada (${probTarde}%) y nubosidad en la tarde. Si la tierra aún conserva humedad al tacto (a 3 cm de profundidad), NO riegues y espera a que caiga la tarde. Si el suelo está completamente seco y arenoso, aplica únicamente un riego ligero cerca del tallo.`;
    } else {
      // CASO SECO: NO VA A LLOVER
      veredicto = 'SÍ';
      claseCss = 'si-regar';
      tituloVeredicto = '💧 SÍ REGAR';
      resumen = 'Condiciones secas. No se espera lluvia para hoy en la tarde.';
      motivo = `La probabilidad de lluvia en la tarde es muy baja (${probTarde}%, con menos de 1 mm esperado) y la temperatura alcanzará los ${clima.tempActual}°C. Las hortalizas y cultivos necesitan hidratación. Se recomienda regar temprano en la mañana (antes de las 8:00 AM) o al caer el sol para evitar pérdidas por evaporación.`;
    }

    this.state.lastRecommendation = {
      municipio: clima.municipio,
      veredicto: veredicto,
      probLluvia: probTarde,
      lluviaMm: lluviaTotal,
      temp: clima.tempActual,
      motivo: motivo,
      fecha: new Date().toISOString()
    };

    // Renderizar resultados en pantalla
    this.renderizarRecomendacion(tituloVeredicto, resumen, motivo, claseCss, clima);
  },

  renderizarRecomendacion: function(titulo, resumen, motivo, claseCss, clima) {
    const cardEl = document.getElementById('card-recomendacion');
    if (!cardEl) return;

    cardEl.style.display = 'block';

    const bannerEl = document.getElementById('recommendation-banner');
    if (bannerEl) {
      bannerEl.className = `recommendation-banner ${claseCss}`;
      bannerEl.innerHTML = `
        <div class="rec-verdict">${titulo}</div>
        <div class="rec-summary">${resumen}</div>
      `;
    }

    const motivoEl = document.getElementById('rec-motivo-text');
    if (motivoEl) {
      motivoEl.textContent = motivo;
    }

    // Métricas del clima
    const valProb = document.getElementById('val-prob-lluvia');
    const valLluvia = document.getElementById('val-lluvia-mm');
    const valTemp = document.getElementById('val-temperatura');
    const valHumedad = document.getElementById('val-humedad');
    const valFuente = document.getElementById('val-fuente-api');

    if (valProb) valProb.textContent = `${clima.probLluviaTarde}%`;
    if (valLluvia) valLluvia.textContent = `${clima.lluviaMmAcumulada} mm`;
    if (valTemp) valTemp.textContent = `${clima.tempActual}°C (${clima.condicion})`;
    if (valHumedad) valHumedad.textContent = `${clima.humedad}%`;
    if (valFuente) valFuente.textContent = clima.fuente;

    // Desplazar suavemente a la tarjeta de recomendación en móviles
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // ==========================================================================
  // PUNTO CRÍTICO DE ERROR 4: PERSISTENCIA Y HISTORIAL CON LOCALSTORAGE
  // Errores frecuentes:
  // - Bloqueo de cookies/almacenamiento en modo incógnito
  // - QuotaExceededError si se guardan demasiados registros
  // - Corrupción de JSON al deserializar
  // ==========================================================================
  guardarDecision: function(accionRealizada) {
    if (!this.state.lastRecommendation) {
      this.mostrarMensaje('Primero consulta el pronóstico de un municipio antes de registrar la decisión.', 'warning');
      return;
    }

    const nuevaEntrada = {
      id: 'reg_' + Date.now(),
      fecha: new Date().toLocaleString('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      municipio: this.state.lastRecommendation.municipio,
      veredicto: this.state.lastRecommendation.veredicto,
      probLluvia: this.state.lastRecommendation.probLluvia,
      temp: this.state.lastRecommendation.temp,
      accion: accionRealizada
    };

    let historial = this.obtenerHistorialStorage();
    historial.unshift(nuevaEntrada);

    // Limitar historial a los últimos 30 registros para no sobrecargar el almacenamiento
    if (historial.length > 30) {
      historial = historial.slice(0, 30);
    }

    try {
      localStorage.setItem('riego_historial_sv', JSON.stringify(historial));
      this.renderizarHistorial(historial);
      this.mostrarMensaje('✅ Decisión registrada en el historial con éxito.', 'info');
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
      this.mostrarMensaje('No se pudo guardar la decisión en el almacenamiento local.', 'warning');
    }
  },

  obtenerHistorialStorage: function() {
    try {
      const data = localStorage.getItem('riego_historial_sv');
      if (!data) return [];
      const parseado = JSON.parse(data);
      return Array.isArray(parseado) ? parseado : [];
    } catch (e) {
      console.error('Error al leer historial de localStorage:', e);
      return [];
    }
  },

  cargarHistorial: function() {
    const historial = this.obtenerHistorialStorage();
    this.renderizarHistorial(historial);
  },

  limpiarHistorial: function() {
    if (!confirm('¿Estás seguro de que deseas vaciar todo el historial de decisiones de riego?')) {
      return;
    }
    try {
      localStorage.removeItem('riego_historial_sv');
      this.renderizarHistorial([]);
      this.mostrarMensaje('Historial de decisiones vaciado.', 'info');
    } catch (e) {
      console.error('Error al limpiar localStorage:', e);
    }
  },

  eliminarRegistroHistorial: function(id) {
    let historial = this.obtenerHistorialStorage();
    historial = historial.filter(item => item.id !== id);
    try {
      localStorage.setItem('riego_historial_sv', JSON.stringify(historial));
      this.renderizarHistorial(historial);
    } catch (e) {
      console.error('Error al actualizar historial:', e);
    }
  },

  renderizarHistorial: function(historial) {
    const contenedor = document.getElementById('history-container');
    const badgeCount = document.getElementById('history-count');
    if (!contenedor) return;

    if (badgeCount) {
      badgeCount.textContent = historial.length;
    }

    if (historial.length === 0) {
      contenedor.innerHTML = `
        <div class="history-empty">
          <p>🌱 Aún no has registrado ninguna decisión de riego.</p>
          <p style="margin-top:4px; font-size:0.75rem;">Cuando consultes el clima, presiona "Registrar decisión" para llevar un control del agua en tu cultivo.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="history-list">';
    historial.forEach(item => {
      const claseBadge = item.veredicto === 'NO' ? 'no' : 'si';
      const textoVeredicto = item.veredicto === 'NO' ? 'Recomendación: NO REGAR' : (item.veredicto === 'SÍ' ? 'Recomendación: SÍ REGAR' : 'Recomendación: ESPERAR');

      html += `
        <div class="history-item">
          <div class="history-item-top">
            <span class="history-place">${this.escaparHtml(item.municipio)}</span>
            <span class="history-badge ${claseBadge}">${textoVeredicto}</span>
          </div>
          <div class="history-meta">
            <span>📅 ${this.escaparHtml(item.fecha)}</span>
            <span>🌧️ Prob. lluvia: ${item.probLluvia}%</span>
            <span>🌡️ ${item.temp}°C</span>
          </div>
          <div class="history-action-taken">
            Acción tomada: ${this.escaparHtml(item.accion)}
          </div>
          <div class="history-item-actions">
            <button class="btn btn-sm btn-danger-outline" onclick="App.eliminarRegistroHistorial('${item.id}')" title="Eliminar este registro">
              🗑️ Borrar
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    contenedor.innerHTML = html;
  },

  // ==========================================================================
  // HELPERS DE UI Y SEGURIDAD
  // ==========================================================================
  escaparHtml: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  mostrarMensaje: function(texto, tipo = 'info') {
    const contenedor = document.getElementById('alert-container');
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="alert alert-${tipo}">
        <span>${this.escaparHtml(texto)}</span>
      </div>
    `;
    contenedor.style.display = 'block';
  },

  ocultarMensaje: function() {
    const contenedor = document.getElementById('alert-container');
    if (contenedor) {
      contenedor.innerHTML = '';
      contenedor.style.display = 'none';
    }
  },

  mostrarCargando: function(mostrar) {
    const loader = document.getElementById('loader-wrapper');
    const btn = document.getElementById('btn-consultar');
    if (loader) {
      if (mostrar) {
        loader.classList.add('active');
      } else {
        loader.classList.remove('active');
      }
    }
    if (btn) {
      btn.disabled = mostrar;
      btn.textContent = mostrar ? '⏳ Consultando pronóstico...' : '🔍 Consultar Pronóstico y Decidir Riego';
    }
  },

  crearBotonFallbackOpenMeteo: function() {
    const contenedor = document.getElementById('alert-container');
    if (!contenedor) return;

    const btnFallback = document.createElement('button');
    btnFallback.className = 'btn btn-secondary btn-sm';
    btnFallback.style.marginTop = '8px';
    btnFallback.textContent = '🔄 Usar Open-Meteo ahora (Pública y sin clave)';
    btnFallback.onclick = () => {
      this.state.apiProvider = 'openmeteo';
      this.actualizarEstadoUIConfig();
      this.consultarPronostico();
    };

    const alertBox = contenedor.querySelector('.alert');
    if (alertBox) {
      alertBox.appendChild(btnFallback);
    }
  }
};

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Exportar en window para callbacks de botones en HTML
window.App = App;
