# Guía de Pruebas de Testimonios en Postman

## Base URL
```
https://api-v3-backend-ezploro.apps.ezploro.com/api
```

## Obtener Token de Autenticación

Primero necesitas obtener un token válido:

### 1. Login
**POST** `https://api-v3-backend-ezploro.apps.ezploro.com/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "tu-email@ejemplo.com",
  "password": "tu-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**Copia el token del response para usarlo en los siguientes requests.**

---

## Endpoints de Testimonios

### 1. Obtener Testimonios (Solo Activos)
**GET** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial`

**Query Parameters:**
- `limit` (opcional): Número de testimonios a devolver (default: 10)
- `offset` (opcional): Número de testimonios a saltar (default: 0)
- `include_inactive` (opcional): `true` o `false` (default: `false`)

**Ejemplos de URLs:**
```
# Obtener primeros 10 testimonios activos
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial?limit=10&offset=0

# Obtener 100 testimonios activos
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial?limit=100&offset=0

# Obtener todos los testimonios (activos e inactivos) - Requiere autenticación
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial?limit=100&offset=0&include_inactive=true
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

**Nota:** Si `include_inactive=false` o no se incluye, puede funcionar sin autenticación. Si `include_inactive=true`, requiere autenticación.

---

### 2. Obtener Testimonio por ID
**GET** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/:id`

**Ejemplo:**
```
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/1
```

**Headers:**
```
Content-Type: application/json
```

**Nota:** Este endpoint NO requiere autenticación según el router del backend.

---

### 3. Crear Testimonio
**POST** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Body (form-data):**
- `testimonio` (text): El texto del testimonio
- `name_testimonio` (text): Nombre del autor del testimonio
- `cargo_testimonio` (text): Cargo del autor
- `image` (file): Archivo de imagen (OBLIGATORIO)

**Ejemplo en Postman:**
1. Selecciona **Body** → **form-data**
2. Agrega los campos:
   - `testimonio`: "Este es un excelente servicio..."
   - `name_testimonio`: "Juan Pérez"
   - `cargo_testimonio`: "CEO de Empresa XYZ"
   - `image`: Selecciona un archivo (tipo: File)

**Response esperado:**
```json
{
  "message": "Testimonio creado exitosamente.",
  "testimonial": {
    "testimonial_id": 1,
    "testimonio": "Este es un excelente servicio...",
    "name_testimonio": "Juan Pérez",
    "cargo_testimonio": "CEO de Empresa XYZ",
    "imagen_testimonio": "https://res.cloudinary.com/...",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Actualizar Testimonio
**PUT** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/:id`

**Ejemplo:**
```
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/1
```

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Body (form-data):**
- `testimonio` (text, opcional): El texto del testimonio
- `name_testimonio` (text, opcional): Nombre del autor
- `cargo_testimonio` (text, opcional): Cargo del autor
- `is_active` (text, opcional): `true` o `false`
- `image` (file, opcional): Nueva imagen (si quieres actualizar la imagen)

**Ejemplo en Postman:**
1. Selecciona **Body** → **form-data**
2. Agrega los campos que quieres actualizar

**Response esperado:**
```json
{
  "message": "Testimonio actualizado exitosamente",
  "testimonial": { ... }
}
```

---

### 5. Eliminar Testimonio (Soft Delete)
**DELETE** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/:id`

**Ejemplo:**
```
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/1
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

**Response esperado:**
```json
{
  "message": "Testimonio desactivado exitosamente"
}
```

**Nota:** Este endpoint hace un soft delete (cambia `is_active` a `false`).

---

### 6. Activar/Desactivar Testimonio (Toggle)
**PATCH** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/:id/toggle`

**Ejemplo:**
```
https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/1/toggle
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

**Response esperado:**
```json
{
  "message": "Testimonio activado exitosamente",
  "testimonial": { ... }
}
```

**Nota:** Este endpoint alterna el estado `is_active` del testimonio.

---

### 7. Contar Testimonios Activos
**GET** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/count/active`

**Headers:**
```
Content-Type: application/json
```

**Response esperado:**
```json
{
  "message": "Contador de testimonios activos obtenido exitosamente",
  "activos": 10
}
```

---

### 8. Contar Testimonios Inactivos
**GET** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/count/inactive`

**Headers:**
```
Content-Type: application/json
```

**Response esperado:**
```json
{
  "message": "Contador de testimonios inactivos obtenido exitosamente",
  "inactivos": 2
}
```

---

### 9. Obtener Estadísticas de Testimonios
**GET** `https://api-v3-backend-ezploro.apps.ezploro.com/api/testimonial/stats`

**Headers:**
```
Content-Type: application/json
```

