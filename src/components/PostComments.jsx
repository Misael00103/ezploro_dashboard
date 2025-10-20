import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { getPostComments, createComment, updateComment, deleteComment } from '../services/postService';
import { getCurrentUserId } from '../services/authService';
import { useToast } from '../hooks/use-toast';

const PostComments = ({ postId, isOpen, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
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
      console.log('Loading comments for postId:', postId);
      const commentsData = await getPostComments(postId);
      console.log('Comments data received:', commentsData);
      setComments(commentsData);
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
      const comment = await createComment({
        post_id: postId,
        content: newComment.trim()
      });
      
      setComments(prev => [comment, ...prev]);
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
        description: "Error al agregar comentario",
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
      setComments(prev => prev.filter(comment => comment.comment_post_id !== commentId));
      
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Error al eliminar comentario",
        variant: "destructive"
      });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-purple-500/30 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
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
            ✕
          </Button>
        </div>

        {/* Add Comment */}
        <div className="p-4 border-b border-purple-500/30">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            comments.map((comment) => (
              <div key={comment.comment_post_id} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={comment.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.display_name || comment.user?.username || 'User')}&background=7c3aed&color=fff&size=32`}
                      alt={comment.user?.username || 'User'}
                    />
                    <AvatarFallback className="bg-purple-600 text-white text-sm">
                      {(comment.user?.display_name || comment.user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">
                          {comment.user?.display_name || comment.user?.username || 'Usuario'}
                        </span>
                        <span className="text-xs text-purple-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.comment_post_id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-purple-200 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComments;