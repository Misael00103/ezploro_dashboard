import { GOOGLE_MAPS_API_KEY } from './config';

// Caché en memoria para evitar consultas duplicadas
const placeDetailsCache = new Map();

/**
 * Carga el script de Google Maps JavaScript API de manera segura
 */
let googleMapsPromise = null;

const loadGoogleMapsScript = () => {
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Si ya existe la etiqueta del script, esperar a que termine de cargar
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve();
        } else {
          reject(new Error('Timeout esperando Google Maps script'));
        }
      }, 7000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = (e) => {
      googleMapsPromise = null;
      console.warn('Google Maps API bloqueado o no disponible en el cliente (posible adblocker o restricción).', e);
      reject(new Error('Google Maps script bloqueado o no disponible'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Busca lugares usando autocompletado de Google Places directamente en el cliente
 * Con fallback a OpenStreetMap (Nominatim) si Google Maps es bloqueado por extensiones del cliente
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Lista de sugerencias de lugares
 */
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const cleanQuery = query.trim();

  // 1. Intentar con Google Maps JavaScript API directamente
  try {
    await loadGoogleMapsScript();

    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();

      const predictions = await new Promise((resolve) => {
        service.getPlacePredictions(
          {
            input: cleanQuery,
            componentRestrictions: { country: 'do' }, // Restricción para República Dominicana
            types: ['establishment', 'geocode'],
          },
          (results, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              Array.isArray(results)
            ) {
              resolve(
                results.map((p) => ({
                  place_id: p.place_id,
                  description: p.description,
                  structured_formatting: p.structured_formatting,
                  source: 'google',
                }))
              );
            } else if (
              status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              resolve([]);
            } else {
              resolve(null);
            }
          }
        );
      });

      if (predictions !== null) {
        return predictions;
      }
    }
  } catch (googleError) {
    console.warn('Google Places Autocomplete no disponible en este cliente. Activando fallback alternativo:', googleError.message);
  }

  // 2. Fallback resiliente: OpenStreetMap / Nominatim (nunca bloqueado por adblockers)
  try {
    const osmResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&countrycodes=do&limit=6`,
      {
        headers: {
          'Accept-Language': 'es',
        },
      }
    );

    if (osmResponse.ok) {
      const osmData = await osmResponse.json();
      return (osmData || []).map((item) => {
        const placeId = `osm-${item.place_id}`;
        // Guardar en caché para recuperar detalles al instante
        placeDetailsCache.set(placeId, {
          formatted_address: item.display_name,
          geometry: {
            location: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            },
          },
          address_components: [
            { types: ['route'], long_name: item.address?.road || '' },
            { types: ['locality'], long_name: item.address?.city || item.address?.town || item.address?.municipality || '' },
            { types: ['administrative_area_level_1'], long_name: item.address?.state || '' },
            { types: ['country'], long_name: item.address?.country || 'República Dominicana' },
          ],
          name: item.name || item.display_name.split(',')[0],
        });

        return {
          place_id: placeId,
          description: item.display_name,
          source: 'osm',
        };
      });
    }
  } catch (osmError) {
    console.warn('Fallback OSM no disponible:', osmError);
  }

  return [];
};

/**
 * Obtiene detalles completos de un lugar usando su place_id
 * @param {string} placeId - ID del lugar (Google place_id o ID de fallback)
 * @returns {Promise<Object>} Detalles del lugar con coordenadas y dirección
 */
export const getPlaceDetails = async (placeId) => {
  if (!placeId) {
    throw new Error('place_id es requerido');
  }

  // Si proviene del fallback en caché
  if (placeDetailsCache.has(placeId)) {
    return placeDetailsCache.get(placeId);
  }

  // Google Maps JavaScript API PlacesService
  try {
    await loadGoogleMapsScript();

    if (window.google && window.google.maps && window.google.maps.places) {
      const dummyDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(dummyDiv);

      return new Promise((resolve, reject) => {
        service.getDetails(
          {
            placeId,
            fields: ['formatted_address', 'geometry', 'address_components', 'name'],
          },
          (place, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place
            ) {
              let lat = 0;
              let lng = 0;

              if (place.geometry && place.geometry.location) {
                lat =
                  typeof place.geometry.location.lat === 'function'
                    ? place.geometry.location.lat()
                    : place.geometry.location.lat;
                lng =
                  typeof place.geometry.location.lng === 'function'
                    ? place.geometry.location.lng()
                    : place.geometry.location.lng;
              }

              const details = {
                formatted_address: place.formatted_address || '',
                geometry: {
                  location: {
                    lat: Number(lat) || 0,
                    lng: Number(lng) || 0,
                  },
                },
                address_components: place.address_components || [],
                name: place.name || '',
              };

              placeDetailsCache.set(placeId, details);
              resolve(details);
            } else {
              reject(new Error(`Error al obtener detalles en Google Maps: ${status}`));
            }
          }
        );
      });
    }
  } catch (error) {
    console.error('Error obteniendo detalles del lugar en Google Maps:', error);
  }

  throw new Error('No se pudieron obtener los detalles del lugar seleccionado');
};

/**
 * Obtiene información de dirección usando geocoding inverso (GPS a dirección legible)
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {Promise<Object>} Información de dirección
 */
export const reverseGeocode = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Coordenadas inválidas para geocodificación inversa');
  }

  // 1. Google Maps Geocoder directamente
  try {
    await loadGoogleMapsScript();

    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();

      const result = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat, lng }, language: 'es' },
          (results, status) => {
            if (
              status === window.google.maps.GeocoderStatus.OK &&
              Array.isArray(results) &&
              results.length > 0
            ) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoder status: ${status}`));
            }
          }
        );
      });

      if (result) return result;
    }
  } catch (googleError) {
    console.warn('Google Geocoder no disponible, usando fallback OSM:', googleError.message);
  }

  // 2. Fallback Nominatim Reverse Geocoding
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        formatted_address: data.display_name,
        address_components: [
          { types: ['route'], long_name: data.address?.road || '' },
          { types: ['locality'], long_name: data.address?.city || data.address?.town || data.address?.municipality || '' },
          { types: ['administrative_area_level_1'], long_name: data.address?.state || '' },
          { types: ['country'], long_name: data.address?.country || 'República Dominicana' },
        ],
      };
    }
  } catch (osmError) {
    console.warn('Error en fallback de geocodificación inversa:', osmError);
  }

  return {
    formatted_address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
  };
};
