import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ContactsManager = ({ contacts = [], updateContacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();
  
  console.log('ContactsManager received contacts:', contacts);
  
  // Ensure contacts is always an array
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const filteredContacts = safeContacts.filter(contact => {
    if (!contact) return false;
    
    const name = contact.name || '';
    const email = contact.email || '';
    const message = contact.message || '';
    const status = contact.status || 'pending';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (contactId, newStatus) => {
    if (updateContacts) {
      updateContacts(contactId, newStatus);
    }
    
    toast({
      title: "Estado actualizado",
      description: `Mensaje marcado como ${newStatus === 'read' ? 'leído' : 'no leído'}`,
    });
  };

  const handleDelete = (contactId) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    updateContacts(updatedContacts);
    
    toast({
      title: "Mensaje eliminado",
      description: "El mensaje se ha eliminado exitosamente",
    });
  };

  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
    
    // Mark as read when viewing
    if (contact.status === 'unread') {
      handleStatusChange(contact.id, 'read');
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = safeContacts.filter(contact => contact && (contact.status === 'unread' || contact.status === 'pending')).length;
  const newsletterCount = safeContacts.filter(contact => contact && contact.newsletter).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Contactos</h2>
          <p className="text-purple-300">Administra los mensajes de contacto de los usuarios</p>
        </div>
        <div className="flex space-x-4">
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-purple-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Sin leer</p>
                <p className="text-xl font-bold text-white">{unreadCount}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-purple-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Newsletter</p>
                <p className="text-xl font-bold text-white">{newsletterCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-purple-200">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o mensaje..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-200">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/30">
                  <SelectItem value="all" className="text-white hover:bg-purple-900/50">Todos</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-purple-900/50">Pendientes</SelectItem>
                  <SelectItem value="read" className="text-white hover:bg-purple-900/50">Leídos</SelectItem>
                  <SelectItem value="resolved" className="text-white hover:bg-purple-900/50">Resueltos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.map(contact => (
          <Card key={contact.contact_id || contact.id} className={`bg-black/40 border-purple-500/30 transition-all hover:bg-black/60 ${(contact.status === 'unread' || contact.status === 'pending') ? 'border-red-500/50' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-purple-400" />
                      <span className="font-semibold text-white">{contact.name}</span>
                    </div>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status === 'resolved' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resuelto
                        </>
                      ) : contact.status === 'read' ? (
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
                      <Badge variant="secondary" className="bg-blue-900/50 text-blue-200">
                        Newsletter
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-purple-300">{contact.email}</p>
                    <p className="text-purple-200 line-clamp-2">
                      {contact.message.length > 100 
                        ? `${contact.message.substring(0, 100)}...` 
                        : contact.message}
                    </p>
                  </div>

                  <p className="text-xs text-purple-400">
                    Recibido: {formatDate(contact.created_at)}
                  </p>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(contact)}
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(contact.id, contact.status === 'read' ? 'unread' : 'read')}
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    {contact.status === 'read' ? (
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
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(contact.id)}
                    className="text-red-400 hover:bg-red-900/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredContacts.length === 0 && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Mail className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron mensajes</h3>
                <p className="text-purple-300">No hay mensajes que coincidan con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles del Mensaje</DialogTitle>
            <DialogDescription className="text-purple-300">
              Información completa del mensaje de contacto
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-purple-200">Nombre</Label>
                  <p className="text-white">{selectedContact.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-purple-200">Email</Label>
                  <p className="text-white">{selectedContact.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedContact.status)}>
                    {selectedContact.status === 'read' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
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
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-200">
                      Suscrito al newsletter
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Mensaje</Label>
                <Card className="bg-black/50 border-purple-500/30">
                  <CardContent className="pt-4">
                    <p className="text-white whitespace-pre-wrap">{selectedContact.message}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Fecha de recepción</Label>
                <p className="text-purple-300">{formatDate(selectedContact.created_at)}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-purple-300 hover:bg-purple-900/50"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedContact.id, selectedContact.status === 'read' ? 'unread' : 'read')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {selectedContact.status === 'read' ? 'Marcar como no leído' : 'Marcar como leído'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsManager;