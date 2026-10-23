import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  getEventInvitedUsers, 
  inviteUsersToEvent, 
  removeEventGuest, 
  searchUsersToInvite 
} from '../services/eventService';
import { UserPlus, Trash2, Search, X, Users, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EventGuestManagerModal = ({ eventId, eventTitle = 'Evento Privado', isOpen, onClose, onGuestsUpdated }) => {
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchInvitedUsers();
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, eventId]);

  const fetchInvitedUsers = async () => {
    try {
      setLoading(true);
      // Intentar primero con apiClient axios
      let users = [];
      try {
        const res = await apiClient.get(`/events/${eventId}/invited-users`);
        users = res.data?.allowed_users || res.data?.users || res.data || [];
      } catch (axiosErr) {
        // Fallback al servicio con fetchWithAuth
        users = await getEventInvitedUsers(eventId);
      }
      setInvitedUsers(Array.isArray(users) ? users : []);
      if (onGuestsUpdated) {
        onGuestsUpdated(Array.isArray(users) ? users : []);
      }
    } catch (e) {
      console.error('Error al cargar invitados:', e);
      toast.error('No se pudo cargar la lista de invitados');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      let results = [];
      try {
        const res = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
        results = res.data?.users || res.data?.data || res.data || [];
      } catch (axiosErr) {
        results = await searchUsersToInvite(query);
      }
      
      // Filtrar usuarios que ya estén en la lista de invitados
      const invitedIds = new Set(invitedUsers.map(u => String(u.id || u.user_id)));
      const filtered = (Array.isArray(results) ? results : []).filter(
        u => !invitedIds.has(String(u.id || u.user_id))
      );
      
      setSearchResults(filtered);
    } catch (e) {
      console.error('Error al buscar usuarios:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddGuest = async (userId) => {
    try {
      setLoading(true);
      try {
        await apiClient.post(`/events/${eventId}/invite`, { user_ids: [String(userId)] });
      } catch (axiosErr) {
        await inviteUsersToEvent(eventId, [String(userId)]);
      }
      
      toast.success('Usuario invitado exitosamente');
      setSearchQuery('');
      setSearchResults([]);
      await fetchInvitedUsers();
    } catch (e) {
      console.error('Error al invitar usuario:', e);
      toast.error(e.response?.data?.message || 'Error al invitar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuest = async (userId) => {
    if (!window.confirm('¿Deseas revocar el acceso a este usuario?')) return;
    try {
      setLoading(true);
      try {
        await apiClient.delete(`/events/${eventId}/invite/${userId}`);
      } catch (axiosErr) {
        await removeEventGuest(eventId, userId);
      }
      
      toast.success('Acceso de invitado revocado');
      await fetchInvitedUsers();
    } catch (e) {
      console.error('Error al remover invitado:', e);
      toast.error(e.response?.data?.message || 'Error al remover invitado.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">Invitados al Evento Privado</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{eventTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador de usuarios para agregar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o username para invitar..."
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 absolute right-3.5 top-3.5 text-indigo-400 animate-spin" />
          )}
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto mb-4 bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 shadow-inner">
            <div className="px-3 py-1.5 bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Resultados ({searchResults.length})
            </div>
            {searchResults.map((u) => {
              const uId = u.id || u.user_id;
              const displayName = u.display_name || u.name || u.username;
              const username = u.username ? `@${u.username}` : '';
              return (
                <div key={uId} className="flex items-center justify-between p-3 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                      {displayName.substring(0, 2)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm text-slate-200 font-medium truncate">{displayName}</p>
                      {username && <p className="text-xs text-slate-500 truncate">{username}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddGuest(uId)}
                    disabled={loading}
                    className="ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invitar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista de Invitados Actuales */}
        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Invitados Confirmados ({invitedUsers.length})
            </span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 custom-scrollbar pr-1">
            {invitedUsers.length === 0 && !loading ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-40" />
                <p className="text-xs text-slate-400">No hay invitados agregados aún.</p>
                <p className="text-[11px] text-slate-500 mt-1">Busca usuarios por nombre o username arriba para autorizar acceso.</p>
              </div>
            ) : (
              invitedUsers.map((guest) => {
                const guestId = guest.id || guest.user_id;
                const guestName = guest.display_name || guest.name || guest.username || 'Usuario Invitado';
                const guestUser = guest.username ? `@${guest.username}` : (guest.email || '');
                return (
                  <div key={guestId} className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/40 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                        {guestName.substring(0, 2)}
                      </div>
                      <div className="truncate">
                        <span className="text-sm text-white font-medium block truncate">{guestName}</span>
                        {guestUser && <span className="text-xs text-slate-500 block truncate">{guestUser}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuest(guestId)}
                      disabled={loading}
                      title="Revocar acceso"
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1 text-purple-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acceso privado restringido por ID
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventGuestManagerModal;
