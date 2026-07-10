import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Mail,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  MessageCircle,
  Reply,
  User,
  Loader2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { replyContact, deleteContact } from '../services/contactService';

const ContactsManager = ({ contacts = [], updateContacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isAutoReplying, setIsAutoReplying] = useState(false);
  const { toast } = useToast();
  
  console.log('ContactsManager received contacts:', contacts);
  
  // Ensure contacts is always an array
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const getContactIdentifier = (contact) => contact?.contact_us_id ?? contact?.contact_id ?? contact?.id ?? null;
  const getContactLookupKey = (contact) => {
    const identifier = getContactIdentifier(contact);
    if (identifier) return String(identifier);
    return `${contact?.email || ''}|${contact?.name || ''}|${contact?.message || ''}`;
  };
  const deduplicatedContacts = safeContacts.filter((contact, index, array) => {
    const lookupKey = getContactLookupKey(contact);
    return array.findIndex((item) => getContactLookupKey(item) === lookupKey) === index;
  });
  const getContactStatus = (contact) => {
    const rawStatus = contact?.status || contact?.state || contact?.current_status || contact?.status_label || contact?.is_read;
    const normalized = String(rawStatus ?? '').trim().toLowerCase();

    if (!normalized) return 'pending';
    if (['read', 'leído', 'leido', 'seen', 'viewed'].includes(normalized)) return 'read';
    if (['resolved', 'resuelto', 'closed', 'answered', 'responded', 'complete', 'completed'].includes(normalized)) return 'resolved';
    if (['unread', 'pending', 'pendiente', 'new', 'nuevo', 'received', 'recibido', 'sin leer', 'sin_leer'].includes(normalized)) return 'pending';

    return 'pending';
  };
  const getContactMessage = (contact) => contact?.message || contact?.body || contact?.content || contact?.text || contact?.description || '';
  const getContactDate = (contact) => contact?.created_at || contact?.createdAt || contact?.received_at || contact?.timestamp || contact?.date || contact?.sent_at || contact?.updated_at || null;

  const buildReplyText = (contact) => {
    const name = contact?.name || 'Usuario';
    const message = getContactMessage(contact);
    const date = formatDate(getContactDate(contact));
    
    return `Estimado/a ${name},

Agradecemos sinceramente que te hayas puesto en contacto con nosotros en Ezploro. Hemos recibido tu consulta del día ${date} con éxito.

Detalles del mensaje recibido:
--------------------------------------------------
"${message}"
--------------------------------------------------

Un miembro de nuestro equipo está revisando tu caso y se pondrá en contacto contigo a la brevedad.

Atentamente,
El Equipo de Ezploro
https://ezploro.com`;
  };

  useEffect(() => {
    if (selectedContact) {
      setReplyText(buildReplyText(selectedContact));
    }
  }, [selectedContact]);

  const filteredContacts = deduplicatedContacts.filter(contact => {
    if (!contact) return false;
    
    const name = contact.name || '';
    const email = contact.email || '';
    const message = getContactMessage(contact);
    const status = getContactStatus(contact);
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (contactId, newStatus) => {
    if (!contactId) return;

    if (updateContacts) {
      updateContacts(contactId, newStatus);
    }
    
    toast({
      title: "Estado actualizado",
      description: `Mensaje marcado como ${newStatus === 'read' ? 'leído' : 'no leído'}`,
    });
  };

  const handleDelete = async (contactId) => {
    try {
      await deleteContact(contactId);
      const updatedContacts = deduplicatedContacts.filter(contact => getContactIdentifier(contact) !== contactId);
      if (updateContacts) {
        updateContacts(updatedContacts);
      }
      
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error al eliminar mensaje de contacto:', error);
      toast({
        title: "No se pudo eliminar el mensaje",
        description: error?.message || "Ocurrió un error en el servidor al intentar eliminar.",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (contact) => {
    const contactId = getContactIdentifier(contact);
    const email = contact?.email;

    if (!contactId) {
      toast({
        title: 'Contacto inválido',
        description: 'No se pudo identificar el mensaje para responder.',
      });
      return;
    }

    if (!email) {
      toast({
        title: 'Sin correo asociado',
        description: 'Este contacto no tiene un email válido para responder.',
      });
      return;
    }

    const message = replyText.trim() || buildReplyText(contact);
    const subject = `Re: ${contact?.name ? `Mensaje de ${contact.name}` : 'Consulta recibida'}`;

    try {
      const result = await replyContact(contactId, {
        email,
        subject,
        message,
        name: contact?.name || '',
      });

      if (result?.ok) {
        if (getContactStatus(contact) !== 'resolved') {
          handleStatusChange(contactId, 'resolved');
        }

        toast({
          title: 'Respuesta enviada',
          description: 'La respuesta se ha enviado correctamente desde la API.',
        });
        return;
      }

      const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;

      if (getContactStatus(contact) !== 'resolved') {
        handleStatusChange(contactId, 'resolved');
      }

      toast({
        title: 'Respuesta preparada',
        description: 'El backend no expone un endpoint de respuesta, así que se abrió tu cliente de correo.',
      });
    } catch (error) {
      console.error('Error al responder contacto:', error);
      toast({
        title: 'No se pudo enviar la respuesta',
        description: error?.message || 'El backend no aceptó la solicitud de respuesta.',
      });
    }
  };

  const handleAutoReplyAllPending = async () => {
    const pendingContacts = deduplicatedContacts.filter(
      contact => getContactStatus(contact) === 'pending'
    );

    if (pendingContacts.length === 0) {
      toast({
        title: "Sin mensajes pendientes",
        description: "Todos los mensajes ya han sido respondidos.",
      });
      return;
    }

    try {
      setIsAutoReplying(true);
      toast({
        title: "Iniciando auto-respuestas",
        description: `Procesando ${pendingContacts.length} mensajes pendientes...`,
      });

      let successCount = 0;
      for (const contact of pendingContacts) {
        const contactId = getContactIdentifier(contact);
        const email = contact?.email;
        if (!contactId || !email) continue;

        const message = buildReplyText(contact);
        const subject = `Re: ${contact?.name ? `Mensaje de ${contact.name}` : 'Consulta recibida'}`;

        try {
          const result = await replyContact(contactId, {
            email,
            subject,
            message,
            name: contact?.name || '',
          });

          if (result?.ok) {
            successCount++;
            handleStatusChange(contactId, 'resolved');
          }
        } catch (err) {
          console.error(`Error auto-replying to message ${contactId}:`, err);
        }
      }

      toast({
        title: "Proceso completado",
        description: `Se enviaron ${successCount} respuestas automáticas correctamente.`,
      });
    } catch (error) {
      console.error("Error in handleAutoReplyAllPending:", error);
      toast({
        title: "Error al procesar",
        description: "Ocurrió un error inesperado al enviar las respuestas automáticas.",
        variant: "destructive",
      });
    } finally {
      setIsAutoReplying(false);
    }
  };

  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
    
    // Mark as read when viewing
    if (getContactStatus(contact) === 'pending') {
      handleStatusChange(getContactIdentifier(contact), 'read');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read':
        return 'bg-blue-900/50 text-blue-200 border-blue-600/30';
      case 'resolved':
        return 'bg-green-900/50 text-green-200 border-green-600/30';
      case 'pending':
      default:
        return 'bg-yellow-900/50 text-yellow-200 border-yellow-600/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';

    const parsedDate = dateString instanceof Date ? dateString : new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return 'Sin fecha';

    return parsedDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = deduplicatedContacts.filter(contact => contact && (getContactStatus(contact) === 'unread' || getContactStatus(contact) === 'pending')).length;
  const newsletterCount = deduplicatedContacts.filter(contact => contact && contact.newsletter).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Contactos</h2>
          <p className="text-purple-300">Administra los mensajes de contacto de los usuarios</p>
        </div>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <Button
              onClick={handleAutoReplyAllPending}
              disabled={isAutoReplying}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/30 shadow-lg shadow-purple-900/20"
            >
              {isAutoReplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Auto-respondiendo...
                </>
              ) : (
                <>
                  <Reply className="h-4 w-4 mr-2" />
                  Auto-responder pendientes ({unreadCount})
                </>
              )}
            </Button>
          )}
          <Card className="glass-panel px-4 py-2 border-zinc-800/50">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-violet-400" />
              <div className="text-center">
                <p className="text-xs text-zinc-400">Sin leer</p>
                <p className="text-lg font-bold text-white">{unreadCount}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-panel px-4 py-2 border-zinc-800/50">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-violet-400" />
              <div className="text-center">
                <p className="text-xs text-zinc-400">Newsletter</p>
                <p className="text-lg font-bold text-white">{newsletterCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-panel border-zinc-800/50 shadow-lg shadow-black/20">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o mensaje..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800/50 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800/60">
                  <SelectItem value="all" className="text-white focus:bg-zinc-900">Todos</SelectItem>
                  <SelectItem value="pending" className="text-white focus:bg-zinc-900">Pendientes</SelectItem>
                  <SelectItem value="read" className="text-white focus:bg-zinc-900">Leídos</SelectItem>
                  <SelectItem value="resolved" className="text-white focus:bg-zinc-900">Resueltos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.map((contact, index) => (
          <Card 
            key={contact.contact_us_id || contact.contact_id || contact.id || index} 
            className={`glass-panel-interactive border-zinc-800/50 ${(getContactStatus(contact) === 'pending') ? 'border-amber-500/20' : ''}`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-violet-400" />
                      <span className="font-semibold text-white">{contact.name}</span>
                    </div>
                    <Badge className={getStatusColor(getContactStatus(contact))}>
                      {getContactStatus(contact) === 'resolved' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resuelto
                        </>
                      ) : getContactStatus(contact) === 'read' ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Leído
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                    {contact.newsletter && (
                      <Badge variant="secondary" className="bg-blue-950/50 text-blue-300 border border-blue-800/30">
                        Newsletter
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-zinc-400">{contact.email}</p>
                    <p className="text-zinc-200 line-clamp-2">
                      {getContactMessage(contact).length > 100 
                        ? `${getContactMessage(contact).substring(0, 100)}...` 
                        : getContactMessage(contact)}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-500">
                    Recibido: {formatDate(getContactDate(contact))}
                  </p>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(contact)}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReply(contact)}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                  </Button>

                  {getContactStatus(contact) !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusChange(getContactIdentifier(contact), getContactStatus(contact) === 'read' ? 'unread' : 'read')}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                    >
                      {getContactStatus(contact) === 'read' ? (
                        <>
                          <Clock className="h-4 w-4 mr-1" />
                          No leído
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Leído
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(getContactIdentifier(contact))}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredContacts.length === 0 && (
          <Card className="glass-panel border-zinc-800/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Mail className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron mensajes</h3>
                <p className="text-zinc-400">No hay mensajes que coincidan con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="bg-zinc-950/95 border-zinc-800/60 text-white max-w-2xl backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles del Mensaje</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Información completa del mensaje de contacto
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nombre</Label>
                  <p className="text-white font-medium">{selectedContact.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <p className="text-white font-medium">{selectedContact.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(getContactStatus(selectedContact))}>
                    {getContactStatus(selectedContact) === 'resolved' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resuelto
                      </>
                    ) : getContactStatus(selectedContact) === 'read' ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Leído
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Sin leer
                      </>
                    )}
                  </Badge>
                  {selectedContact.newsletter && (
                    <Badge variant="secondary" className="bg-blue-950/50 text-blue-300 border border-blue-800/30">
                      Suscrito al newsletter
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Mensaje</Label>
                <Card className="bg-zinc-900/50 border-zinc-800/50">
                  <CardContent className="pt-4">
                    <p className="text-white whitespace-pre-wrap">{getContactMessage(selectedContact)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Respuesta</Label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Escribe tu respuesta para este contacto..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Fecha de recepción</Label>
                <p className="text-zinc-300">{formatDate(getContactDate(selectedContact))}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleReply(selectedContact)}
                  className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white"
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Responder
                </Button>
                {getContactStatus(selectedContact) !== 'resolved' && (
                  <Button
                    onClick={() => handleStatusChange(getContactIdentifier(selectedContact), getContactStatus(selectedContact) === 'read' ? 'unread' : 'read')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                  >
                    {getContactStatus(selectedContact) === 'read' ? 'Marcar como no leído' : 'Marcar como leído'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsManager;