# Fix para Rankings de Eventos - Error GROUP BY

## Problema
El backend está retornando error 500:
```
column "event->organizer.user_id" must appear in the GROUP BY clause or be used in an aggregate function
```

## Causa
En PostgreSQL (modo estricto), cuando haces un `GROUP BY`, todas las columnas que no son agregadas deben estar en el `GROUP BY`. El problema está en las funciones `rankingEventosMasSuscritos` y `rankingEventosMasLikes` del `rankingController.js`.

## Solución

Reemplaza las funciones en tu `server/controller/rankingController.js`:

### 1. rankingEventosMasSuscritos

```javascript
// Eventos con más suscriptores
export const rankingEventosMasSuscritos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await models.event_subscriptions.findAll({
      attributes: [
        'event_id',
        [sequelize.fn('COUNT', sequelize.col('event_subscriptions.user_id')), 'count']
      ],
      group: ['event_subscriptions.event_id', 'event.event_id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: limit,
      include: [{
        model: models.event,
        as: 'event',
        attributes: ['event_id', 'title', 'cover_image', 'organizer_id'],
        include: [{
          model: models.user,
          as: 'organizer',
          attributes: ['user_id', 'username', 'display_name', 'profile_picture']
        }]
      }]
    });

    const formattedData = result.map((item, index) => ({
      event_id: item.event_id,
      title: item.event?.title || '',
      cover_image: item.event?.cover_image || null,
      organizer: item.event?.organizer ? {
        user_id: item.event.organizer.user_id,
        username: item.event.organizer.username || '',
        display_name: item.event.organizer.display_name || '',
        profile_picture: item.event.organizer.profile_picture || null
      } : null,
      count: parseInt(item.dataValues.count || 0),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      message: 'Ranking obtenido exitosamente',
      data: formattedData
    });
  } catch (error) {
    console.error('Error en rankingEventosMasSuscritos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el ranking',
      error: error.message 
    });
  }
};
```

### 2. rankingEventosMasLikes

```javascript
// Eventos con más likes
export const rankingEventosMasLikes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await models.event_likes.findAll({
      attributes: [
        'event_id',
        [sequelize.fn('COUNT', sequelize.col('event_likes.user_id')), 'count']
      ],
      group: ['event_likes.event_id', 'event.event_id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: limit,
      include: [{
        model: models.event,
        as: 'event',
        attributes: ['event_id', 'title', 'cover_image', 'organizer_id'],
        include: [{
          model: models.user,
          as: 'organizer',
          attributes: ['user_id', 'username', 'display_name', 'profile_picture']
        }]
      }]
    });

    const formattedData = result.map((item, index) => ({
      event_id: item.event_id,
      title: item.event?.title || '',
      cover_image: item.event?.cover_image || null,
      organizer: item.event?.organizer ? {
        user_id: item.event.organizer.user_id,
        username: item.event.organizer.username || '',
        display_name: item.event.organizer.display_name || '',
        profile_picture: item.event.organizer.profile_picture || null
      } : null,
      count: parseInt(item.dataValues.count || 0),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      message: 'Ranking obtenido exitosamente',
      data: formattedData
    });
  } catch (error) {
    console.error('Error en rankingEventosMasLikes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el ranking',
      error: error.message 
    });
  }
};
```

## Cambios Realizados

1. **Eliminé las columnas del organizer del GROUP BY**: Solo dejé `event_id` y `event.event_id`
2. **Agregué `profile_picture`** al organizer en el resultado formateado
3. **Simplifiqué el GROUP BY**: Ahora solo agrupa por las columnas necesarias

## Alternativa: Usar subquery

Si el problema persiste, puedes usar una subquery:

```javascript
export const rankingEventosMasSuscritos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Primero obtener los IDs y conteos
    const rankingData = await sequelize.query(`
      SELECT 
        es.event_id,
        COUNT(es.user_id) as count
      FROM event_subscriptions es
      GROUP BY es.event_id
      ORDER BY count DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Luego obtener los detalles de cada evento
    const eventIds = rankingData.map(r => r.event_id);
    
    if (eventIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Ranking obtenido exitosamente',
        data: []
      });
    }
    
    const events = await models.event.findAll({
      where: {
        event_id: eventIds
      },
      include: [{
        model: models.user,
        as: 'organizer',
        attributes: ['user_id', 'username', 'display_name', 'profile_picture']
      }]
    });
    
    // Combinar los datos
    const formattedData = rankingData.map((item, index) => {
      const event = events.find(e => e.event_id === item.event_id);
      return {
        event_id: item.event_id,
        title: event?.title || '',
        cover_image: event?.cover_image || null,
        organizer: event?.organizer ? {
          user_id: event.organizer.user_id,
          username: event.organizer.username || '',
          display_name: event.organizer.display_name || '',
          profile_picture: event.organizer.profile_picture || null
        } : null,
        count: parseInt(item.count || 0),
        rank: index + 1
      };
    });

    res.status(200).json({
      success: true,
      message: 'Ranking obtenido exitosamente',
      data: formattedData
    });
  } catch (error) {
    console.error('Error en rankingEventosMasSuscritos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el ranking',
      error: error.message 
    });
  }
};
```

## Verificación

Después de aplicar los cambios:
1. Reinicia el servidor backend
2. Prueba los endpoints en Postman:
   - `GET /api/ranking/eventos-mas-suscritos?limit=10`
   - `GET /api/ranking/eventos-mas-likes?limit=10`
3. Verifica que retornen datos sin error 500

El frontend ya está listo para recibir los datos correctamente.
