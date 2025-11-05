import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageCircle, Send, Trash2, Edit, Reply, X } from 'lucide-react';
import { getPostComments, createComment, updateComment, deleteComment } from '../services/postService';
import { getCurrentUserId } from '../services/authService';
import { useToast } from '../hooks/use-toast';

const PostComments = ({ postId, isOpen, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getPostComments(postId);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Error al cargar comentarios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await createComment({
        post_id: postId,
        content: newComment.trim()
      });
      
      // Recargar comentarios después de crear para evitar duplicados
      await loadComments();
      setNewComment('');
      onCommentAdded && onCommentAdded();
      
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se ha publicado exitosamente",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error.message || "Error al agregar comentario",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.comment_post_id || comment.comment_id);
    setEditContent(comment.content);
    setReplyingToCommentId(null); // Cancelar reply si está activo
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await updateComment(commentId, editContent.trim());
      
      // Recargar comentarios después de actualizar
      await loadComments();
      setEditingCommentId(null);
      setEditContent('');
      
      toast({
        title: "Comentario actualizado",
        description: "El comentario se ha actualizado exitosamente",
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar comentario",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    try {
      await deleteComment(commentId);
      
      // Recargar comentarios después de eliminar
      await loadComments();
      
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar comentario",
        variant: "destructive"
      });
    }
  };

  const handleStartReply = (commentId) => {
    setReplyingToCommentId(commentId);
    setReplyContent('');
    setEditingCommentId(null); // Cancelar edición si está activa
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "La respuesta no puede estar vacía",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Nota: La funcionalidad de replies para comentarios de posts aún no está implementada en el backend
      // Cuando se implemente, usar aquí el servicio correspondiente
      toast({
        title: "Información",
        description: "La funcionalidad de replies estará disponible pronto",
      });
      
      setReplyingToCommentId(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar respuesta",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCommentOwner = (comment) => {
    if (!currentUserId || !comment) return false;
    const commentUserId = comment.user_id || comment.user?.user_id;
    return String(commentUserId) === String(currentUserId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-purple-500/30 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Comentarios</h3>
            <span className="text-sm text-purple-300">({comments.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-purple-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Comment */}
        <div className="p-4 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex space-x-3">
            <Input
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-black/50 border-purple-500/30 text-white flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-purple-300 mt-2">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <p className="text-purple-300">No hay comentarios aún</p>
              <p className="text-sm text-purple-400">¡Sé el primero en comentar!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isEditing = editingCommentId === (comment.comment_post_id || comment.comment_id);
              const isReplying = replyingToCommentId === (comment.comment_post_id || comment.comment_id);
              const isOwner = isCommentOwner(comment);
              
              return (
                <div key={comment.comment_post_id || comment.comment_id} className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage 
                        src={comment.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.display_name || comment.user?.username || 'User')}&background=7c3aed&color=fff&size=32`}
                        alt={comment.user?.username || 'User'}
                      />
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {(comment.user?.display_name || comment.user?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {comment.user?.display_name || comment.user?.username || 'Usuario'}
                          </span>
                          <span className="text-xs text-purple-400">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        {isOwner && (
                          <div className="flex space-x-1">
                            {!isEditing && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(comment)}
                                  className="h-6 w-6 p-0 text-purple-400 hover:text-purple-300"
                                  title="Editar comentario"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.comment_post_id || comment.comment_id)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                  title="Eliminar comentario"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-black/50 border-purple-500/30 text-white"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(comment.comment_post_id || comment.comment_id)}
                              disabled={!editContent.trim() || isSubmitting}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="text-purple-300 hover:bg-purple-900/50"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-purple-200 leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                          
                          {/* Reply button */}
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartReply(comment.comment_post_id || comment.comment_id)}
                              className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                          </div>
                          
                          {/* Reply input */}
                          {isReplying && (
                            <div className="mt-3 ml-4 space-y-2 border-l-2 border-purple-500/30 pl-3">
                              <Textarea
                                placeholder="Escribe una respuesta..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="bg-black/50 border-purple-500/30 text-white"
                                rows={2}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitReply(comment.comment_post_id || comment.comment_id)}
                                  disabled={!replyContent.trim() || isSubmitting}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Enviar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelReply}
                                  className="text-purple-300 hover:bg-purple-900/50"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Replies display (cuando se implemente en el backend) */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 ml-4 space-y-2 border-l-2 border-purple-500/30 pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.comment_reply_id || reply.id} className="bg-black/20 rounded p-2">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-medium text-white">
                                      {reply.user?.display_name || reply.user?.name || 'Usuario'}
                                    </span>
                                    <span className="text-xs text-purple-400">
                                      {formatDate(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-purple-200">{reply.text || reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComments;