**Response esperado:**
```json
{
  "message": "Estadísticas obtenidas exitosamente",
  "stats": {
    "total": 12,
    "activos": 10,
    "inactivos": 2
  }
}
```

---

## Colección de Postman

Puedes crear una colección en Postman con estos requests:

### Variables de Entorno en Postman:
1. Ve a **Environments** → Crea un nuevo environment
2. Agrega estas variables:
   - `base_url`: `https://api-v3-backend-ezploro.apps.ezploro.com/api`
   - `token`: (deja vacío, se llenará después del login)

### Requests Sugeridos:

1. **Login** (para obtener token)
   - Method: POST
   - URL: `{{base_url}}/auth/login`
   - Body: JSON con email y password
   - Tests: Guardar token en variable de entorno
   ```javascript
   if (pm.response.code === 200) {
     const jsonData = pm.response.json();
     pm.environment.set("token", jsonData.token);
   }
   ```

2. **Get Testimonials (Activos)**
   - Method: GET
   - URL: `{{base_url}}/testimonial?limit=100&offset=0`
   - Headers: `Authorization: Bearer {{token}}`

3. **Get All Testimonials (Incluyendo Inactivos)**
   - Method: GET
   - URL: `{{base_url}}/testimonial?limit=100&offset=0&include_inactive=true`
   - Headers: `Authorization: Bearer {{token}}`

4. **Create Testimonial**
   - Method: POST
   - URL: `{{base_url}}/testimonial`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data con todos los campos

5. **Update Testimonial**
   - Method: PUT
   - URL: `{{base_url}}/testimonial/:id`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data con campos a actualizar

6. **Delete Testimonial**
   - Method: DELETE
   - URL: `{{base_url}}/testimonial/:id`
   - Headers: `Authorization: Bearer {{token}}`

7. **Get Testimonial by ID**
   - Method: GET
   - URL: `{{base_url}}/testimonial/:id`

8. **Toggle Testimonial**
   - Method: PATCH
   - URL: `{{base_url}}/testimonial/:id/toggle`
   - Headers: `Authorization: Bearer {{token}}`

9. **Get Stats**
   - Method: GET
   - URL: `{{base_url}}/testimonial/stats`

---

## Errores Comunes

### Error 400: "ID de usuario inválido" / "El userId debe ser un número positivo"
- **Causa**: El backend no puede validar el userId del token. El token puede tener el `user_id` como string en lugar de número, o el userId no es un número positivo válido.
- **Solución**: 
  1. Verifica que el token sea válido decodificándolo en [jwt.io](https://jwt.io)
  2. Asegúrate de que el token contenga `user_id` como número (no string)
  3. Verifica que el usuario exista en la base de datos
  4. Si el token tiene `user_id` como string (ej: `"user_id": "3"`), el backend necesita ser actualizado para convertir el string a número antes de validar
  5. Como solución temporal, intenta obtener solo testimonios activos sin el parámetro `include_inactive=true`

**Ejemplo de token válido:**
```json
{
  "user_id": 3,  // ✅ Número
  "exp": 1762467582
}
```

**Ejemplo de token problemático:**
```json
{
  "user_id": "3",  // ❌ String (el backend espera número)
  "exp": 1762467582
}
```

### Error 401: "Unauthorized"
- **Causa**: Token inválido o expirado
- **Solución**: Obtén un nuevo token con el endpoint de login

### Error 404: "Not Found"
- **Causa**: El testimonio con ese ID no existe
- **Solución**: Verifica que el ID sea correcto

### Error 400: "Los campos testimonio, name_testimonio y cargo_testimonio son obligatorios"
- **Causa**: Faltan campos requeridos en el body
- **Solución**: Asegúrate de incluir todos los campos obligatorios

### Error 400: "No se proporcionó ninguna imagen"
- **Causa**: Falta el campo `image` en el form-data
- **Solución**: Asegúrate de incluir un archivo de imagen en el campo `image`

---

## Notas Importantes

1. **Autenticación**: La mayoría de los endpoints requieren autenticación. Usa el token obtenido del login.

2. **Content-Type**: 
   - Para requests con JSON: `Content-Type: application/json`
   - Para requests con form-data (crear/actualizar con imagen): NO incluyas `Content-Type`, Postman lo manejará automáticamente

3. **include_inactive**: Este parámetro solo funciona con autenticación. Si lo usas sin token, puede devolver error 401 o 400.

4. **Soft Delete**: El endpoint DELETE no elimina físicamente el testimonio, solo cambia `is_active` a `false`.

5. **Imágenes**: Las imágenes se suben a Cloudinary y se devuelve la URL completa en `imagen_testimonio`.

