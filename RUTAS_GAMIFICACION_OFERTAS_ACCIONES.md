# 📋 RUTAS COMPLETAS: GAMIFICACIÓN, OFERTAS Y ACCIONES

## 🔗 BASE URL
```
https://api-v3-backend-ezploro.apps.ezploro.com/api
```

---

## 🎮 GAMIFICACIÓN

### 1. **Registrar Acción de Gamificación**
- **Método:** `POST`
- **Ruta:** `/api/gamification/action`
- **Función:** `registerAction(actionData)`
- **Archivo:** `src/services/gamificationService.js`
- **Body:**
  ```json
  {
    "user_id": number,
    "action_name": string,
    "event_id": number | null
  }
  ```

### 2. **Obtener Puntos del Usuario**
- **Método:** `GET`
- **Ruta:** `/api/gamification/points/:user_id`
- **Función:** `getUserPoints(userId)`
- **Archivo:** `src/services/gamificationService.js`
- **Ejemplo:** `/api/gamification/points/3`

### 3. **Canjear Recompensa**
- **Método:** `POST`
- **Ruta:** `/api/gamification/redeem`
- **Función:** `redeemReward(redeemData)`
- **Archivo:** `src/services/gamificationService.js`
- **Body:**
  ```json
  {
    "user_id": number,
    "reward_name": string,
    "points_redeemed": number
  }
  ```

### 4. **Obtener Historial del Usuario**
- **Método:** `GET`
- **Ruta:** `/api/gamification/history/:user_id`
- **Función:** `getUserHistory(userId)`
- **Archivo:** `src/services/gamificationService.js`
- **Ejemplo:** `/api/gamification/history/3`
- **Respuesta:**
  ```json
  {
    "actions": [...],
    "rewards": [...]
  }
  ```

---

## 🎁 OFERTAS (REWARDS)

### 1. **Crear Oferta**
- **Método:** `POST`
- **Ruta:** `/api/offer/rewards/offers`
- **Función:** `createOffer(offerData, imageFile)`
- **Archivo:** `src/services/offerService.js`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "title": string,
    "description": string,
    "organizer_id": number,
    "discount_percentage": number | null,
    "discount_amount": number | null,
    "original_price": number | null,
    "final_price": number | null,
    "start_date": string (ISO date),
    "end_date": string (ISO date),
    "category": string,
    "image_url": string,
    "terms_conditions": string,
    "is_active": boolean,
    "max_uses": number | null,
    "promo_code": string,
    "target_audience": string,
    "offer_type": string,
    "points_required": number
  }
  ```
- **Nota:** Si hay `imageFile`, primero se sube usando `/api/users/upload-image` para obtener `image_url`.

### 2. **Obtener Todas las Ofertas (con filtros)**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/offers`
- **Función:** `getOffers(filters)`
- **Archivo:** `src/services/offerService.js`
- **Query Params:**
  - `category`: string
  - `is_active`: boolean
  - `search`: string
  - `dateFrom`: string
  - `dateTo`: string
  - `target_audience`: string
  - `offer_type`: string
  - `limit`: number
  - `offset`: number
  - `organizer_id`: number
- **Ejemplo:** `/api/offer/rewards/offers?limit=20&offset=0&is_active=true&organizer_id=3`
- **Respuesta:**
  ```json
  {
    "offers": [...],
    "totalCount": number,
    "limit": number,
    "offset": number
  }
  ```

### 3. **Obtener Ofertas Activas**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/offers` (misma que getOffers, pero con filtro `is_active=true`)
- **Función:** `getActiveOffers(filters)`
- **Archivo:** `src/services/offerService.js`
- **Query Params:** Igual que `getOffers`
- **Ejemplo:** `/api/offer/rewards/offers?limit=20&offset=0&is_active=true`

### 4. **Obtener Todas las Ofertas (Admin/User)**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/offers/all`
- **Función:** No implementada directamente, pero configurada en `config.js`
- **Archivo:** `src/services/config.js` (línea 323)

### 5. **Obtener Oferta por ID**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/offers/:id`
- **Función:** `getOfferById(offerId)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/1`

### 6. **Actualizar Oferta**
- **Método:** `PUT`
- **Ruta:** `/api/offer/rewards/offers/:offerId`
- **Función:** `updateOffer(offerId, offerData, imageFile)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/1`
- **Body:** Igual que `createOffer`

### 7. **Eliminar Oferta**
- **Método:** `DELETE`
- **Ruta:** `/api/offer/rewards/offers/:offerId`
- **Función:** `deleteOffer(offerId)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/1`

### 8. **Activar/Desactivar Oferta**
- **Método:** `PATCH`
- **Ruta:** `/api/offer/rewards/offers/:id/toggle-status`
- **Función:** `toggleOfferStatus(offerId, isActive)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/1/toggle-status`
- **Body:**
  ```json
  {
    "is_active": boolean
  }
  ```

### 9. **Obtener Estadísticas de Ofertas**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/stats`
- **Función:** `getOfferStats(filters)`
- **Archivo:** `src/services/offerService.js`
- **Query Params:**
  - `organizer_id`: number
- **Ejemplo:** `/api/offer/rewards/stats?organizer_id=3`
- **Respuesta:**
  ```json
  {
    "totalOffers": number,
    "activeOffers": number,
    "expiredOffers": number,
    "inactiveOffers": number,
    "totalUses": number
  }
  ```

### 10. **Validar Código Promocional**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/offers/promo/:promo_code/validate`
- **Función:** `validatePromoCode(promoCode)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/promo/DESCUENTO10/validate`

### 11. **Usar Código Promocional**
- **Método:** `POST`
- **Ruta:** `/api/offer/rewards/offers/promo/:promo_code/use`
- **Función:** `usePromoCode(promoCode, userId)`
- **Archivo:** `src/services/offerService.js`
- **Ejemplo:** `/api/offer/rewards/offers/promo/DESCUENTO10/use`
- **Body:**
  ```json
  {
    "user_id": number
  }
  ```

### 12. **Canjear Oferta**
- **Método:** `POST`
- **Ruta:** `/api/offer/rewards/offers/redeem/:offerId`
- **Función:** No implementada directamente, pero configurada en `config.js`
- **Archivo:** `src/services/config.js` (línea 332)
- **Ejemplo:** `/api/offer/rewards/offers/redeem/1`

### 13. **Obtener Mis Canjes (Redenciones del Usuario)**
- **Método:** `GET`
- **Ruta:** `/api/offer/rewards/my-redemptions`
- **Función:** No implementada directamente, pero configurada en `config.js`
- **Archivo:** `src/services/config.js` (línea 333)

---

## ⚙️ REGLAS DE PUNTOS (RULES)

### 1. **Obtener Todas las Reglas**
- **Método:** `GET`
- **Ruta:** `/api/rules`
- **Función:** `getAllRules()`
- **Archivo:** `src/services/rulesService.js`
- **Respuesta:** Array de reglas

### 2. **Obtener Regla por ID**
- **Método:** `GET`
- **Ruta:** `/api/rules/:ruleId`
- **Función:** `getRuleById(ruleId)`
- **Archivo:** `src/services/rulesService.js`
- **Ejemplo:** `/api/rules/1`

### 3. **Crear Regla**
- **Método:** `POST`
- **Ruta:** `/api/rules`
- **Función:** `createRule(ruleData)`
- **Archivo:** `src/services/rulesService.js`
- **Body:**
  ```json
  {
    "rule_name": string,
    "point_type": "Profile" | "Events" | "Engagement",
    "points": number (1-5),
    "description": string (opcional),
    "is_active": boolean
  }
  ```

### 4. **Actualizar Regla**
- **Método:** `PUT`
- **Ruta:** `/api/rules/:ruleId`
- **Función:** `updateRule(ruleId, ruleData)`
- **Archivo:** `src/services/rulesService.js`
- **Ejemplo:** `/api/rules/1`
- **Body:** Campos a actualizar (parcial)

### 5. **Eliminar Regla**
- **Método:** `DELETE`
- **Ruta:** `/api/rules/:ruleId`
- **Función:** `deleteRule(ruleId)`
- **Archivo:** `src/services/rulesService.js`
- **Ejemplo:** `/api/rules/1`

---

## 🎯 ACCIONES Y PUNTOS (POINTS)

### 1. **Obtener Acciones Reclamables**
- **Método:** `GET`
- **Ruta:** `/api/points/actions/:userId`
- **Función:** `getClaimableActions(userId)`
- **Archivo:** `src/services/pointsService.js`
- **Ejemplo:** `/api/points/actions/3`
- **Respuesta:**
  ```json
  {
    "total": number,
    "actions": [...]
  }
  ```
  O directamente un array `[...]`

### 2. **Reclamar Puntos para una Acción**
- **Método:** `POST`
- **Ruta:** `/api/points/actions/:actionId/claim/:userId`
- **Función:** `claimPoints(userId, actionId)`
- **Archivo:** `src/services/pointsService.js`
- **Ejemplo:** `/api/points/actions/5/claim/3`

