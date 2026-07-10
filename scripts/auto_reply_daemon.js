/**
 * Daemon Script - Ezploro Auto-responder
 * 
 * Este script consulta continuamente el backend cada 10 segundos buscando mensajes
 * de contacto en estado 'pending' (Pendientes) y les envía una respuesta automática.
 * 
 * Para correr de forma persistente en producción:
 *   pm2 start scripts/auto_reply_daemon.js --name "ezploro-auto-responder"
 */

const https = require('https');

const API_BASE = 'api-v5-backend-ezploro.apps.ezploro.com';

// Formatea el mensaje con el estilo premium acordado
const buildReplyText = (contact) => {
  const name = contact.name || 'Usuario';
  const message = contact.message || contact.body || contact.content || contact.text || '';
  
  let formattedDate = 'Sin fecha';
  if (contact.created_at) {
    try {
      const parsedDate = new Date(contact.created_at);
      if (!Number.isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      // Ignorar errores de parseo
    }
  }

  return `Estimado/a ${name},

Agradecemos sinceramente que te hayas puesto en contacto con nosotros en Ezploro. Hemos recibido tu consulta del día ${formattedDate} con éxito.

Detalles del mensaje recibido:
--------------------------------------------------
"${message}"
--------------------------------------------------

Un miembro de nuestro equipo está revisando tu caso y se pondrá en contacto contigo a la brevedad.

Atentamente,
El Equipo de Soporte de Ezploro
https://ezploro.com`;
};

// Helper genérico para peticiones HTTP
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

// Proceso principal del demonio
const processPendingMessages = async () => {
  console.log(`[${new Date().toISOString()}] Buscando mensajes de contacto pendientes...`);
  try {
    // 1. Obtener mensajes recientes (límite de 50)
    const listRes = await makeRequest({
      hostname: API_BASE,
      port: 443,
      path: '/api/contact-us/messages?limit=50',
      method: 'GET'
    });

    if (listRes.statusCode !== 200 || !listRes.data || !listRes.data.success) {
      console.error('Error al listar mensajes:', listRes.statusCode, listRes.data);
      return;
    }

    const messages = listRes.data.data?.messages || [];
    const pendingMessages = messages.filter(m => m.status === 'pending');

    if (pendingMessages.length === 0) {
      console.log('No hay mensajes nuevos pendientes de respuesta.');
      return;
    }

    console.log(`Se encontraron ${pendingMessages.length} mensajes pendientes. Procesando respuestas...`);

    for (const msg of pendingMessages) {
      const contactId = msg.contact_us_id || msg.id;
      const email = msg.email;

      if (!contactId || !email) {
        console.warn(`Mensaje omitido (sin ID o sin correo):`, msg);
        continue;
      }

      console.log(`Auto-respondiendo a: ${msg.name || 'Usuario'} <${email}> (ID: ${contactId})`);

      const replyContent = buildReplyText(msg);
      const payload = {
        email: email,
        subject: `Re: ${msg.name ? `Mensaje de ${msg.name}` : 'Consulta recibida'}`,
        message: replyContent,
        name: msg.name || ''
      };

      // 2. Enviar respuesta vía POST
      const replyRes = await makeRequest({
        hostname: API_BASE,
        port: 443,
        path: `/api/contact/messages/${contactId}/reply`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, payload);

      if (replyRes.statusCode === 200 || replyRes.statusCode === 201 || (replyRes.data && replyRes.data.success)) {
        console.log(`✅ Respuesta enviada correctamente para ID: ${contactId}`);

        // 3. Actualizar estado a 'responded'
        const statusRes = await makeRequest({
          hostname: API_BASE,
          port: 443,
          path: `/api/contact-us/messages/${contactId}/status`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }, { status: 'responded' });

        if (statusRes.statusCode === 200 || (statusRes.data && statusRes.data.success)) {
          console.log(`✅ Estado actualizado a 'responded' para ID: ${contactId}`);
        } else {
          console.error(`❌ Error al actualizar estado para ID: ${contactId}`, statusRes.statusCode, statusRes.data);
        }
      } else {
        console.error(`❌ Error al enviar respuesta para ID: ${contactId}`, replyRes.statusCode, replyRes.data);
      }
    }
  } catch (err) {
    console.error('Error durante el ciclo de procesamiento:', err);
  }
};

// Ejecución periódica cada 10 segundos
const intervalMs = 10000;
console.log(`Demonio de auto-respuesta iniciado. Intervalo: ${intervalMs / 1000} segundos.`);
processPendingMessages(); // Primera ejecución inmediata
setInterval(processPendingMessages, intervalMs);
