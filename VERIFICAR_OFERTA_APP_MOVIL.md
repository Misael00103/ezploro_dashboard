# Verificación de Ofertas en App Móvil

## Problema
Las ofertas creadas desde el dashboard no aparecen en la app móvil.

## Pasos de Verificación

### 1. Verificar que la oferta se creó correctamente en el Dashboard

1. Ve a la sección **Gamificación** en el dashboard
2. Busca la pestaña **Ofertas y Recompensas**
3. Verifica que tu oferta aparezca en la lista
4. Asegúrate de que tenga:
   - ✅ Estado: **Activa** (toggle verde)
   - ✅ Imagen cargada
   - ✅ Todos los campos completos

### 2. Verificar en la consola del navegador

Abre la consola del navegador (F12) y busca estos logs cuando creas la oferta:

```
✅ createOffer - Oferta creada exitosamente: {...}
```

Verifica que el objeto retornado tenga:
- `offer_id` o `id`
- `is_active: true`
- `image_url` con una URL válida

### 3. Probar el endpoint desde Postman

#### Endpoint que usa la app móvil (ofertas activas):
```
GET https://api-v3-backend-ezploro.apps.ezploro.com/api/offer/rewards/offers
```

**Headers:**
```
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "offers": [
    {
      "offer_id": 1,
      "title": "Tu oferta",
      "description": "...",
      "image_url": "https://...",
      "is_active": true,
      "discount_percentage": 20,
      ...
    }
  ],
  "totalCount": 1,
  "limit": 10,
  "offset": 0
}
```

#### Endpoint de todas las ofertas (admin):
```
GET https://api-v3-backend-ezploro.apps.ezploro.com/api/offer/rewards/offers/all
```

### 4. Verificar en la base de datos

Conecta a la base de datos y ejecuta:

```sql
-- Ver todas las ofertas
SELECT offer_id, title, is_active, created_at, image_url 
FROM offers 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver solo ofertas activas
SELECT offer_id, title, is_active, created_at, image_url 
FROM offers 
WHERE is_active = true
ORDER BY created_at DESC;
```

### 5. Problemas Comunes

#### A. La oferta no está activa
**Solución:** En el dashboard, activa el toggle de la oferta

#### B. La imagen no se subió correctamente
**Solución:** 
- Verifica que `image_url` no sea null en la base de datos
- Intenta subir la imagen nuevamente
- Verifica que el servidor de imágenes esté funcionando

#### C. La app móvil tiene caché
**Solución en la app móvil:**
- Cierra completamente la app
- Limpia el caché de la app
- Vuelve a abrir la app
- Pull to refresh en la lista de ofertas

#### D. La app móvil está usando un filtro diferente
**Solución:** Verifica en el código de la app móvil qué filtros está usando:
```javascript
// Ejemplo de filtros que podría estar usando la app
getOffers({ 
  is_active: true,
  category: 'specific_category',
  target_audience: 'all'
})
```

### 6. Verificar logs del backend

En el servidor backend, busca logs relacionados con:
```
GET /api/offer/rewards/offers
```

Verifica:
- ¿La petición llega al servidor?
- ¿Hay errores en la consulta SQL?
- ¿El token es válido?
- ¿El user_id del token es correcto?

### 7. Verificar campos requeridos

Asegúrate de que la oferta tenga todos los campos requeridos:

```javascript
{
  title: "Título de la oferta",           // ✅ Requerido
  description: "Descripción",             // ✅ Requerido
  image_url: "https://...",               // ✅ Requerido
  is_active: true,                        // ✅ Debe ser true
  offer_type: "percentage",               // ✅ Requerido
  discount_percentage: 20,                // Si offer_type es percentage
  discount_amount: null,                  // Si offer_type es fixed
  original_price: 100,                    // Opcional
  final_price: 80,                        // Opcional
  start_date: "2024-01-01",              // ✅ Requerido
  end_date: "2024-12-31",                // ✅ Requerido
  terms_conditions: "Términos...",        // Opcional
  promo_code: "PROMO2024",               // Opcional
  target_audience: "all",                 // ✅ Requerido
  points_required: null,                  // Opcional
  max_uses: null,                         // Opcional
  stock_available: null                   // Opcional
}
```

### 8. Solución Rápida

Si todo lo anterior está correcto pero la app móvil no muestra la oferta:

1. **Reinicia el servidor backend**
2. **Limpia el caché de la app móvil**
3. **Verifica que la app esté apuntando a la URL correcta del backend**
4. **Verifica que no haya filtros adicionales en la app móvil** que estén excluyendo tu oferta

### 9. Código de ejemplo para la app móvil

Si necesitas actualizar el código de la app móvil, aquí está el código correcto:

```javascript
// En la app móvil
const loadOffers = async () => {
  try {
    const response = await fetch(
      'https://api-v3-backend-ezploro.apps.ezploro.com/api/offer/rewards/offers',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    console.log('Ofertas recibidas:', data);
    
    // El backend retorna { offers, totalCount, limit, offset }
    if (data.offers && Array.isArray(data.offers)) {
      setOffers(data.offers);
    }
  } catch (error) {
    console.error('Error cargando ofertas:', error);
  }
};
```

## Contacto

Si después de seguir todos estos pasos la oferta aún no aparece, el problema probablemente está en:
1. El código de la app móvil (filtros incorrectos)
2. El backend (consulta SQL incorrecta)
3. La base de datos (datos corruptos o faltantes)