### 3. **Obtener Transacciones Reclamadas**
- **Método:** `GET`
- **Ruta:** `/api/points/transactions/claimed/:userId`
- **Función:** `getClaimedTransactions(userId)`
- **Archivo:** `src/services/pointsService.js`
- **Ejemplo:** `/api/points/transactions/claimed/3`
- **Respuesta:**
  ```json
  {
    "total": number,
    "total_points_earned": number,
    "transactions": [...]
  }
  ```

---

## 📤 SUBIDA DE IMÁGENES

### **Subir Imagen de Perfil (usada para ofertas)**
- **Método:** `POST`
- **Ruta:** `/api/users/upload-image`
- **Función:** `uploadProfilePicture(imageFile)` (desde `userService.js`)
- **Archivo:** `src/services/userService.js`
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `FormData` con campo `image`
- **Nota:** Esta ruta se usa para subir imágenes antes de crear/actualizar ofertas, luego se incluye la `image_url` en el JSON de la oferta.

---

## 📝 RESUMEN DE CONFIGURACIÓN

### Variables en `src/services/config.js`:

```javascript
// GAMIFICACIÓN
export const API_URL_GAMIFICATION = `${BASE_URL}/gamification`
export const API_URL_GAMIFICATION_ACTION = `${API_URL_GAMIFICATION}/action`
export const API_URL_GAMIFICATION_POINTS = `${API_URL_GAMIFICATION}/points/:user_id`
export const API_URL_GAMIFICATION_REDEEM = `${API_URL_GAMIFICATION}/redeem`
export const API_URL_GAMIFICATION_HISTORY = `${API_URL_GAMIFICATION}/history/:user_id`

// REGLAS
export const API_URL_RULES = `${BASE_URL}/rules`

// PUNTOS
export const API_URL_POINTS = `${BASE_URL}/points`
export const API_URL_POINTS_ACTIONS = `${API_URL_POINTS}/actions/:userId`
export const API_URL_POINTS_CLAIM = `${API_URL_POINTS}/actions/:actionId/claim/:userId`
export const API_URL_POINTS_TRANSACTIONS = `${API_URL_POINTS}/transactions/claimed/:userId`

// OFERTAS
export const API_URL_OFFERS = `${BASE_URL}/offer/rewards/offers`
export const API_URL_OFFERS_CREATE = `${API_URL_OFFERS}` // POST
export const API_URL_OFFERS_LIST = `${API_URL_OFFERS}/all` // GET
export const API_URL_OFFERS_ACTIVE = `${API_URL_OFFERS}` // GET
export const API_URL_OFFERS_STATS = `${BASE_URL}/offer/rewards/stats`
export const API_URL_OFFERS_BY_ID = `${API_URL_OFFERS}/:id`
export const API_URL_OFFERS_UPDATE = `${API_URL_OFFERS}/:offerId` // PUT
export const API_URL_OFFERS_DELETE = `${API_URL_OFFERS}/:offerId` // DELETE
export const API_URL_OFFERS_TOGGLE_STATUS = `${API_URL_OFFERS}/:id/toggle-status`
export const API_URL_OFFERS_PROMO_VALIDATE = `${API_URL_OFFERS}/promo/:promo_code/validate`
export const API_URL_OFFERS_PROMO_USE = `${API_URL_OFFERS}/promo/:promo_code/use`
export const API_URL_OFFERS_REDEEM = `${API_URL_OFFERS}/redeem/:offerId`
export const API_URL_OFFERS_MY_REDEMPTIONS = `${BASE_URL}/offer/rewards/my-redemptions`
```

---

## 🔐 AUTENTICACIÓN

Todas las rutas requieren autenticación mediante Bearer Token:
```
Authorization: Bearer <token>
```

El token se obtiene de `localStorage.getItem('token')` o `AsyncStorage.getItem('token')` en React Native.

---

## ⚠️ NOTAS IMPORTANTES

1. **userId debe ser un número positivo**: El backend valida que `userId` sea un número, no un string. Asegúrate de convertir `userId` a número antes de usarlo.

2. **Formato de fechas**: Las fechas deben enviarse en formato ISO (ej: `"2024-01-01T00:00:00.000Z"`).

3. **Imágenes**: Para ofertas, primero se sube la imagen usando `/api/users/upload-image` para obtener la `image_url`, luego se incluye en el JSON de la oferta.

4. **Respuestas del backend**: Algunos endpoints devuelven objetos con arrays (ej: `{ offers: [...] }`), otros devuelven arrays directamente. El código maneja ambos casos.

5. **Errores comunes**:
   - `404`: Ruta no encontrada (verificar que el router esté montado en el backend)
   - `400`: ID de usuario inválido (verificar que `userId` sea número)
   - `500`: Error interno del servidor (verificar logs del backend)

