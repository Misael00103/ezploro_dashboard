import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Reply,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCurrentUserId } from '../services/authService';
import { 
  getEventComments, 
  createEventComment, 
  updateEventComment, 
  deleteEventComment,
  getCommentReplies,
  createCommentReply 
} from '../services/commentService';

const EventCommentsManager = ({ eventId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getEventComments(eventId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Error al cargar comentarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setIsLoading(true);
      const commentData = {
        text: newComment,
        images: newImages
      };
      
      const response = await createEventComment(eventId, commentData);
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      setNewImages([]);
      toast.success('Comentario creado');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Error al crear comentario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Máximo 5 imágenes permitidas');
      return;
    }
    setNewImages(files);
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) {
      toast.error('La respuesta no puede estar vacía');
      return;
    }

    try {
      setIsLoading(true);
      const replyData = {
        userId: currentUserId,
        commentId: commentId,
        eventId: eventId,
        text: replyText
      };
      
      await createCommentReply(replyData);
      setReplyingTo(null);
      setReplyText('');
      toast.success('Respuesta enviada');
      loadComments(); // Reload to show new reply
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setIsLoading(true);
      const commentData = {
        text: editText
      };
      
      await updateEventComment(commentId, commentData);
      setEditingComment(null);
      setEditText('');
      toast.success('Comentario actualizado');
      loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Error al actualizar comentario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteEventComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar comentario');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-black/90 border-purple-500/30 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Comentarios del Evento</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-white" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* New Comment Form */}
          <div className="space-y-3 border-b border-purple-500/30 pb-4">
            <Textarea
              placeholder="Escribe tu comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-black/50 border-purple-500/30 text-white"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="comment-images"
                />
                <label htmlFor="comment-images">
                  <Button variant="ghost" size="sm" className="text-purple-300">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Imágenes ({newImages.length}/5)
                  </Button>
                </label>
              </div>
              
              <Button 
                onClick={handleCreateComment}
                disabled={isLoading || !newComment.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Comentar
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={comment.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.display_name || comment.user?.name || 'User')}&background=7c3aed&color=fff&size=40`}
                      alt={comment.user?.display_name || comment.user?.name}
                    />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {(comment.user?.display_name || comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">
                        {comment.user?.display_name || comment.user?.name}
                      </span>
                      <span className="text-xs text-purple-300">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-black/50 border-purple-500/30 text-white"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-purple-200 mb-3">{comment.text}</p>
                    )}
                    
                    {/* Comment Images */}
                    {comment.image && comment.image.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {comment.image.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Comment image ${index + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Comment Actions */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-purple-300"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Responder
                      </Button>
                      
                      {comment.user?.id === currentUserId && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditText(comment.text);
                            }}
                            className="text-purple-300"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Escribe tu respuesta..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="bg-black/50 border-purple-500/30 text-white"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReply(comment.id)}>
                            Responder
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && !isLoading && (
              <div className="text-center py-8 text-purple-300">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventCommentsManager;