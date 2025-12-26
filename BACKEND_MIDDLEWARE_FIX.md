# 🔧 Solución Completa para el Middleware de Autenticación

## Problema Identificado

El endpoint `/api/users/me` devuelve error 500 porque el middleware `protectRoute` no está adjuntando correctamente el `user_id` a `req.user`.

## Archivos del Backend a Revisar

### 1. `middleware/validate.js` (o donde esté `protectRoute`)

El middleware `protectRoute` debe:
1. Verificar el token JWT
2. Decodificar el token
3. Adjuntar `req.user` con el `user_id`

**Código correcto:**

```javascript
// middleware/validate.js
import jwt from 'jsonwebtoken';

export const protectRoute = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // 1. Obtener el token del header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        console.error('❌ protectRoute - No se proporcionó token');
        return res.status(401).json({ 
          message: 'Token no proporcionado',
          error: 'Se requiere autenticación para acceder a este recurso'
        });
      }

      // 2. Verificar y decodificar el token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('❌ protectRoute - Error verificando token:', err.message);
          return res.status(403).json({ 
            message: 'Token inválido o expirado',
            error: err.message
          });
        }

        // 3. Adjuntar el usuario decodificado a req.user
        req.user = {
          user_id: decoded.user_id || decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role || 'user'
        };

        console.log('✅ protectRoute - Usuario autenticado:', {
          user_id: req.user.user_id,
          email: req.user.email,
          role: req.user.role
        });

        // 4. Verificar que el user_id esté presente
        if (!req.user.user_id) {
          console.error('❌ protectRoute - user_id no encontrado en el token');
          return res.status(401).json({ 
            message: 'Token inválido',
            error: 'El token no contiene un ID de usuario válido'
          });
        }

        // 5. Verificar roles si se especificaron
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
          console.error('❌ protectRoute - Rol no autorizado:', req.user.role);
          return res.status(403).json({ 
            message: 'Acceso denegado',
            error: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
          });
        }

        // 6. Continuar con la siguiente función
        next();
      });
    } catch (error) {
      console.error('❌ protectRoute - Error inesperado:', error);
      return res.status(500).json({ 
        message: 'Error del servidor en autenticación',
        error: error.message
      });
    }
  };
};
```

### 2. `controller/authController.js` - Función `login`

Asegurarse de que el token JWT incluya el `user_id`:

```javascript
// controller/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { models } from '../index.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔵 Login - Intento de login para:', email);

    // 1. Validar que se proporcionen email y password
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // 2. Buscar el usuario por email
    const user = await models.user.findOne({ 
      where: { email } 
    });

    if (!user) {
      console.error('❌ Login - Usuario no encontrado:', email);
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // 3. Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.error('❌ Login - Contraseña incorrecta para:', email);
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // 4. Verificar que la cuenta esté activa
    if (user.is_active === false) {
      console.error('❌ Login - Cuenta desactivada:', email);
      return res.status(403).json({ 
        message: 'Cuenta desactivada. Contacta al administrador.' 
      });
    }

    // 5. Generar el token JWT con user_id
    const token = jwt.sign(
      {
        user_id: user.user_id,  // ⚠️ CRÍTICO: Debe ser user_id
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login - Token generado para user_id:', user.user_id);

    // 6. Actualizar last_active
    await user.update({ 
      last_active: new Date() 
    });

    // 7. Preparar la respuesta
    const userData = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      profile_picture: user.profile_picture,
      banner_image: user.banner_image,
      bio: user.bio,
      location: user.location,
      website: user.website,
      dark_mode: user.dark_mode,
      notifications_enabled: user.notifications_enabled,
      online_status: user.online_status,
      points: user.points
    };

    // 8. Enviar la respuesta
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

### 3. `controller/userController.js` - Función `getCurrentUserById`

Mejorar el manejo de errores:

```javascript
// controller/userController.js
export const getCurrentUserById = async (req, res) => {
  try {
    // 1. Logging para debugging
    console.log('🔵 getCurrentUserById - req.user:', req.user);

    // 2. Verificar que req.user exista
    if (!req.user) {
      console.error('❌ getCurrentUserById - req.user no está definido');
      return res.status(401).json({ 
        message: "No autorizado",
        error: "Usuario no encontrado en la petición. El middleware de autenticación puede tener un problema."
      });
    }

    // 3. Verificar que req.user.user_id exista
    if (!req.user.user_id) {
      console.error('❌ getCurrentUserById - req.user.user_id no está definido:', req.user);
      return res.status(401).json({ 
        message: "No autorizado",
        error: "ID de usuario no encontrado en el token. El token puede estar mal formado."
      });
    }

    console.log('🔵 getCurrentUserById - Buscando usuario con ID:', req.user.user_id);

    // 4. Buscar el usuario en la base de datos
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

    // 5. Verificar que el usuario exista
    if (!user) {
      console.error('❌ getCurrentUserById - Usuario no encontrado en BD:', req.user.user_id);
      return res.status(404).json({ 
        message: "Usuario no encontrado",
        error: "El usuario con el ID proporcionado no existe en la base de datos."
      });
    }

    console.log('✅ getCurrentUserById - Usuario encontrado:', user.user_id);

    // 6. Enviar la respuesta
    res.status(200).json({
      message: "Usuario obtenido correctamente",
      data: user,
    });

  } catch (error) {
    console.error("❌ Error en getCurrentUserById:", error);
    console.error("❌ Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Error del servidor", 
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Error interno del servidor'
    });
  }
};
```

## Variables de Entorno Requeridas

Asegúrate de que el archivo `.env` tenga:

```env
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
NODE_ENV=development
```

## Pruebas

### 1. Probar el Login

```bash
curl -X POST https://api-v3-backend-ezploro.apps.ezploro.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "John",
    ...
  }
}
```

### 2. Verificar el Token en jwt.io

1. Copiar el token de la respuesta
2. Ir a https://jwt.io
3. Pegar el token
4. Verificar que el payload contenga:
   ```json
   {
     "user_id": 1,
     "email": "user@example.com",
     "role": "user",
     "iat": 1234567890,
     "exp": 1234654290
   }
   ```

### 3. Probar /api/users/me

```bash
curl -X GET https://api-v3-backend-ezploro.apps.ezploro.com/api/users/me \
  -H "Authorization: Bearer <TOKEN_AQUI>" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "message": "Usuario obtenido correctamente",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "John",
    ...
  }
}
```

## Checklist de Verificación

- [ ] El archivo `.env` tiene `JWT_SECRET` definido
- [ ] La función `login` genera el token con `user_id` en el payload
- [ ] El middleware `protectRoute` decodifica el token correctamente
- [ ] El middleware `protectRoute` adjunta `req.user` con `user_id`
- [ ] El controlador `getCurrentUserById` verifica que `req.user.user_id` exista
- [ ] Los logs muestran el `user_id` en cada paso
- [ ] El endpoint `/api/users/me` devuelve 200 en lugar de 500

## Logs Esperados en el Backend

Cuando todo funcione correctamente, deberías ver:

```
🔵 Login - Intento de login para: user@example.com
✅ Login - Token generado para user_id: 1
🔵 getCurrentUserById - req.user: { user_id: 1, email: 'user@example.com', role: 'user' }
🔵 getCurrentUserById - Buscando usuario con ID: 1
✅ getCurrentUserById - Usuario encontrado: 1
```

---

**Fecha:** 25 de diciembre de 2025
**Prioridad:** 🔴 CRÍTICA - El frontend no puede funcionar sin esto
**Estado:** ⚠️ Pendiente de implementación en el backend
