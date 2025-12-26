# 🧪 Prueba de Actualización de Perfil

## Endpoint a Probar

```
PUT https://api-v3-backend-ezploro.apps.ezploro.com/api/users/update/:userId
```

## Headers Requeridos

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

## Body de Ejemplo

```json
{
  "name": "Juan",
  "lastname": "Pérez",
  "username": "juanperez",
  "display_name": "Juan P.",
  "bio": "Desarrollador full stack",
  "location": "Madrid, España",
  "website": "https://juanperez.com",
  "online_status": true
}
```

## Respuesta Esperada (200 OK)

```json
{
  "message": "Usuario actualizado correctamente",
  "profileCompleted": true,
  "pointsAwarded": 0,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "Juan",
    "lastname": "Pérez",
    "username": "juanperez",
    "display_name": "Juan P.",
    "bio": "Desarrollador full stack",
    "role": "user",
    "dark_mode": false,
    "notifications_enabled": true,
    "online_status": true,
    "show_subscribed_events": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Posibles Errores

### 1. Error 403 - Acceso no autorizado

**Causa:** El userId en la URL no coincide con el userId del token JWT.

**Solución en el Backend:**
```javascript
const userIdNum = parseInt(userId, 10);
const requesterId = parseInt(req.user.user_id, 10);

if (requesterId !== userIdNum) {
  return res.status(403).json({ message: "Acceso no autorizado." });
}
```

### 2. Error 400 - Username ya existe

**Causa:** El username que se intenta actualizar ya está en uso por otro usuario.

**Respuesta:**
```json
{
  "message": "El nombre de usuario ya está en uso"
}
```

### 3. Error 404 - Usuario no encontrado

**Causa:** El userId en la URL no existe en la base de datos.

**Respuesta:**
```json
{
  "message": "Usuario no encontrado"
}
```

### 4. Error 401 - No autorizado

**Causa:** El token JWT no es válido o ha expirado.

**Respuesta:**
```json
{
  "message": "No autorizado"
}
```

## Prueba con cURL

```bash
# Reemplazar <TOKEN> con tu token JWT y <USER_ID> con tu ID de usuario
curl -X PUT https://api-v3-backend-ezploro.apps.ezploro.com/api/users/update/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan",
    "lastname": "Pérez",
    "username": "juanperez",
    "display_name": "Juan P.",
    "bio": "Desarrollador full stack",
    "location": "Madrid, España",
    "website": "https://juanperez.com",
    "online_status": true
  }'
```

## Verificación en el Frontend

### 1. Abrir la Consola del Navegador

Buscar los siguientes logs:

```
🔵 updateUserProfile - Iniciando actualización...
🔵 updateUserProfile - userId obtenido: <número>
🔵 updateUserProfile - URL: https://api-v3-backend-ezploro.apps.ezploro.com/api/users/update/<número>
🔵 updateUserProfile - Datos a enviar: { ... }
```

### 2. Verificar la Petición en la Pestaña Network

1. Abrir DevTools (F12)
2. Ir a la pestaña "Network"
3. Filtrar por "update"
4. Buscar la petición PUT a `/api/users/update/:userId`
5. Verificar:
   - Status Code (debe ser 200)
   - Request Headers (debe incluir Authorization)
   - Request Payload (debe incluir los datos del formulario)
   - Response (debe incluir los datos actualizados)

### 3. Verificar localStorage

Después de una actualización exitosa, verificar en la consola:

```javascript
// Ver el usuario guardado
console.log(JSON.parse(localStorage.getItem('user')));

// Ver el userId
console.log(localStorage.getItem('userId'));

// Ver el token
console.log(localStorage.getItem('token'));
```

## Checklist de Debugging

- [ ] El token JWT está presente en localStorage
- [ ] El userId está presente en localStorage y es un número válido
- [ ] El token JWT incluye el user_id en su payload (verificar en jwt.io)
- [ ] La URL de la petición incluye el userId correcto
- [ ] Los headers incluyen Authorization con el formato "Bearer <token>"
- [ ] El body de la petición incluye los campos a actualizar
- [ ] El backend responde con status 200
- [ ] La respuesta incluye los datos actualizados
- [ ] localStorage se actualiza con los nuevos datos
- [ ] El Dashboard refleja los cambios

## Problemas Comunes y Soluciones

### Problema: "ID de usuario inválido"

**Causa:** El userId no está en localStorage o no es válido.

**Solución:**
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. Verificar que el login guarde correctamente el userId

### Problema: "Sesión expirada"

**Causa:** El token JWT ha expirado.

**Solución:**
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. Verificar la fecha de expiración del token en jwt.io

### Problema: "Acceso no autorizado"

**Causa:** El userId en la URL no coincide con el userId del token.

**Solución:**
1. Verificar que el userId en localStorage coincida con el del token
2. Verificar que el backend compare correctamente los IDs

### Problema: Los cambios no se reflejan en el Dashboard

**Causa:** El Dashboard no está escuchando los cambios en localStorage.

**Solución:**
El componente UserManagementManager ya dispara un evento de storage:

```javascript
window.dispatchEvent(new StorageEvent('storage', {
  key: 'user',
  newValue: JSON.stringify(updatedUserData)
}));
```

El Dashboard debe tener un listener para este evento (ya implementado).

---

**Fecha:** 25 de diciembre de 2025
**Estado:** ✅ Listo para pruebas
