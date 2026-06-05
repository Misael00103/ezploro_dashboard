// components/PostsManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Plus, Edit, Trash2, Heart, MessageCircle, Search, Eye, Image as ImageIcon,
  Reply, Send, X, Loader2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  createPost, updatePost, deletePost, getAllPosts, togglePostLike,
  getPostComments, createPostComment, updatePostComment, deletePostComment,
  getCommentReplies, createCommentReply, updatePostReply, deletePostReply
} from '../services/postService';
import { getCurrentUserId } from '../services/authService';

// === COMPONENTE: Comentario con replies ===
const CommentItem = ({ comment, postId, currentUserId, depth = 0, onCommentChange, isReply = false }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text || comment.content);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Determinar si es el dueño del comentario/reply
  const isOwner = () => {
    if (!currentUserId || !comment) return false;
    const commentUserId = comment.user_id || comment.user?.user_id || comment.user?.id;
    return String(commentUserId) === String(currentUserId);
  };

  const handleLike = async () => {
    setLoading(true);
    try {
      // Usar el endpoint de likes de posts, pero con el comment_id
      const commentId = comment.comment_post_id || comment.id;
      await togglePostLike(commentId);
      onCommentChange(); // Recargar comentarios para actualizar el contador
      toast({ title: "Like actualizado" });
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
      toast({ title: "Error", description: "Error al dar like", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
 
  const handleReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await createCommentReply({
        postId,
        commentId: comment.id || comment.comment_post_id,
        text: replyText
      });
      setReplyText('');
      setReplying(false);
      onCommentChange();
      toast({ title: "Respuesta enviada" });
    } catch {
      toast({ title: "Error", description: "No se pudo responder", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setLoading(true);
    try {
      if (isReply) {
        // Es un reply, usar función de reply
        // El backend devuelve reply_post_comment_id como el ID de la reply
        const replyId = comment.reply_post_comment_id || comment.reply_id || comment.id;
        await updatePostReply(replyId, { text: editText });
      } else {
        // Es un comentario principal
        await updatePostComment(comment.id || comment.comment_post_id, { text: editText });
      }
      comment.text = editText;
      comment.content = editText;
      setEditing(false);
      toast({ title: "Editado" });
    } catch {
      toast({ title: "Error", description: "Error al editar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar ' + (isReply ? 'respuesta' : 'comentario') + '?')) return;
    setLoading(true);
    try {
      if (isReply) {
        // Es un reply, usar función de reply
        // El backend devuelve reply_post_comment_id como el ID de la reply
        const replyId = comment.reply_post_comment_id || comment.reply_id || comment.id;
        console.log('🗑️ Intentando eliminar reply:', {
          reply_post_comment_id: comment.reply_post_comment_id,
          reply_id: comment.reply_id,
          id: comment.id,
          usando: replyId,
          comment: comment
        });
        
        if (!replyId) {
          throw new Error('No se pudo obtener el ID de la respuesta');
        }
        
        await deletePostReply(replyId);
      } else {
        // Es un comentario principal
        const commentId = comment.id || comment.comment_post_id;
        console.log('🗑️ Eliminando comentario con ID:', commentId);
        await deletePostComment(commentId);
      }
      onCommentChange();
      toast({ title: "Eliminado" });
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({ title: "Error", description: error.message || "Error al eliminar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-purple-500/30 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={comment.user?.profile_picture} />
          <AvatarFallback className="bg-purple-600 text-white text-xs">
            {(comment.user?.display_name || 'U').charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-white">{comment.user?.display_name}</span>
            <span className="text-purple-400">
              {new Date(comment.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={loading}>Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-purple-200 text-sm">{comment.text || comment.content}</p>
          )}

          {comment.image?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {comment.image.map((img, i) => (
                <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          )}

          <div className="flex gap-3 text-xs">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              disabled={loading}
              className="text-purple-300 hover:text-red-400 p-0 h-auto"
            >
              <Heart className="h-3.5 w-3.5 mr-1" /> {comment.likes_count || 0}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReplying(!replying)} className="text-purple-300 p-0 h-auto">
              <Reply className="h-3.5 w-3.5 mr-1" /> Responder
            </Button>
            {(comment.user?.id === currentUserId || isOwner()) && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-purple-300 p-0 h-auto">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 p-0 h-auto">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {replying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={loading || !replyText.trim()}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Replies anidadas */}
          {comment.replies?.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply, index) => (
                <CommentItem
                  key={`reply-${reply.reply_post_comment_id || reply.reply_id || reply.id}-${comment.id}-${index}`}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onCommentChange={onCommentChange}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// === MODAL DE COMENTARIOS ===
const PostCommentsModal = ({ postId, isOpen, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUserId = getCurrentUserId();
  const { toast } = useToast();

  const loadComments = async () => {
    setLoading(true);
    try {
      const allComments = await getPostComments(postId);
      console.log('📥 Comentarios cargados:', allComments);
      
      if (!allComments || allComments.length === 0) {
        console.log('⚠️ No hay comentarios para este post');
        setComments([]);
        return;
      }
      
      // Normalizar todos los comentarios principales (sin replies)
      const normalizedComments = allComments.map(c => {
        const commentId = c.comment_post_id || c.comment_id || c.id;
        return {
          ...c,
          id: commentId,
          text: c.text || c.content,
          content: c.content || c.text,
          created_at: c.created_at || c.createdAt,
          user_id: c.user_id || c.user?.user_id || c.user?.id,
        };
      });
      
      // Obtener replies para cada comentario principal
      const commentsWithReplies = await Promise.all(
        normalizedComments.map(async (comment) => {
          try {
            const commentId = comment.id || comment.comment_post_id;
            const replies = await getCommentReplies(commentId);
            console.log(`📨 Replies para comentario ${commentId}:`, replies);
            
            // Normalizar replies - asegurar que reply_id esté presente
            const normalizedReplies = replies.map((r, idx) => {
              // El backend puede devolver reply_post_comment_id como el ID de la reply
              const replyId = r.reply_post_comment_id || r.reply_id || r.id;
              console.log(`🔍 Reply ${idx}: reply_post_comment_id=${r.reply_post_comment_id}, reply_id=${r.reply_id}, id=${r.id}, usando=${replyId}`);
              return {
                ...r,
                id: replyId,
                reply_id: replyId, // Asegurar que reply_id esté presente
                reply_post_comment_id: replyId, // También mantener el campo original
                text: r.text || r.content,
                content: r.content || r.text,
                created_at: r.created_at || r.createdAt,
                user_id: r.user_id || r.user?.user_id || r.user?.id,
              };
            });
            
            return {
              ...comment,
              replies: normalizedReplies.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB; // Orden ascendente (más antiguos primero)
              }),
            };
          } catch (error) {
            console.error(`Error obteniendo replies para comentario ${comment.id}:`, error);
            return {
              ...comment,
              replies: [],
            };
          }
        })
      );
      
      console.log('✅ Comentarios con replies:', commentsWithReplies);
      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error en loadComments:', error);
      toast({ title: "Error", description: "No se pudieron cargar comentarios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) loadComments();
  }, [isOpen, postId]);

  const handleCreate = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await createPostComment(postId, { text: newComment, images: newImages });
      setNewComment('');
      setNewImages([]);
      await loadComments();
      onCommentAdded();
      toast({ title: "Comentario enviado" });
    } catch (error) {
      console.error('Error al crear comentario:', error);
      toast({ title: "Error", description: error.message || "Error al comentar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 flex-shrink-0">
          <DialogTitle>Comentarios</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar">
          {/* Nuevo comentario */}
          <div className="space-y-3 border-b border-purple-500/30 pb-4">
            <Textarea
              placeholder="Escribe tu comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-black/50 border-purple-500/30 text-white resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <label>
                <Input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setNewImages(Array.from(e.target.files).slice(0,5))} />
                <Button variant="ghost" size="sm" className="text-purple-300">
                  <ImageIcon className="h-4 w-4 mr-1" /> {newImages.length}/5
                </Button>
              </label>
              <Button onClick={handleCreate} disabled={loading || !newComment.trim()} className="bg-purple-600 hover:bg-purple-700">
                <Send className="h-4 w-4 mr-1" /> Enviar
              </Button>
            </div>
          </div>

          {/* Lista */}
          {loading && comments.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
              <p className="text-purple-300 mt-2">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-purple-300 py-8">Sé el primero en comentar</p>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id || comment.comment_id || comment.comment_post_id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                onCommentChange={loadComments}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// === POSTS MANAGER PRINCIPAL ===
const PostsManager = ({ posts = [], setPosts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', image: null });
  const [localPosts, setLocalPosts] = useState([]);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPosts = async () => {
      try {
        setIsInitialLoading(true);
        const allPosts = await getAllPosts();
        if (isMounted) {
          setLocalPosts(allPosts);
          if (setPosts) setPosts(allPosts);
        }
      } catch (error) {
        if (isMounted) toast({ title: "Error", description: "No se pudieron cargar los posts", variant: "destructive" });
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };
    loadPosts();
    return () => { isMounted = false; };
  }, [setPosts, toast]);

  const postsToShow = posts.length > 0 ? posts : localPosts;

  const filteredPosts = useMemo(() => {
    if (!postsToShow.length) return [];
    return postsToShow.filter(post => {
      const title = post.title?.toLowerCase() || '';
      const description = post.description?.toLowerCase() || '';
      const userName = (post.user?.display_name || post.user?.name || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return title.includes(term) || description.includes(term) || userName.includes(term);
    });
  }, [postsToShow, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', image: null });
    setSelectedPost(null);
  };

  const reloadPosts = async () => {
    try {
      const allPosts = await getAllPosts();
      setLocalPosts(allPosts);
      if (setPosts) setPosts(allPosts);
    } catch (error) {
      console.error('Error recargando posts:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
    setIsActionLoading(true);
    try {
      await createPost(formData);
      await reloadPosts();
      toast({ title: "Éxito", description: "Post creado" });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Error al crear", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setFormData({ title: post.title || '', description: post.description || '', image: null });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await updatePost(selectedPost.post_id || selectedPost.id, formData);
      await reloadPosts();
      toast({ title: "Éxito", description: "Post actualizado" });
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Error al actualizar", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('¿Eliminar este post?')) return;
    setIsActionLoading(true);
    try {
      await deletePost(postId);
      await reloadPosts();
      toast({ title: "Éxito", description: "Post eliminado" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Error al eliminar", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLike = async (postId) => {
    setIsActionLoading(true);
    try {
      const response = await togglePostLike(postId);
      const isLiked = response.liked ?? response.data?.liked ?? true;
      const updateLike = (post) => {
        if ((post.post_id || post.id) !== postId) return post;
        const likes = post.likes_count || 0;
        return { ...post, likes_count: isLiked ? likes + 1 : Math.max(likes - 1, 0), user_liked: isLiked };
      };
      setLocalPosts(prev => prev.map(updateLike));
      if (setPosts) setPosts(prev => prev.map(updateLike));
      await reloadPosts();
      toast({ title: isLiked ? "Te gusta" : "Ya no te gusta" });
    } catch (error) {
      toast({ title: "Error", description: "Error al dar like", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShowComments = (postId) => setActiveCommentsPost(postId);

  const handleCommentAdded = () => {
    if (activeCommentsPost) {
      setLocalPosts(prev => prev.map(p =>
        (p.post_id || p.id) === activeCommentsPost
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      ));
      if (setPosts) setPosts(prev => prev.map(p =>
        (p.post_id || p.id) === activeCommentsPost
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      ));
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="text-purple-300 text-lg">Cargando posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Posts</h2>
          <p className="text-purple-300">Administra el contenido de los usuarios</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2 flex-1 sm:flex-initial">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-purple-200">Total</p>
                <p className="text-xl font-bold text-white">{postsToShow.length}</p>
              </div>
            </div>
          </Card>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Crear Post
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
              <Input
                placeholder="Buscar por título, descripción o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/50 border-purple-500/30 text-white"
              />
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay posts</h3>
              <p className="text-purple-300">
                {searchTerm ? 'No se encontraron resultados.' : 'Aún no hay publicaciones.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <Card key={post.post_id || post.id} className="bg-black/40 border-purple-500/30 overflow-hidden hover:border-purple-500/50 transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden bg-black/20">
                  {post.image ? (
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-purple-400"><svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-purple-400" />
                    </div>
                  )}
                </div>

                  <div className="flex-1 p-4 sm:p-6 space-y-3">
                    <h3 className="font-bold text-white text-lg line-clamp-2">{post.title}</h3>
                    <p className="text-purple-200 text-sm line-clamp-3">
                      {post.description?.length > 180 ? `${post.description.substring(0, 180)}...` : post.description}
                    </p>

                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                      <AvatarImage 
                          src={post.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.display_name || 'U')}&background=7c3aed&color=fff`}
                          onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.display_name || 'U')}&background=7c3aed&color=fff`}
                        />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {(post.user?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium text-white truncate max-w-[150px]">
                          {post.user?.display_name || post.user?.name || 'Anónimo'}
                        </p>
                      <p className="text-xs text-purple-400">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                    <div className="flex items-center gap-6 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.post_id || post.id)}
                        disabled={isActionLoading}
                        className={`p-0 h-auto ${post.user_liked ? 'text-red-400' : 'text-purple-300 hover:text-red-400'}`}
                    >
                      <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                        <span className="ml-1">{post.likes_count || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowComments(post.post_id || post.id)}
                        className="p-0 h-auto text-purple-300 hover:text-blue-400"
                    >
                      <MessageCircle className="h-4 w-4" />
                        <span className="ml-1">{post.comments_count || 0}</span>
                    </Button>
                  </div>
                </div>

                  {currentUserId && (post.user_id === currentUserId || post.user?.user_id === currentUserId) && (
                    <div className="flex sm:flex-col gap-2 p-4 sm:p-6 border-t sm:border-t-0 sm:border-l border-purple-500/20">
                      <Button size="sm" variant="ghost" className="text-purple-300 hover:bg-purple-900/50 p-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(post)} className="text-purple-300 hover:bg-purple-900/50 p-2">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(post.post_id || post.id)}
                        disabled={isActionLoading}
                        className="text-red-400 hover:bg-red-900/50 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                  )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Modales de Posts */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label className="text-purple-200">Título *</Label><Input name="title" value={formData.title} onChange={handleInputChange} className="bg-black/50 border-purple-500/30" required /></div>
            <div><Label className="text-purple-200">Descripción *</Label><Textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="bg-black/50 border-purple-500/30" required /></div>
            <div><Label className="text-purple-200">Imagen</Label><Input type="file" name="image" accept="image/*" onChange={handleInputChange} className="bg-black/50 border-purple-500/30" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-purple-300 hover:bg-purple-900/50">Cancelar</Button>
              <Button type="submit" disabled={isActionLoading} className="bg-gradient-to-r from-purple-600 to-purple-700">
                {isActionLoading ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Editar Post</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label className="text-purple-200">Título *</Label><Input name="title" value={formData.title} onChange={handleInputChange} className="bg-black/50 border-purple-500/30" required /></div>
            <div><Label className="text-purple-200">Descripción *</Label><Textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="bg-black/50 border-purple-500/30" required /></div>
            <div><Label className="text-purple-200">Nueva Imagen</Label><Input type="file" name="image" accept="image/*" onChange={handleInputChange} className="bg-black/50 border-purple-500/30" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-purple-300 hover:bg-purple-900/50">Cancelar</Button>
              <Button type="submit" disabled={isActionLoading} className="bg-gradient-to-r from-purple-600 to-purple-700">
                {isActionLoading ? 'Guardando...' : 'Actualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Comentarios */}
      <PostCommentsModal
        postId={activeCommentsPost}
        isOpen={!!activeCommentsPost}
        onClose={() => setActiveCommentsPost(null)}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default PostsManager;