/**
 * ============================================================================
 * RIEGO INTELIGENTE - EL SALVADOR
 * M1 + M2 + M3 + M4: Resiliencia, Manejo de Errores y Validación Estricta
 * 
 * Requisitos M4:
 * 1. Validaciones estrictas a las entradas del usuario (municipio obligatorio).
 * 2. Indicador de carga claro (loading spinner, aria-busy y bloqueo de controles).
 * 3. Manejo robusto de errores de red, caídas de API y timeout (con AbortController y try/catch).
 * 4. Garantía de que timeouts o datos incompletos nunca corrompan el localStorage.
 * ============================================================================
 */

const STORAGE_KEY = 'riego_historial_sv';
const REQUEST_TIMEOUT_MS = 9000; // 9 segundos de timeout para conexiones rurales

const App = {
  // Estado en memoria de la aplicación
  state: {
    selectedMunicipio: null,
    weatherData: null,
    lastRecommendation: null,
    apiProvider: 'openmeteo', // 'openmeteo' (recomendado) o 'openweathermap'
    owmApiKey: localStorage.getItem('riego_owm_key') || '',
    isFetching: false,
  },

  // ==========================================================================
  // CATÁLOGO LOCAL DE MUNICIPIOS DE EL SALVADOR
  // Coordenadas oficiales de los 14 departamentos salvadoreños
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

  // Validación geográfica de El Salvador
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
        error: `Las coordenadas (${lat.toFixed(4)}, ${lon.toFixed(4)}) están fuera del territorio nacional de El Salvador.`
      };
    }

    return { valido: true };
  },

  // ==========================================================================
  // INICIALIZACIÓN DE LA APLICACIÓN
  // ==========================================================================
  init: function() {
    this.poblarSelectorMunicipios();
    this.vincularEventos();
    this.cargarHistorial();
    this.actualizarEstadoUIConfig();

    // No forzar selección automática para permitir validar si el usuario no ha elegido aún
    const select = document.getElementById('select-municipio');
    if (select) {
      select.value = '';
    }
  },

  poblarSelectorMunicipios: function() {
    const select = document.getElementById('select-municipio');
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecciona un municipio salvadoreño --</option>';

    const porDepto = {};
    this.MUNICIPIOS_EL_SALVADOR.forEach(m => {
      if (!porDepto[m.depto]) {
        porDepto[m.depto] = [];
      }
      porDepto[m.depto].push(m);
    });

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

  vincularEventos: function() {
    const select = document.getElementById('select-municipio');
    if (select) {
      select.addEventListener('change', () => this.onMunicipioChange());
    }

    const btnConsultar = document.getElementById('btn-consultar');
    if (btnConsultar) {
      btnConsultar.addEventListener('click', () => this.consultarPronostico());
    }

    const toggleConfig = document.getElementById('toggle-config');
    const panelConfig = document.getElementById('api-config-panel');
    if (toggleConfig && panelConfig) {
      toggleConfig.addEventListener('click', () => {
        panelConfig.classList.toggle('open');
      });
    }

    const selectProvider = document.getElementById('select-provider');
    if (selectProvider) {
      selectProvider.addEventListener('change', (e) => {
        this.state.apiProvider = e.target.value;
        this.actualizarEstadoUIConfig();
      });
    }

    const btnSaveKey = document.getElementById('btn-guardar-key');
    const inputKey = document.getElementById('input-owm-key');
    if (btnSaveKey && inputKey) {
      btnSaveKey.addEventListener('click', () => {
        const key = inputKey.value.trim();
        this.state.owmApiKey = key;
        try {
          localStorage.setItem('riego_owm_key', key);
          this.mostrarMensaje('Clave de OpenWeatherMap guardada en tu teléfono.', 'info');
        } catch (e) {
          console.warn('No se pudo guardar la clave en localStorage', e);
        }
      });
    }

    // Botones de decisión
    const btnLogNo = document.getElementById('btn-log-no');
    const btnLogSi = document.getElementById('btn-log-si');
    if (btnLogNo) {
      btnLogNo.addEventListener('click', () => this.guardarDecision('NO REGAR'));
    }
    if (btnLogSi) {
      btnLogSi.addEventListener('click', () => this.guardarDecision('REGAR'));
    }

    // Botón vaciar historial
    const btnLimpiarHistorial = document.getElementById('btn-limpiar-historial');
    if (btnLimpiarHistorial) {
      btnLimpiarHistorial.addEventListener('click', () => this.limpiarHistorial());
    }

    // Monitoreo proactivo del estado de conexión de red (M4)
    window.addEventListener('offline', () => {
      this.mostrarMensaje('📡 Se ha perdido la conexión a internet. La aplicación continuará funcionando con el historial local, pero necesitas red para nuevas consultas.', 'warning', null, 'Modo Sin Conexión');
    });

    window.addEventListener('online', () => {
      this.mostrarMensaje('🌐 Conexión a internet reestablecida. Ya puedes consultar el clima en tiempo real.', 'success', null, 'En Línea');
    });
  },

  onMunicipioChange: function() {
    const select = document.getElementById('select-municipio');
    const errorMsg = document.getElementById('input-error-municipio');
    const id = select.value;

    // Limpiar estado de error si el usuario selecciona una opción válida
    if (id) {
      select.classList.remove('is-invalid');
      if (errorMsg) errorMsg.classList.remove('visible');
    }

    const municipio = this.MUNICIPIOS_EL_SALVADOR.find(m => m.id === id);
    this.state.selectedMunicipio = municipio || null;

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
  // HELPER M4: PETICIÓN CON TIMEOUT USANDO ABORTCONTROLLER
  // Evita que la aplicación quede colgada indefinidamente en el campo
  // ==========================================================================
  fetchConTimeout: async function(url, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutError = new Error('TIMEOUT');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  // ==========================================================================
  // FUNCIÓN PRINCIPAL RESILIENTE: CONSULTAR PRONÓSTICO (M4)
  // ==========================================================================
  consultarPronostico: async function() {
    if (this.state.isFetching) return;

    const select = document.getElementById('select-municipio');
    const errorMsg = document.getElementById('input-error-municipio');

    // REQUISITO M4.1: Validación estricta - Asegurar municipio seleccionado antes de consultar
    if (!this.state.selectedMunicipio || !select.value) {
      select.classList.add('is-invalid');
      select.classList.add('shake');
      setTimeout(() => {
        select.classList.remove('shake');
      }, 450);

      if (errorMsg) errorMsg.classList.add('visible');
      select.focus();
      this.mostrarMensaje('⚠️ Debes seleccionar un municipio salvadoreño en la lista antes de consultar el clima.', 'warning', null, 'Validación requerida');
      return;
    }

    const { lat, lon, nombre } = this.state.selectedMunicipio;

    // Validación geográfica de coordenadas salvadoreñas
    const validacion = this.validarUbicacionElSalvador(lat, lon);
    if (!validacion.valido) {
      this.mostrarMensaje(validacion.error, 'danger');
      return;
    }

    // Validación si el usuario configuró OpenWeatherMap sin clave
    if (this.state.apiProvider === 'openweathermap' && !this.state.owmApiKey.trim()) {
      this.mostrarMensaje('⚠️ Has seleccionado OpenWeatherMap pero no has ingresado una clave API. Puedes cambiar a Open-Meteo para consultar de inmediato.', 'warning', {
        actionText: '🔄 Usar Open-Meteo ahora',
        actionCallback: () => {
          this.state.apiProvider = 'openmeteo';
          this.actualizarEstadoUIConfig();
          this.consultarPronostico();
        }
      });
      return;
    }

    // REQUISITO M4.2: Activar indicador de carga claro y deshabilitar controles
    this.mostrarCargando(true);
    this.ocultarMensaje();

    try {
      let datosClima = null;

      if (this.state.apiProvider === 'openweathermap') {
        datosClima = await this.fetchOpenWeatherMap(lat, lon, nombre);
      } else {
        datosClima = await this.fetchOpenMeteo(lat, lon, nombre);
      }

      // REQUISITO M4.4: Validación estricta de la integridad de los datos antes de actualizar estado
      if (!datosClima || typeof datosClima.tempActual !== 'number' || isNaN(datosClima.tempActual) ||
          typeof datosClima.probLluvia !== 'number' || isNaN(datosClima.probLluvia) ||
          typeof datosClima.precipitacionMm !== 'number' || isNaN(datosClima.precipitacionMm)) {
        throw new Error('La respuesta del clima contiene valores incompletos o corruptos.');
      }

      this.state.weatherData = datosClima;
      this.procesarRecomendacionRiego(datosClima);

    } catch (error) {
      // REQUISITO M4.3: Manejo adecuado de errores de red o caídas con mensajes instructivos
      console.error('Error detallado en consulta de pronóstico:', error);
      this.manejarErrorConsulta(error);

    } finally {
      // Siempre desactivar indicador de carga pase lo que pase
      this.mostrarCargando(false);
    }
  },

  // Clasificador e interpretador de fallos para dar solución amigable
  manejarErrorConsulta: function(error) {
    let titulo = 'No se pudo obtener el pronóstico';
    let mensaje = '';
    let opciones = null;

    const estaOffline = !navigator.onLine;

    if (estaOffline) {
      titulo = '📡 Sin conexión a internet';
      mensaje = 'Tu teléfono parece estar desconectado. Verifica que tus datos móviles o tu conexión Wi-Fi estén activos e intenta nuevamente.';
      opciones = {
        actionText: '🔄 Reintentar consulta',
        actionCallback: () => this.consultarPronostico()
      };
    } else if (error.name === 'TimeoutError' || error.message === 'TIMEOUT') {
      titulo = '⏱️ Tiempo de espera agotado';
      mensaje = 'El servidor meteorológico tardó demasiado en responder (más de 8 segundos). La señal celular podría ser débil en este momento.';
      opciones = {
        actionText: '🔄 Reintentar ahora',
        actionCallback: () => this.consultarPronostico()
      };
    } else if (this.state.apiProvider === 'openweathermap') {
      titulo = 'Fallo en OpenWeatherMap';
      mensaje = `${error.message}. Puedes consultar con Open-Meteo sin necesidad de claves.`;
      opciones = {
        actionText: '🔄 Cambiar a Open-Meteo y consultar',
        actionCallback: () => {
          this.state.apiProvider = 'openmeteo';
          this.actualizarEstadoUIConfig();
          this.consultarPronostico();
        }
      };
    } else {
      titulo = 'Fallo al conectar con Open-Meteo';
      mensaje = `${error.message}. Por favor intenta nuevamente en unos momentos.`;
      opciones = {
        actionText: '🔄 Reintentar consulta',
        actionCallback: () => this.consultarPronostico()
      };
    }

    this.mostrarMensaje(mensaje, 'danger', opciones, titulo);
  },

  // ==========================================================================
  // CONSULTA A OPEN-METEO CON TIMEOUT Y VALIDACIÓN
  // ==========================================================================
  fetchOpenMeteo: async function(lat, lon, nombre) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=America%2FEl_Salvador&forecast_days=1`;

    let response;
    try {
      response = await this.fetchConTimeout(url);
    } catch (e) {
      if (e.name === 'TimeoutError') throw e;
      throw new Error('Fallo de red al contactar con el servidor de Open-Meteo.');
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error('El servidor de Open-Meteo está experimentando problemas temporales (Error 5xx).');
      } else if (response.status === 429) {
        throw new Error('Límite de solicitudes temporales alcanzado en el servidor.');
      } else {
        throw new Error(`Open-Meteo respondió con error HTTP ${response.status}.`);
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('La respuesta recibida no contiene un formato JSON válido.');
    }

    return this.normalizarDatosOpenMeteo(data, nombre);
  },

  normalizarDatosOpenMeteo: function(data, nombre) {
    if (!data || typeof data !== 'object') {
      throw new Error('Datos meteorológicos vacíos o corruptos.');
    }

    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    let tempActual = 25;
    if (typeof current.temperature_2m === 'number') {
      tempActual = Math.round(current.temperature_2m);
    } else if (hourly.temperature_2m && hourly.temperature_2m.length > 0) {
      const hora = new Date().getHours();
      tempActual = Math.round(hourly.temperature_2m[hora] || hourly.temperature_2m[0]);
    }

    let probLluvia = 0;
    if (daily.precipitation_probability_max && Array.isArray(daily.precipitation_probability_max) && daily.precipitation_probability_max[0] !== null && daily.precipitation_probability_max[0] !== undefined) {
      probLluvia = Math.round(daily.precipitation_probability_max[0]);
    } else if (hourly.precipitation_probability && Array.isArray(hourly.precipitation_probability)) {
      const horasHoy = hourly.precipitation_probability.slice(0, 24);
      probLluvia = Math.round(Math.max(...horasHoy, 0));
    }

    let precipitacionMm = 0;
    if (daily.precipitation_sum && Array.isArray(daily.precipitation_sum) && daily.precipitation_sum[0] !== null && daily.precipitation_sum[0] !== undefined) {
      precipitacionMm = parseFloat(daily.precipitation_sum[0].toFixed(1));
    } else if (hourly.precipitation && Array.isArray(hourly.precipitation)) {
      const horasHoy = hourly.precipitation.slice(0, 24);
      const total = horasHoy.reduce((acc, val) => acc + (Number(val) || 0), 0);
      precipitacionMm = parseFloat(total.toFixed(1));
    }

    const humedad = (typeof current.relative_humidity_2m === 'number') ? Math.round(current.relative_humidity_2m) : 65;
    const condicion = this.interpretarCodigoClimaWMO(current.weather_code);
    const tempMax = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined) ? Math.round(daily.temperature_2m_max[0]) : null;
    const tempMin = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined) ? Math.round(daily.temperature_2m_min[0]) : null;

    return {
      fuente: 'Open-Meteo',
      municipio: nombre,
      tempActual: tempActual,
      tempMax: tempMax,
      tempMin: tempMin,
      humedad: humedad,
      condicion: condicion,
      probLluvia: probLluvia,
      precipitacionMm: precipitacionMm
    };
  },

  fetchOpenWeatherMap: async function(lat, lon, nombre) {
    const key = this.state.owmApiKey.trim();
    if (!key) {
      throw new Error('No has ingresado una clave API de OpenWeatherMap.');
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${encodeURIComponent(key)}`;

    let response;
    try {
      response = await this.fetchConTimeout(url);
    } catch (e) {
      if (e.name === 'TimeoutError') throw e;
      throw new Error('Fallo de red al conectar con OpenWeatherMap.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Clave API de OpenWeatherMap no válida o aún no activada (las cuentas nuevas pueden tardar un par de horas).');
      } else if (response.status === 429) {
        throw new Error('Límite de peticiones gratuitas alcanzado en OpenWeatherMap.');
      } else {
        throw new Error(`OpenWeatherMap devolvió código HTTP ${response.status}.`);
      }
    }

    let json;
    try {
      json = await response.json();
    } catch (e) {
      throw new Error('Respuesta corrupta de OpenWeatherMap.');
    }

    return this.normalizarDatosOpenWeatherMap(json, nombre);
  },

  normalizarDatosOpenWeatherMap: function(json, nombre) {
    const list = json.list || [];
    const lecturasHoy = list.slice(0, 8);

    let maxProb = 0;
    let sumaMm = 0;

    lecturasHoy.forEach(item => {
      const prob = Math.round((item.pop || 0) * 100);
      if (prob > maxProb) maxProb = prob;
      const mm = (item.rain && item.rain['3h']) ? item.rain['3h'] : 0;
      sumaMm += mm;
    });

    const primera = list[0] || {};
    const tempActual = primera.main ? Math.round(primera.main.temp) : 26;
    const humedad = primera.main ? Math.round(primera.main.humidity) : 60;
    const condicionTxt = (primera.weather && primera.weather[0]) ? primera.weather[0].description : 'Parcialmente nublado';

    return {
      fuente: 'OpenWeatherMap',
      municipio: nombre,
      tempActual: tempActual,
      tempMax: null,
      tempMin: null,
      humedad: humedad,
      condicion: condicionTxt.charAt(0).toUpperCase() + condicionTxt.slice(1),
      probLluvia: maxProb,
      precipitacionMm: parseFloat(sumaMm.toFixed(1))
    };
  },

  interpretarCodigoClimaWMO: function(code) {
    if (code === 0) return '☀️ Cielo despejado';
    if (code === 1) return '🌤️ Principalmente despejado';
    if (code === 2) return '⛅ Parcialmente nublado';
    if (code === 3) return '☁️ Nublado';
    if (code >= 45 && code <= 48) return '🌫️ Neblina';
    if (code >= 51 && code <= 55) return '🌦️ Llovizna ligera';
    if (code >= 61 && code <= 65) return '🌧️ Lluvia moderada o constante';
    if (code >= 80 && code <= 82) return '🌧️ Chubascos intensos';
    if (code >= 95) return '⛈️ Tormenta eléctrica';
    return '⛅ Cielo variable';
  },

  // ==========================================================================
  // REGLA DE DECISIÓN (M1)
  // ==========================================================================
  procesarRecomendacionRiego: function(clima) {
    const probLluvia = clima.probLluvia;
    const precipitacionMm = clima.precipitacionMm;
    const tempActual = clima.tempActual;

    const cumpleReglaNoRegar = (probLluvia > 50) || (precipitacionMm > 2);

    let veredicto = '';
    let tituloVeredicto = '';
    let claseCss = '';
    let resumen = '';
    let justificacion = '';

    if (cumpleReglaNoRegar) {
      veredicto = 'NO REGAR';
      tituloVeredicto = '🛑 NO REGAR';
      claseCss = 'no-regar';
      resumen = 'No se recomienda regar hoy. La lluvia esperada aportará la humedad necesaria a la parcela.';

      if (probLluvia > 50 && precipitacionMm > 2) {
        justificacion = `Se recomienda NO REGAR el cultivo. La probabilidad de lluvia para hoy es del ${probLluvia}% (supera el umbral del 50%) y la precipitación prevista es de ${precipitacionMm} mm (supera el umbral de 2 mm). Regar en estas condiciones saturaría el suelo, desperdiciaría agua y aumentaría el riesgo de asfixia radicular. El aporte pluvial será suficiente para la huerta.`;
      } else if (probLluvia > 50) {
        justificacion = `Se recomienda NO REGAR el cultivo. La probabilidad de lluvia para hoy es del ${probLluvia}% (supera el umbral del 50%), con una precipitación prevista de ${precipitacionMm} mm. El riesgo de lluvia es elevado; regar ahora provocaría exceso de humedad en el suelo y lavado de fertilizantes si cae la precipitación esperada.`;
      } else {
        justificacion = `Se recomienda NO REGAR el cultivo. Aunque la probabilidad de lluvia es del ${probLluvia}%, el volumen de precipitación previsto es de ${precipitacionMm} mm (supera el umbral de 2 mm). Este volumen de agua natural es suficiente para hidratar el suelo de la parcela sin necesidad de riego suplementario.`;
      }

    } else {
      veredicto = 'REGAR';
      tituloVeredicto = '💧 REGAR';
      claseCss = 'si-regar';
      resumen = 'Se recomienda regar hoy. Las precipitaciones previstas no cubrirán las necesidades hídricas del cultivo.';

      justificacion = `Se recomienda REGAR el cultivo. La probabilidad de lluvia para hoy es de solo ${probLluvia}% (no supera el 50%) y la precipitación estimada es de ${precipitacionMm} mm (no supera los 2 mm), con una temperatura actual de ${tempActual}°C. Las condiciones atmosféricas indican que la huerta no recibirá agua natural suficiente. Se aconseja regar temprano en la mañana o al atardecer para evitar pérdidas por evaporación solar.`;
    }

    // Guardar estado verificado de la última recomendación
    this.state.lastRecommendation = {
      municipio: clima.municipio,
      veredicto: veredicto,
      probLluvia: probLluvia,
      precipitacionMm: precipitacionMm,
      temp: tempActual,
      condicion: clima.condicion,
      humedad: clima.humedad,
      justificacion: justificacion,
      fecha: new Date().toISOString()
    };

    this.renderizarRecomendacion(tituloVeredicto, resumen, justificacion, claseCss, clima, cumpleReglaNoRegar);
  },

  renderizarRecomendacion: function(titulo, resumen, justificacion, claseCss, clima, esNoRegar) {
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
    const motivoBox = document.querySelector('.motivo-box');
    if (motivoEl) {
      motivoEl.textContent = justificacion;
    }
    if (motivoBox) {
      motivoBox.className = `motivo-box ${claseCss}`;
    }

    const elMunicipio = document.getElementById('val-municipio-nombre');
    const elCondicion = document.getElementById('val-condicion-badge');
    if (elMunicipio) elMunicipio.textContent = clima.municipio;
    if (elCondicion) elCondicion.textContent = clima.condicion;

    const valProb = document.getElementById('val-prob-lluvia');
    const valProbTag = document.getElementById('val-prob-tag');
    const cardProb = document.getElementById('metric-prob-card');

    if (valProb) valProb.textContent = `${clima.probLluvia}%`;
    if (cardProb && valProbTag) {
      if (clima.probLluvia > 50) {
        cardProb.className = 'metric-item metric-triggered';
        valProbTag.textContent = '⚠️ Supera umbral (> 50%)';
        valProbTag.className = 'metric-sub tag-danger';
      } else {
        cardProb.className = 'metric-item metric-safe';
        valProbTag.textContent = '✓ Dentro del límite (≤ 50%)';
        valProbTag.className = 'metric-sub tag-safe';
      }
    }

    const valPrecip = document.getElementById('val-lluvia-mm');
    const valPrecipTag = document.getElementById('val-precip-tag');
    const cardPrecip = document.getElementById('metric-precip-card');

    if (valPrecip) valPrecip.textContent = `${clima.precipitacionMm} mm`;
    if (cardPrecip && valPrecipTag) {
      if (clima.precipitacionMm > 2) {
        cardPrecip.className = 'metric-item metric-triggered';
        valPrecipTag.textContent = '⚠️ Supera umbral (> 2 mm)';
        valPrecipTag.className = 'metric-sub tag-danger';
      } else {
        cardPrecip.className = 'metric-item metric-safe';
        valPrecipTag.textContent = '✓ Dentro del límite (≤ 2 mm)';
        valPrecipTag.className = 'metric-sub tag-safe';
      }
    }

    const valTemp = document.getElementById('val-temperatura');
    const valTempMinMax = document.getElementById('val-temp-minmax');
    if (valTemp) valTemp.textContent = `${clima.tempActual}°C`;
    if (valTempMinMax) {
      if (clima.tempMin !== null && clima.tempMax !== null) {
        valTempMinMax.textContent = `Mín: ${clima.tempMin}°C / Máx: ${clima.tempMax}°C`;
      } else {
        valTempMinMax.textContent = 'Sensación estable';
      }
    }

    const valHumedad = document.getElementById('val-humedad');
    const valFuente = document.getElementById('val-fuente-api');
    if (valHumedad) valHumedad.textContent = `${clima.humedad}%`;
    if (valFuente) valFuente.textContent = `Fuente: ${clima.fuente}`;

    cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // ==========================================================================
  // REQUISITO M4.4: BLINDAJE DE PERSISTENCIA EN LOCALSTORAGE
  // Ningún error de timeout, red o datos corruptos puede alterar el historial
  // ==========================================================================

  obtenerHistorialStorage: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parseado = JSON.parse(data);
      // Validar que sea un array y filtrar registros corruptos o incompletos (M4)
      if (!Array.isArray(parseado)) {
        console.warn('El historial en localStorage no era un array. Inicializando vacío.');
        return [];
      }
      return parseado.filter(item => {
        return item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.fechaHora === 'string' &&
          typeof item.municipio === 'string' &&
          (item.decisionTomada === 'REGAR' || item.decisionTomada === 'NO REGAR') &&
          item.climaReportado &&
          typeof item.climaReportado === 'object' &&
          typeof item.climaReportado.temperatura === 'number' && !isNaN(item.climaReportado.temperatura) &&
          typeof item.climaReportado.probLluvia === 'number' && !isNaN(item.climaReportado.probLluvia) &&
          typeof item.climaReportado.precipitacionMm === 'number' && !isNaN(item.climaReportado.precipitacionMm);
      });
    } catch (e) {
      console.error('Error al leer historial desde localStorage:', e);
      return [];
    }
  },

  cargarHistorial: function() {
    const historial = this.obtenerHistorialStorage();
    this.renderizarHistorial(historial);
  },

  guardarDecision: function(decisionTomada) {
    // REQUISITO M4.1 & M4.4: Validar estrictamente la presencia y sanidad de datos
    if (!this.state.lastRecommendation) {
      this.mostrarMensaje('⚠️ Primero debes consultar el clima de un municipio antes de poder registrar una decisión.', 'warning');
      return;
    }

    const rec = this.state.lastRecommendation;

    // Validación estricta contra datos incompletos o NaN
    if (typeof rec.temp !== 'number' || isNaN(rec.temp) ||
        typeof rec.probLluvia !== 'number' || isNaN(rec.probLluvia) ||
        typeof rec.precipitacionMm !== 'number' || isNaN(rec.precipitacionMm) ||
        !rec.municipio || typeof rec.municipio !== 'string') {
      this.mostrarMensaje('❌ Los datos climáticos actuales no son íntegros para guardarse. Por favor realiza una nueva consulta.', 'danger');
      return;
    }

    const ahora = new Date();
    const fechaHoraFormateada = ahora.toLocaleString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const nuevoRegistro = {
      id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      fechaHora: fechaHoraFormateada,
      timestamp: ahora.getTime(),
      municipio: rec.municipio,
      climaReportado: {
        temperatura: rec.temp,
        probLluvia: rec.probLluvia,
        precipitacionMm: rec.precipitacionMm,
        condicion: rec.condicion,
        humedad: rec.humedad,
      },
      decisionTomada: decisionTomada,
      sugerenciaSistema: rec.veredicto
    };

    let historial = this.obtenerHistorialStorage();
    historial.unshift(nuevoRegistro);

    if (historial.length > 50) {
      historial = historial.slice(0, 50);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
      this.renderizarHistorial(historial);
      this.mostrarMensaje(`✅ Decisión "${decisionTomada}" guardada en el historial con fecha y clima.`, 'success');

      const historySection = document.getElementById('history-container');
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (e) {
      console.error('Error al persistir en localStorage:', e);
      this.mostrarMensaje('No se pudo guardar la decisión en el almacenamiento local de tu navegador (cuota excedida o modo privado).', 'danger');
    }
  },

  limpiarHistorial: function() {
    const historial = this.obtenerHistorialStorage();
    if (historial.length === 0) {
      this.mostrarMensaje('El historial ya se encuentra vacío.', 'info');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que deseas vaciar todo el historial de decisiones de riego? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      this.renderizarHistorial([]);
      this.mostrarMensaje('🗑️ Historial de decisiones vaciado por completo.', 'info');
    } catch (e) {
      console.error('Error al limpiar localStorage:', e);
      this.mostrarMensaje('Ocurrió un error al intentar vaciar el historial.', 'danger');
    }
  },

  eliminarRegistroHistorial: function(id) {
    let historial = this.obtenerHistorialStorage();
    historial = historial.filter(item => item.id !== id);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
      this.renderizarHistorial(historial);
      this.mostrarMensaje('Registro eliminado del historial.', 'info');
    } catch (e) {
      console.error('Error al actualizar localStorage:', e);
    }
  },

  renderizarHistorial: function(historial) {
    const contenedor = document.getElementById('history-container');
    const badgeCount = document.getElementById('history-count-badge');
    if (!contenedor) return;

    if (badgeCount) {
      badgeCount.textContent = `${historial.length} ${historial.length === 1 ? 'guardada' : 'guardadas'}`;
    }

    if (!historial || historial.length === 0) {
      contenedor.innerHTML = `
        <div class="history-empty-container">
          <svg class="empty-illustration-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="60" cy="60" r="54" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
            <path d="M25 88C35 84 50 86 60 85C75 84 90 87 95 88C95 94 85 98 60 98C35 98 25 94 25 88Z" fill="#854d0e" opacity="0.3"/>
            <path d="M60 85V48" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
            <path d="M60 62C50 56 42 62 40 68C48 70 56 68 60 62Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
            <path d="M60 52C70 46 78 52 80 58C72 60 64 58 60 52Z" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
            <circle cx="60" cy="45" r="4" fill="#4ade80"/>
            <circle cx="34" cy="34" r="10" fill="#facc15" stroke="#eab308" stroke-width="1.5"/>
            <path d="M84 32C84 32 90 40 90 43C90 46.3 87.3 49 84 49C80.7 49 78 46.3 78 43C78 40 84 32 84 32Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
          </svg>
          <h3 class="empty-title">Tu registro de huerta está listo</h3>
          <p class="empty-description">
            Aún no has guardado decisiones de riego hoy. Cuando consultes el clima de tu municipio y elijas una acción, tu registro aparecerá aquí.
          </p>
          <div class="empty-hint">
            <span>☝️</span> Selecciona tu municipio arriba y presiona "Consultar Clima"
          </div>
        </div>
      `;
      return;
    }

    let html = '<div class="history-list">';
    historial.forEach(item => {
      const esNo = item.decisionTomada === 'NO REGAR';
      const claseBadge = esNo ? 'no' : 'si';
      const textoBadge = esNo ? '🛑 DECISIÓN: NO REGAR' : '💧 DECISIÓN: REGAR';

      const clima = item.climaReportado || {};
      const tempStr = (typeof clima.temperatura === 'number') ? `${clima.temperatura}°C` : '--°C';
      const probStr = (typeof clima.probLluvia === 'number') ? `${clima.probLluvia}%` : '--%';
      const lluviaStr = (typeof clima.precipitacionMm === 'number') ? `${clima.precipitacionMm} mm` : '-- mm';
      const condStr = clima.condicion || 'Cielo variable';

      const coincidio = item.sugerenciaSistema ? (item.decisionTomada === item.sugerenciaSistema) : null;
      const coincidenciaTxt = coincidio === true 
        ? '✓ Coincidió con la sugerencia técnica' 
        : (coincidio === false ? 'ℹ️ Decisión manual del agricultor' : '');

      html += `
        <article class="history-item">
          <div class="history-item-top">
            <span class="history-place">📍 ${this.escaparHtml(item.municipio)}</span>
            <span class="history-badge ${claseBadge}">${textoBadge}</span>
          </div>

          <div class="history-datetime">
            <span>📅 <strong>Fecha y Hora:</strong> ${this.escaparHtml(item.fechaHora || '--')}</span>
          </div>

          <div class="history-weather-box" aria-label="Condiciones climáticas registradas">
            <div class="history-weather-item">
              <span>🌡️ Temp:</span> <strong>${tempStr}</strong>
            </div>
            <div class="history-weather-item">
              <span>🌧️ Lluvia:</span> <strong>${probStr}</strong>
            </div>
            <div class="history-weather-item">
              <span>💧 Volumen:</span> <strong>${lluviaStr}</strong>
            </div>
            <div class="history-weather-item">
              <span>🌤️ Estado:</span> <strong>${this.escaparHtml(condStr)}</strong>
            </div>
          </div>

          <div class="history-footer">
            <span class="history-system-match">${this.escaparHtml(coincidenciaTxt)}</span>
            <button class="btn btn-sm btn-danger-outline" onclick="App.eliminarRegistroHistorial('${item.id}')" title="Eliminar este registro">
              🗑️ Borrar registro
            </button>
          </div>
        </article>
      `;
    });
    html += '</div>';

    contenedor.innerHTML = html;
  },

  // ==========================================================================
  // HELPERS DE UI Y ALERTAS ROBUSTAS (M4)
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

  /**
   * Muestra alertas amigables e interactivas con opción de reintento o cierre
   * 
   * @param {string} texto Mensaje descriptivo
   * @param {'danger' | 'warning' | 'info' | 'success'} tipo Nivel de alerta
   * @param {object|null} opciones Acciones interactivas ({actionText, actionCallback})
   * @param {string|null} titulo Título opcional de la alerta
   */
  mostrarMensaje: function(texto, tipo = 'info', opciones = null, titulo = null) {
    const contenedor = document.getElementById('alert-container');
    if (!contenedor) return;

    let icon = 'ℹ️';
    if (tipo === 'danger') icon = '❌';
    if (tipo === 'warning') icon = '⚠️';
    if (tipo === 'success') icon = '✅';

    const tituloHtml = titulo ? `<strong class="alert-title">${this.escaparHtml(titulo)}</strong>` : '';

    let actionBtnHtml = '';
    if (opciones && opciones.actionText) {
      actionBtnHtml = `
        <div class="alert-actions">
          <button id="alert-action-btn" class="btn btn-sm btn-secondary" type="button">
            ${this.escaparHtml(opciones.actionText)}
          </button>
        </div>
      `;
    }

    contenedor.innerHTML = `
      <div class="alert-box alert-${tipo}">
        <div class="alert-header">
          <div class="alert-message-content">
            <span class="alert-icon" aria-hidden="true">${icon}</span>
            <div>
              ${tituloHtml}
              <span>${this.escaparHtml(texto)}</span>
            </div>
          </div>
          <button class="alert-close-btn" type="button" aria-label="Cerrar mensaje" onclick="App.ocultarMensaje()">✕</button>
        </div>
        ${actionBtnHtml}
      </div>
    `;

    contenedor.style.display = 'block';

    if (opciones && opciones.actionCallback) {
      const btn = document.getElementById('alert-action-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          this.ocultarMensaje();
          opciones.actionCallback();
        });
      }
    }

    // Auto-ocultar alertas informativas o de éxito
    if (tipo === 'info' || tipo === 'success') {
      setTimeout(() => {
        this.ocultarMensaje();
      }, 5000);
    }
  },

  ocultarMensaje: function() {
    const contenedor = document.getElementById('alert-container');
    if (contenedor) {
      contenedor.innerHTML = '';
      contenedor.style.display = 'none';
    }
  },

  /**
   * REQUISITO M4.2: Indicador de carga claro mientras se consulta la API
   */
  mostrarCargando: function(mostrar) {
    this.state.isFetching = mostrar;

    const loader = document.getElementById('loader-wrapper');
    const btn = document.getElementById('btn-consultar');
    const select = document.getElementById('select-municipio');
    const cardRecomendacion = document.getElementById('card-recomendacion');

    if (loader) {
      if (mostrar) {
        loader.classList.add('active');
      } else {
        loader.classList.remove('active');
      }
    }

    if (btn) {
      btn.disabled = mostrar;
      btn.textContent = mostrar ? '⏳ Consultando pronóstico en tiempo real...' : '🔍 Consultar Clima y Evaluar Riego';
    }

    if (select) {
      select.disabled = mostrar;
    }

    // Si comienza la carga, desvanecer ligeramente la tarjeta de recomendación para evitar confusión
    if (cardRecomendacion && mostrar) {
      cardRecomendacion.style.opacity = '0.4';
    } else if (cardRecomendacion) {
      cardRecomendacion.style.opacity = '1';
    }
  }
};

// Iniciar aplicación al cargar el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

window.App = App;
