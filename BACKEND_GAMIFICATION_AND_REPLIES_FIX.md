# 🔧 Corrección de Gamificación y Likes en Respuestas (NestJS Backend)

Este documento detalla los problemas de integración detectados entre el Frontend y el Backend en NestJS, explicando el origen exacto de los errores `403 (Forbidden)` y las acciones/likes, junto con las plantillas de código para que el desarrollador del Backend pueda aplicarlas directamente.

---

## 🔴 Causa Raíz de los Errores 403 (Forbidden)

Los errores `403 (Forbidden)` al intentar acceder a los siguientes endpoints para otros usuarios:
*   `GET /api/gamification/points/:user_id`
*   `GET /api/gamification/history/:user_id`
*   `GET /api/points/actions/:userId`
*   `GET /api/points/transactions/claimed/:userId`

se deben a dos problemas principales en las políticas de autorización del backend:

### 1. Bloqueo en `PointsController` (Incluso para Administradores)
En `src/modules/points/points.controller.ts`, el método de validación `requireMatchingUserId` exige que el ID del usuario solicitado sea **estrictamente idéntico** al ID del usuario autenticado:
```typescript
private static requireMatchingUserId(user: AuthUser | undefined, userId: string): string {
  const authenticatedUserId = PointsController.normalizeUserId(user?.user_id);
  // ...
  const requestedUserId = PointsController.normalizeUserId(userId);
  if (requestedUserId !== authenticatedUserId) {
    throw new ForbiddenException('Acceso no autorizado'); // ❌ BLOQUEA TODO
  }
  return authenticatedUserId; // ❌ ERROR ADICIONAL: Devuelve el del admin en lugar del solicitado
}
```
*   **Problema 1:** No permite a administradores (`UserRole.ADMIN`) ni organizadores (`UserRole.ORGANIZER`) consultar datos de otros usuarios.
*   **Problema 2 (Grave):** Retorna `authenticatedUserId` (el del administrador que realiza la consulta) en lugar de `requestedUserId` (el del usuario consultado). Por lo tanto, si se quitara el bloqueo, la consulta seguiría trayendo los datos del administrador en lugar de los del usuario seleccionado.

### 2. Exclusión de Organizadores en `GamificationController`
En `src/modules/gamification/gamification.controller.ts`, el método `requireMatchingUserId` solo permite que un usuario consulte a otro si su rol es estrictamente `UserRole.ADMIN`:
```typescript
if (requestedUserId !== authenticatedUserId && user?.role !== UserRole.ADMIN) {
  throw new ForbiddenException('Acceso no autorizado');
}
```
*   **Problema:** Si el usuario autenticado tiene el rol de `UserRole.ORGANIZER` (quien tiene acceso al panel de control en el frontend), es rechazado con un `403 (Forbidden)`.

---

## 🛠️ Correcciones Requeridas en el Backend (NestJS)

### 1. Modificar `src/modules/points/points.controller.ts`
Actualizar `requireMatchingUserId` para permitir acceso si el rol es `UserRole.ADMIN` o `UserRole.ORGANIZER`, y asegurar que devuelva el ID del usuario solicitado:

```typescript
// Modificar la validación en src/modules/points/points.controller.ts
private static requireMatchingUserId(user: AuthUser | undefined, userId: string): string {
  const authenticatedUserId = PointsController.normalizeUserId(user?.user_id);
  if (!authenticatedUserId) {
    throw new UnauthorizedException('Invalid token payload');
  }

  const requestedUserId = PointsController.normalizeUserId(userId);
  
  // Permitir si es el mismo usuario, o si es Administrador/Organizador
  if (
    requestedUserId !== authenticatedUserId && 
    user?.role !== UserRole.ADMIN && 
    user?.role !== UserRole.ORGANIZER
  ) {
    throw new ForbiddenException('Acceso no autorizado');
  }

  // IMPORTANTE: Devolver requestedUserId si está presente, no el de la sesión
  return requestedUserId ?? authenticatedUserId;
}
```

