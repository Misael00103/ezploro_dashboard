# Profile Components

Esta carpeta contiene todos los componentes reutilizables para las pantallas de perfil (ProfileScreen y OtherProfileScreen).

## 📁 Estructura de Carpetas

```
components/profile/
├── shared/           # Componentes compartidos entre ambas screens
│   ├── UserAvatar.js
│   ├── UserBanner.js
│   ├── ProfileTabs.js
│   ├── ProfileStats.js
│   ├── EmptyState.js
│   ├── EventImageSquare.js
│   ├── PostCard.js
│   ├── CommentsModal.js
│   └── index.js
├── self/             # Componentes específicos de ProfileScreen (perfil propio)
│   ├── ProfileHeaderSelf.js
│   ├── EditProfileModal.js
│   ├── CreatePostModal.js
│   ├── StatusModal.js
│   └── index.js
├── other/            # Componentes específicos de OtherProfileScreen (perfil de otros)
│   ├── ProfileHeaderOther.js
│   ├── MessageModal.js
│   └── index.js
└── README.md
```

## 🔧 Componentes Compartidos

### UserAvatar
Componente de avatar con indicador de estado online/offline.

**Props:**
- `userObj` (object) - Objeto del usuario con información del perfil
- `size` (number) - Tamaño del avatar (default: 100)
- `onPress` (function) - Callback al presionar el avatar
- `disabled` (boolean) - Deshabilitar interacción

### UserBanner
Banner del perfil del usuario con imagen o gradiente por defecto.

**Props:**
- `user` (object) - Objeto del usuario
- `onPress` (function) - Callback al presionar el banner
- `disabled` (boolean) - Deshabilitar interacción

### ProfileTabs
Sistema de navegación por tabs para las diferentes secciones del perfil.

**Props:**
- `tabs` (array) - Array de tabs con estructura: `{ key, icon, label }`
- `activeTab` (string) - Tab actualmente activo
- `onChange` (function) - Callback al cambiar de tab
- `accentColor` (string) - Color de acento (default: '#8B5CF6')
- `inactiveColor` (string) - Color para tabs inactivos (default: '#666')
- `darkMode` (boolean) - Modo oscuro

### ProfileStats
Muestra estadísticas del perfil (followers, following, events, points).

**Props:**
- `followersCount` (number) - Cantidad de seguidores
- `followingCount` (number) - Cantidad de seguidos
- `eventsCount` (number) - Cantidad de eventos
- `points` (number) - Puntos de gamificación (opcional)
- `darkMode` (boolean) - Modo oscuro

### EmptyState
Estado vacío para cuando no hay contenido en una sección.

**Props:**
- `activeTab` (string) - Tab activo para mostrar mensaje apropiado
- `darkMode` (boolean) - Modo oscuro

### EventImageSquare
Card de evento con imagen, título, likes y vistas.

**Props:**
- `item` (object) - Objeto del evento
- `darkMode` (boolean) - Modo oscuro
- `onPress` (function) - Callback al presionar el evento
- `onAction` (function) - Callback para acción (like)
- `actionType` (string) - Tipo de acción (default: "like")
- `liked` (boolean) - Si el evento tiene like
- `views` (number) - Número de vistas

### PostCard
Card de post con imagen, título, descripción y acciones.

**Props:**
- `item` (object) - Objeto del post
- `darkMode` (boolean) - Modo oscuro
- `isLiked` (boolean) - Si el post tiene like
- `onLike` (function) - Callback al dar like
- `onComment` (function) - Callback al comentar
- `views` (number) - Número de vistas
- `normalizeImageUrl` (function) - Función para normalizar URLs

### CommentsModal
Modal estilo Instagram para ver y agregar comentarios.

**Props:**
- `visible` (boolean) - Visibilidad del modal
- `onClose` (function) - Callback al cerrar
- `darkMode` (boolean) - Modo oscuro
- `selectedPost` (object) - Post seleccionado
- `likedPosts` (Set/Array) - Posts con like
- `postViews` (object) - Objeto con vistas por post
- `postComments` (array) - Array de comentarios
- `newComment` (string) - Texto del nuevo comentario
- `setNewComment` (function) - Setter para nuevo comentario
- `onToggleLike` (function) - Callback para toggle like
- `onSendComment` (function) - Callback para enviar comentario
- `currentUser` (object) - Usuario actual
- `normalizeImageUrl` (function) - Función para normalizar URLs

## 🎯 Componentes de Self (ProfileScreen)

### ProfileHeaderSelf
Header completo del perfil propio con avatar, stats y botones de acción.

