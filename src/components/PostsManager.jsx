import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  User,
  Search,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { createPost, updatePost, deletePost, getUserPosts, togglePostLike } from '../services/postService';
import { getCurrentUserId } from '../services/userService';
import PostComments from './PostComments';

const PostsManager = ({ posts = [], setPosts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localPosts, setLocalPosts] = useState([]);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Load posts on component mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const userId = getCurrentUserId();
        if (userId) {
          const userPosts = await getUserPosts(userId);
          setLocalPosts(userPosts);
          if (setPosts) {
            setPosts(userPosts);
          }
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };
    
    loadPosts();
  }, [setPosts]);

  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);
  const { toast } = useToast();

  const postsToShow = posts.length > 0 ? posts : localPosts;
  const filteredPosts = postsToShow.filter(post => {
    if (!post) return false;
    const title = post.title || '';
    const description = post.description || '';
    const userName = post.user?.name || post.user?.display_name || '';
    
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleInputChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: null
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Por favor completa el título",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await createPost(formData);
      const newPost = response.data || response;
      
      setLocalPosts(prev => [...prev, newPost]);
      if (setPosts) {
        setPosts(prev => [...prev, newPost]);
      }
      
      toast({
        title: "Post creado",
        description: "El post se ha creado exitosamente",
      });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      description: post.description,
      image: post.image
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const response = await updatePost(selectedPost.post_id || selectedPost.id, formData);
      const updatedPost = response.data || response;
      
      setLocalPosts(prev => prev.map(post =>
        (post.post_id || post.id) === (selectedPost.post_id || selectedPost.id)
          ? { ...post, ...updatedPost }
          : post
      ));
      if (setPosts) {
        setPosts(prev => prev.map(post =>
          (post.post_id || post.id) === (selectedPost.post_id || selectedPost.id)
            ? { ...post, ...updatedPost }
            : post
        ));
      }
      
      toast({
        title: "Post actualizado",
        description: "El post se ha actualizado exitosamente",
      });

      setIsEditModalOpen(false);
      resetForm();
      setSelectedPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deletePost(postId);
      
      setLocalPosts(prev => prev.filter(post => (post.post_id || post.id) !== postId));
      if (setPosts) {
        setPosts(prev => prev.filter(post => (post.post_id || post.id) !== postId));
      }
      
      toast({
        title: "Post eliminado",
        description: "El post se ha eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  const handleLike = async (postId) => {
    try {
      const response = await togglePostLike(postId);
      const isLiked = response.liked;
      
      // Update local state
      const updatePost = (post) => {
        if ((post.post_id || post.id) === postId) {
          return {
            ...post,
            likes_count: isLiked ? (post.likes_count || 0) + 1 : Math.max((post.likes_count || 0) - 1, 0),
            user_liked: isLiked
          };
        }
        return post;
      };
      
      setLocalPosts(prev => prev.map(updatePost));
      if (setPosts) {
        setPosts(prev => prev.map(updatePost));
      }
      
      toast({
        title: isLiked ? "¡Like agregado!" : "Like removido",
        description: isLiked ? "Te gusta este post" : "Ya no te gusta este post",
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Error al dar like al post",
        variant: "destructive"
      });
    }
  };

  const handleShowComments = (postId) => {
    setActiveCommentsPost(postId);
  };

  const handleCommentAdded = () => {
    // Update comments count
    if (activeCommentsPost) {
      const updatePost = (post) => {
        if ((post.post_id || post.id) === activeCommentsPost) {
          return { ...post, comments_count: (post.comments_count || 0) + 1 };
        }
        return post;
      };
      
      setLocalPosts(prev => prev.map(updatePost));
      if (setPosts) {
        setPosts(prev => prev.map(updatePost));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Posts</h2>
          <p className="text-purple-300">Administra los posts y contenido de los usuarios</p>
        </div>
        <div className="flex space-x-4">
          <Card className="bg-black/40 border-purple-500/30 px-4 py-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-purple-400" />
              <div className="text-center">
                <p className="text-sm text-purple-200">Total Posts</p>
                <p className="text-xl font-bold text-white">{postsToShow.length}</p>
              </div>
            </div>
          </Card>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
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
          <div className="space-y-2">
            <Label className="text-purple-200">Buscar Posts</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
              <Input
                placeholder="Buscar por título, descripción o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/50 border-purple-500/30 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="grid gap-6">
        {filteredPosts.map(post => (
          <Card key={post.post_id || post.id} className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {/* Post Image */}
                <div className="flex-shrink-0">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-purple-900/50 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-purple-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-lg">{post.title}</h3>
                    <p className="text-purple-200">
                      {post.description.length > 200 
                        ? `${post.description.substring(0, 200)}...`
                        : post.description}
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage 
                        src={post.user?.avatar || post.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.display_name || post.user?.name || 'User')}&background=7c3aed&color=fff&size=32`} 
                        alt={post.user?.name || post.user?.display_name || 'User'}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.display_name || post.user?.name || 'User')}&background=7c3aed&color=fff&size=32`;
                        }}
                      />
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {(post.user?.name || post.user?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{post.user?.display_name || post.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-purple-400">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex space-x-6 text-sm text-purple-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.post_id || post.id)}
                      className={`flex items-center space-x-1 p-0 h-auto hover:bg-transparent ${
                        post.user_liked ? 'text-red-400' : 'text-purple-200 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count || 0} likes</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowComments(post.post_id || post.id)}
                      className="flex items-center space-x-1 p-0 h-auto text-purple-200 hover:text-blue-400 hover:bg-transparent"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments_count || 0} comentarios</span>
                    </Button>
                  </div>
                </div>



                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(post)}
                    className="text-purple-300 hover:bg-purple-900/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(post.post_id || post.id)}
                    className="text-red-400 hover:bg-red-900/50"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <MessageCircle className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron posts</h3>
                <p className="text-purple-300">No hay posts que coincidan con la búsqueda.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nuevo Post</DialogTitle>
            <DialogDescription className="text-purple-300">
              Completa la información para crear un nuevo post
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-purple-200">Título *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-purple-200">Descripción *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-purple-200">Imagen</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? 'Creando...' : 'Crear Post'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/90 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Post</DialogTitle>
            <DialogDescription className="text-purple-300">
              Modifica la información del post
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-purple-200">Título *</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-purple-200">Descripción *</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image" className="text-purple-200">Imagen</Label>
              <Input
                id="edit-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-300 hover:bg-purple-900/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <PostComments
        postId={activeCommentsPost}
        isOpen={!!activeCommentsPost}
        onClose={() => setActiveCommentsPost(null)}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default PostsManager;