### 2. Modificar `src/modules/gamification/gamification.controller.ts`
Permitir a los organizadores/moderadores consultar el historial y los puntos de otros usuarios:

```typescript
// Modificar la validación en src/modules/gamification/gamification.controller.ts
private static requireMatchingUserId(user: AuthUser | undefined, userId: string): string {
  const authenticatedUserId = GamificationController.normalizeUserId(user?.user_id);
  if (!authenticatedUserId) {
    throw new UnauthorizedException('Invalid token payload');
  }

  const requestedUserId = GamificationController.normalizeUserId(userId);
  
  // Permitir si es el mismo usuario, o si es Administrador/Organizador
  if (
    requestedUserId !== authenticatedUserId && 
    user?.role !== UserRole.ADMIN && 
    user?.role !== UserRole.ORGANIZER
  ) {
    throw new ForbiddenException('Acceso no autorizado');
  }

  return requestedUserId ?? authenticatedUserId;
}

// También actualizar resolveUserId en el mismo controlador si se requiere
private resolveUserId(user: AuthUser, bodyUserId?: string): string {
  const targetUserId = bodyUserId ?? user.user_id;
  if (
    targetUserId !== user.user_id && 
    user.role !== UserRole.ADMIN && 
    user.role !== UserRole.ORGANIZER
  ) {
    throw new ForbiddenException('Acceso no autorizado');
  }
  return targetUserId;
}
```

### 3. Agregar el endpoint de historial global `/api/gamification/history/all`
El frontend espera obtener el historial de actividad de todos los usuarios para la pestaña de "Canjes Recientes".
Agrega este endpoint en `src/modules/gamification/gamification.controller.ts` (debe declararse **arriba** de los endpoints dinámicos como `:user_id` para evitar conflictos de enrutamiento):

```typescript
@Get('history/all')
@Roles(UserRole.ADMIN, UserRole.ORGANIZER)
@ApiOperation({ summary: 'Historial global de acciones y canjes de todos los usuarios (solo Admin/Organizer)' })
async getAllHistory(): Promise<UserHistory> {
  // Asegurarse de que el servicio implemente la consulta de todo el historial
  return this.gamificationService.getAllUsersHistory();
}
```

---

## 🔍 Correcciones Adicionales

### 4. Relación de Historial en Sequelize (`GamificationService`)
Si las consultas a `history` devuelven arrays vacíos o dan errores 500, verifica que las uniones `include` en el servicio del backend utilicen las relaciones correctas de la base de datos (por ejemplo, asegurar que la relación entre `UserAction` y `User` / `Event` esté debidamente configurada en Sequelize).

### 5. Likes en Respuestas (`RepliesModule`)
Si los likes en las respuestas (replies) de los comentarios fallan en el frontend, se debe configurar una ruta dedicada arriba de cualquier comodín dinámico en el controlador de respuestas de posts:

```typescript
// En el controlador de replies/posts (ej. src/modules/posts/posts.controller.ts)
// IMPORTANTE: Colocar arriba de @Get(':id') o @Post(':id')

@UseGuards(JwtAuthGuard)
@Post('replies/likes/toggle')
@ApiOperation({ summary: 'Dar o quitar like a una respuesta' })
async toggleReplyLike(
  @CurrentUser() user: AuthUser,
  @Body('reply_id') replyId: string, // El frontend envía reply_id
) {
  const userId = user.user_id;
  return this.repliesService.toggleLike(userId, replyId);
}
```
Y en el servicio `replies.service.ts`:
```typescript
async toggleLike(userId: string, replyId: string) {
  // 1. Buscar si ya existe el like
  const existingLike = await this.replyLikeModel.findOne({
    where: { userId, replyId }
  });

  let liked = false;
  if (existingLike) {
    await existingLike.destroy();
    liked = false;
  } else {
    await this.replyLikeModel.create({ userId, replyId });
    liked = true;
  }

  // 2. Contar likes totales actuales
  const likesCount = await this.replyLikeModel.count({
    where: { replyId }
  });

  return {
    success: true,
    message: liked ? 'Like agregado' : 'Like removido',
    liked,
    likes_count: likesCount
  };
}
```