**Props:**
- `user` (object) - Usuario actual
- `darkMode` (boolean) - Modo oscuro
- `followersCount` (number) - Cantidad de seguidores
- `followingCount` (number) - Cantidad de seguidos
- `eventsCount` (number) - Cantidad de eventos
- `points` (number) - Puntos
- `onPressEdit` (function) - Callback para editar perfil
- `onPressSettings` (function) - Callback para configuración
- `onPressStatus` (function) - Callback para actualizar status
- `onPressCreatePost` (function) - Callback para crear post
- `friendRequests` (array) - Array de solicitudes de amistad
- `onAcceptFriend` (function) - Callback para aceptar amigo
- `onDeclineFriend` (function) - Callback para rechazar amigo
- `Styles` (object) - Objeto de estilos
- `AvatarComponent` (component) - Componente de avatar personalizado

### EditProfileModal
Modal para editar información del perfil.

**Props:**
- `visible` (boolean) - Visibilidad del modal
- `onClose` (function) - Callback al cerrar
- `onSave` (function) - Callback al guardar
- `loadingEdit` (boolean) - Estado de carga
- `editName` (string) - Nombre editable
- `setEditName` (function) - Setter para nombre
- `editUsername` (string) - Username editable
- `setEditUsername` (function) - Setter para username
- `editBio` (string) - Bio editable
- `setEditBio` (function) - Setter para bio
- `darkMode` (boolean) - Modo oscuro
- `Styles` (object) - Objeto de estilos

### CreatePostModal
Modal para crear un nuevo post.

**Props:**
- `visible` (boolean) - Visibilidad del modal
- `onClose` (function) - Callback al cerrar
- `onSubmit` (function) - Callback al enviar
- `darkMode` (boolean) - Modo oscuro
- `Styles` (object) - Objeto de estilos
- `newImageUri` (string) - URI de la imagen
- `setNewImageUri` (function) - Setter para URI
- `newImageTitle` (string) - Título del post
- `setNewImageTitle` (function) - Setter para título
- `newImageDescription` (string) - Descripción del post
- `setNewImageDescription` (function) - Setter para descripción
- `loadingImage` (boolean) - Estado de carga

### StatusModal
Modal para actualizar el estado del usuario.

**Props:**
- `visible` (boolean) - Visibilidad del modal
- `onClose` (function) - Callback al cerrar
- `onUpdate` (function) - Callback al actualizar
- `statusText` (string) - Texto del status
- `setStatusText` (function) - Setter para status
- `darkMode` (boolean) - Modo oscuro
- `Styles` (object) - Objeto de estilos

## 👥 Componentes de Other (OtherProfileScreen)

### ProfileHeaderOther
Header del perfil de otros usuarios con botones de follow, friend request, etc.

**Props:**
- `user` (object) - Usuario del perfil
- `darkMode` (boolean) - Modo oscuro
- `followersCount` (number) - Cantidad de seguidores
- `followingCount` (number) - Cantidad de seguidos
- `eventsCount` (number) - Cantidad de eventos
- `isFollowing` (boolean) - Si el usuario actual sigue a este usuario
- `isFollowLoading` (boolean) - Estado de carga de follow
- `hasSentFriendRequest` (boolean) - Si se envió solicitud de amistad
- `hasReceivedFriendRequest` (boolean) - Si se recibió solicitud de amistad
- `isFriend` (boolean) - Si son amigos
- `isBlocked` (boolean) - Si está bloqueado
- `onFollowToggle` (function) - Callback para toggle follow
- `onFriendRequestToggle` (function) - Callback para enviar/cancelar solicitud
- `onFriendRequestAccept` (function) - Callback para aceptar solicitud
- `onFriendRequestReject` (function) - Callback para rechazar solicitud
- `onMessageUser` (function) - Callback para enviar mensaje
- `onBlockUser` (function) - Callback para bloquear
- `onUnblockUser` (function) - Callback para desbloquear
- `Styles` (object) - Objeto de estilos
- `AvatarComponent` (component) - Componente de avatar personalizado

### MessageModal
Modal para enviar mensajes directos a otros usuarios.

**Props:**
- `visible` (boolean) - Visibilidad del modal
- `onClose` (function) - Callback al cerrar
- `onSend` (function) - Callback al enviar mensaje
- `darkMode` (boolean) - Modo oscuro
- `newMessage` (string) - Texto del mensaje
- `setNewMessage` (function) - Setter para mensaje
- `isMessageSending` (boolean) - Estado de envío
- `recipientUser` (object) - Usuario destinatario

## 📝 Ejemplo de Uso

### ProfileScreen (perfil propio)

