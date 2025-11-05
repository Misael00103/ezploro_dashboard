import { 
  API_URL_PLACES_AUTOCOMPLETE, 
  API_URL_PLACES_DETAILS, 
  API_URL_PLACES_GEOCODE,
  GOOGLE_MAPS_API_KEY
} from './config';
import { getAuthToken } from './authService';

/**
 * Carga el script de Google Maps si no está cargado
 */
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      // Script ya está cargándose, esperar
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error al cargar Google Maps API'));
    document.head.appendChild(script);
  });
};

/**
 * Busca lugares usando autocompletado de Google Places
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Lista de sugerencias de lugares
 */
export const searchPlaces = async (query) => {
  try {
    if (!query || query.length < 3) {
      return [];
    }

    // Primero intentar usar el backend como proxy
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL_PLACES_AUTOCOMPLETE}?input=${encodeURIComponent(query)}&language=es&components=country:do&types=establishment|geocode`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.predictions) {
          return data.predictions;
        } else if (data.status === 'ZERO_RESULTS') {
          return [];
        }
      }
    } catch (backendError) {
      console.log('Backend proxy no disponible, usando Google Maps JavaScript API directamente');
    }

    // Fallback: usar Google Maps JavaScript API directamente
    // Nota: La API antigua muestra advertencias pero sigue funcionando
    await loadGoogleMapsScript();
    
    const service = new window.google.maps.places.AutocompleteService();
    
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'do' },
          types: ['establishment', 'geocode'],
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions.map(p => ({
              place_id: p.place_id,
              description: p.description,
              structured_formatting: p.structured_formatting
            })));
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Obtiene detalles completos de un lugar usando su place_id
 * @param {string} placeId - ID del lugar
 * @returns {Promise<Object>} Detalles del lugar
 */
export const getPlaceDetails = async (placeId) => {
  try {
    if (!placeId) {
      throw new Error('place_id es requerido');
    }

    // Primero intentar usar el backend como proxy
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL_PLACES_DETAILS}?place_id=${placeId}&language=es&fields=formatted_address,geometry,address_components,name`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.result) {
          return data.result;
        }
      }
    } catch (backendError) {
      console.log('Backend proxy no disponible, usando Google Maps JavaScript API directamente');
    }

    // Fallback: usar Google Maps JavaScript API directamente
    // Nota: La API antigua muestra advertencias pero sigue funcionando
    await loadGoogleMapsScript();
    
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: ['formatted_address', 'geometry', 'address_components', 'name'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // Normalizar coordenadas - pueden venir como funciones o números
            let lat, lng;
            if (place.geometry && place.geometry.location) {
              if (typeof place.geometry.location.lat === 'function') {
                lat = place.geometry.location.lat();
                lng = place.geometry.location.lng();
              } else {
                lat = place.geometry.location.lat;
                lng = place.geometry.location.lng;
              }
            }
            
            resolve({
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: Number(lat) || 0,
                  lng: Number(lng) || 0
                }
              },
              address_components: place.address_components,
              name: place.name
            });
          } else {
            reject(new Error(`Error al obtener detalles: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Obtiene información de dirección usando geocoding inverso
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {Promise<Object>} Información de dirección
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Primero intentar usar el backend como proxy
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL_PLACES_GEOCODE}?latlng=${latitude},${longitude}&language=es`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return data.results[0];
        }
      }
    } catch (backendError) {
      console.log('Backend proxy no disponible, usando Google Maps JavaScript API directamente');
    }

    // Fallback: usar Google Maps JavaScript API directamente
    await loadGoogleMapsScript();
    
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude }, language: 'es' },
        (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error(`Error en geocoding inverso: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    throw error;
  }
};
