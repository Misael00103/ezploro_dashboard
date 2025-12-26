# 🔧 Corrección Requerida en el Backend

## Problema Identificado

El endpoint `/api/users/me` está devolviendo un error 500 (Internal Server Error). Esto ocurre porque el middleware de autenticación no está decodificando correctamente el token JWT o el `user_id` no está presente en el payload del token.

## Análisis del Error

```
GET https://api-v3-backend-ezploro.apps.ezploro.com/api/users/me 500 (Internal Server Error)
```

### Causa Raíz

Mirando el código del controlador `getCurrentUserById` en `userController.js`:

```javascript
export const getCurrentUserById = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "No autorizado" });
    }
    // ...
  }
}
```

El problema es que `req.user.user_id` no está disponible, lo que causa que el código falle antes de llegar al return 401.

## Soluciones Requeridas en el Backend

### 1. Verificar el Middleware de Autenticación

El middleware `authenticateToken` debe:

1. Decodificar correctamente el token JWT
2. Extraer el `user_id` del payload
3. Adjuntarlo a `req.user`

**Ejemplo de middleware correcto:**

```javascript
// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Error verificando token:', err);
        return res.status(403).json({ message: 'Token inválido o expirado' });
      }

      // Asegurar que user_id esté disponible
      req.user = {
        user_id: decoded.user_id || decoded.id || decoded.sub,
        email: decoded.email,
        role: decoded.role
      };

      console.log('✅ Token verificado, user_id:', req.user.user_id);
      next();
    });
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(500).json({ message: 'Error del servidor en autenticación' });
  }
};
```

### 2. Verificar la Generación del Token en el Login

El controlador de login debe incluir el `user_id` en el payload del JWT:

```javascript
// controller/authController.js
export const login = async (req, res) => {
  try {
    // ... validación de credenciales ...

    // Generar token con user_id
    const token = jwt.sign(
      {
        user_id: user.user_id,  // ⚠️ IMPORTANTE: Incluir user_id
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        profile_picture: user.profile_picture,
        banner_image: user.banner_image
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
```

### 3. Mejorar el Manejo de Errores en getCurrentUserById

```javascript
export const getCurrentUserById = async (req, res) => {
  try {
    // Logging para debugging
    console.log('🔵 getCurrentUserById - req.user:', req.user);

    if (!req.user) {
      console.error('❌ req.user no está definido');
      return res.status(401).json({ message: "No autorizado - Usuario no encontrado en request" });
    }

    if (!req.user.user_id) {
      console.error('❌ req.user.user_id no está definido:', req.user);
      return res.status(401).json({ message: "No autorizado - ID de usuario no encontrado" });
    }

    const user = await models.user.findOne({
      where: { user_id: req.user.user_id },
      attributes: [
        "user_id",
        "email",
        "name",
        "lastname",
        "username",
        "display_name",
        "profile_picture",
        "banner_image",
        "bio",
        "role",
        "dark_mode",
        "notifications_enabled",
        "online_status",
        "show_subscribed_events",
        "created_at",
        "location",
        "website",
        "points"
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log('✅ getCurrentUserById - Usuario encontrado:', user.user_id);

    res.status(200).json({
      message: "Usuario obtenido correctamente",
      data: user,
    });
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    res.status(500).json({ 
      message: "Error del servidor", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

## Verificación

Para verificar que el problema está solucionado:

1. **Verificar el token JWT:**
   ```bash
   # Decodificar el token en https://jwt.io
   # Debe contener: { user_id: <número>, email: <string>, role: <string> }
   ```

2. **Probar el endpoint:**
   ```bash
   curl -X GET https://api-v3-backend-ezploro.apps.ezploro.com/api/users/me \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json"
   ```

3. **Respuesta esperada:**
   ```json
   {
     "message": "Usuario obtenido correctamente",
     "data": {
       "user_id": 1,
       "email": "user@example.com",
       "name": "John",
       "lastname": "Doe",
       ...
     }
   }
   ```

## Solución Temporal en el Frontend

Mientras se corrige el backend, el frontend ahora:

1. ✅ Usa el usuario guardado en cache si `/api/users/me` falla
2. ✅ Muestra un mensaje de advertencia pero continúa funcionando
3. ✅ Proporciona logs detallados para debugging
4. ✅ Valida el token antes de hacer peticiones

## Próximos Pasos

1. [ ] Corregir el middleware `authenticateToken` en el backend
2. [ ] Verificar que el token incluya `user_id` en el payload
3. [ ] Mejorar el manejo de errores en `getCurrentUserById`
4. [ ] Probar el endpoint `/api/users/me` con un token válido
5. [ ] Remover la solución temporal del frontend una vez corregido el backend

---

**Fecha:** 25 de diciembre de 2025
**Estado:** ⚠️ Pendiente de corrección en el backend