```javascript
import React from 'react';
import { View, FlatList } from 'react-native';
import {
  UserAvatar,
  UserBanner,
  ProfileTabs,
  EmptyState,
  EventImageSquare,
  PostCard,
  CommentsModal,
} from '../components/profile/shared';
import {
  ProfileHeaderSelf,
  EditProfileModal,
  CreatePostModal,
  StatusModal,
} from '../components/profile/self';

function ProfileScreen() {
  // ... estados y lógica
  
  return (
    <View>
      <FlatList
        ListHeaderComponent={
          <>
            <UserBanner user={user} onPress={pickBannerImage} />
            <ProfileHeaderSelf
              user={user}
              darkMode={darkMode}
              followersCount={followersCount}
              followingCount={followingCount}
              eventsCount={eventsCount}
              points={points}
              onPressEdit={() => setEditModal(true)}
              onPressSettings={() => navigation.navigate("Settings")}
              onPressStatus={() => setStatusModal(true)}
              onPressCreatePost={uploadNewImage}
              friendRequests={friendRequests}
              onAcceptFriend={handleAcceptFriend}
              onDeclineFriend={handleDeclineFriend}
              Styles={styles}
              AvatarComponent={(props) => <UserAvatar {...props} onPress={pickProfileImage} />}
            />
            <ProfileTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
              darkMode={darkMode}
            />
          </>
        }
        renderItem={renderItem}
        data={getActiveTabData()}
      />
      
      <EditProfileModal
        visible={editModal}
        onClose={() => setEditModal(false)}
        onSave={saveProfile}
        loadingEdit={loadingEdit}
        editName={editName}
        setEditName={setEditName}
        editUsername={editUsername}
        setEditUsername={setEditUsername}
        editBio={editBio}
        setEditBio={setEditBio}
        darkMode={darkMode}
        Styles={styles}
      />
      
      {/* Otros modales... */}
    </View>
  );
}
```

### OtherProfileScreen (perfil de otros usuarios)

```javascript
import React from 'react';
import { View, FlatList } from 'react-native';
import {
  UserAvatar,
  UserBanner,
  ProfileTabs,
  EmptyState,
  EventImageSquare,
  PostCard,
  CommentsModal,
} from '../components/profile/shared';
import {
  ProfileHeaderOther,
  MessageModal,
} from '../components/profile/other';

function OtherProfileScreen({ route }) {
  const { userId } = route.params;
  // ... estados y lógica
  
  return (
    <View>
      <FlatList
        ListHeaderComponent={
          <>
            <UserBanner user={user} />
            <ProfileHeaderOther
              user={user}
              darkMode={darkMode}
              followersCount={followersCount}
              followingCount={followingCount}
              eventsCount={eventsCount}
              isFollowing={isFollowing}
              isFollowLoading={isFollowLoading}
              hasSentFriendRequest={hasSentFriendRequest}
              hasReceivedFriendRequest={hasReceivedFriendRequest}
              isFriend={isFriend}
              isBlocked={isBlocked}
              onFollowToggle={handleFollowToggle}
              onFriendRequestToggle={handleFriendRequestToggle}
              onFriendRequestAccept={() => handleFriendRequestAction("accept")}
              onFriendRequestReject={() => handleFriendRequestAction("reject")}
              onMessageUser={handleMessageUser}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              Styles={styles}
              AvatarComponent={(props) => <UserAvatar {...props} />}
            />
            <ProfileTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
              darkMode={darkMode}
            />
          </>
        }
        renderItem={renderItem}
        data={getActiveTabData()}
      />
      
      <MessageModal
        visible={messageModal}
        onClose={() => setMessageModal(false)}
        onSend={sendMessage}
        darkMode={darkMode}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isMessageSending={isMessageSending}
        recipientUser={user}
      />
      
      {/* Otros modales... */}
    </View>
  );
}
```

## 🎨 Estilos

Todos los componentes utilizan StyleSheet de React Native y mantienen consistencia visual con:
- **Color primario**: `#6200EE`
- **Color de acento**: `#8B5CF6`
- **Fondo oscuro**: `#181A20`
- **Card oscuro**: `#1F222A` / `#333644`

Los componentes aceptan `darkMode` como prop para alternar entre temas claro y oscuro.

## 🔗 Conexiones y Dependencias

Los componentes mantienen todas las conexiones originales:
- Callbacks para manejo de eventos
- Context hooks (useAuth, useTheme, useEvents)
- Servicios (eventService, userService, etc.)
- Navegación entre pantallas

## ✅ Beneficios de la Refactorización

1. **Reutilización**: Componentes compartibles entre múltiples screens
2. **Mantenibilidad**: Código más limpio y organizado
3. **Testing**: Componentes más fáciles de testear individualmente
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades
5. **Performance**: Componentes optimizados con React.memo cuando sea necesario

## 🚀 Próximos Pasos

Para usar estos componentes en las screens principales, necesitarás:
1. Importar los componentes necesarios
2. Mantener la lógica de estado en las screens
3. Pasar props apropiadamente
4. Los estilos ya están incluidos en cada componente, pero puedes pasarles `Styles` como prop para mayor flexibilidad
