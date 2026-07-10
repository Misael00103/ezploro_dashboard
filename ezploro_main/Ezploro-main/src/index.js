// src/index.js
import app from "./app.js";
import sequelize from "./db.js";
import initModels from "./models/init-models.js";
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

// Inicializar modelos
const models = initModels(sequelize);

// Exportar modelos para uso en otros archivos
export { models, sequelize };

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    // Verificar migraciones pendientes (trabajo en equipo)
    try {
      const { checkPendingMigrations } = await import('./migrations/migration-tracker.js');
      const pendingMigrations = await checkPendingMigrations();

      if (pendingMigrations.length > 0) {
        console.log('\n⚠️  ATENCIÓN: Hay cambios de base de datos pendientes');
        console.log('   Consulta con tu equipo antes de continuar\n');
      }
    } catch (migrationError) {
      console.log('ℹ️  Sistema de migraciones no disponible (primera vez)');
    }

    // Sincronización temporal para arreglar estructura
    // DESCOMENTA LA LÍNEA DE ABAJO SOLO PARA ARREGLAR PROBLEMAS
    
    //await sequelize.sync({ alter: true }); // ⚠️ USAR SOLO TEMPORALMENTE

    // Las tablas ya existen en la base de datos, no necesitamos sincronizar
    console.log("Models initialized");

    const PORT = process.env.PORT || 3000;
    
    // Crear servidor HTTP para Socket.IO
    const server = createServer(app);
    
    // Configurar Socket.IO
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: false
      }
    });

    // Socket.IO handlers
    io.on('connection', (socket) => {
      console.log('🔌 Usuario conectado:', socket.id);
      
      // Unirse al chat de un evento
      socket.on('join-event-chat', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`👥 Usuario ${socket.id} se unió al chat del evento ${eventId}`);
      });
      
      // Salir del chat de un evento
      socket.on('leave-event-chat', (eventId) => {
        socket.leave(`event-${eventId}`);
        console.log(`👋 Usuario ${socket.id} salió del chat del evento ${eventId}`);
      });
      
      // Unirse al chat personal del usuario
      socket.on('join-user-chat', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 Usuario ${socket.id} se unió a su chat personal ${userId}`);
      });
      
      // Mensaje privado enviado
      socket.on('private-message-sent', (data) => {
        console.log(`💬 Mensaje privado enviado:`, data);
        // Notificar a ambos usuarios
        socket.to(`user-${data.senderId}`).emit('new-message', data);
        socket.to(`user-${data.receiverId}`).emit('new-message', data);
        // Notificar actualización de chat
        socket.to(`user-${data.senderId}`).emit('chat-update', { type: 'private', ...data });
        socket.to(`user-${data.receiverId}`).emit('chat-update', { type: 'private', ...data });
      });
      
      // Mensaje de evento enviado
      socket.on('event-message-sent', (data) => {
        console.log(`📢 Mensaje de evento enviado:`, data);
        // Notificar a todos en el evento
        socket.to(`event-${data.eventId}`).emit('new-message', data);
        // Notificar actualización de chat
        socket.to(`event-${data.eventId}`).emit('chat-update', { type: 'event', ...data });
      });
      
      // Mensaje de grupo enviado
      socket.on('group-message-sent', (data) => {
        console.log(`👥 Mensaje de grupo enviado:`, data);
        // Notificar a todos en el grupo
        socket.to(`group-${data.groupId}`).emit('new-message', data);
        // Notificar actualización de chat
        socket.to(`group-${data.groupId}`).emit('chat-update', { type: 'group', ...data });
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Usuario desconectado:', socket.id);
      });
    });

    // Usar server.listen en lugar de app.listen
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API running on port ${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Para verificar esquema: npm run check-schema`);
      console.log(`🔌 Socket.IO habilitado`);
    });

  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

connectDB(); 