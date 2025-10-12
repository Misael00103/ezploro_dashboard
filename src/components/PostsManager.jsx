import React, { useState } from 'react';
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
import { mockPosts } from '../mock';

const PostsManager = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: ''
  });
  const { toast } = useToast();

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Por favor completa título y descripción",
        variant: "destructive"
      });
      return;
    }

    const newPost = {
      id: Math.max(...posts.map(p => p.id)) + 1,
      ...formData,
      image: formData.image || `https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop`,
      user_id: 1,
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@scapeevents.com",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString()
    };

    const updatedPosts = [...posts, newPost];
    setPosts(updatedPosts);
    
    toast({
      title: "Post creado",
      description: "El post se ha creado exitosamente",
    });

    setIsCreateModalOpen(false);
    resetForm();
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
    
    const updatedPosts = posts.map(post =>
      post.id === selectedPost.id
        ? { ...post, ...formData }
        : post
    );
    
    setPosts(updatedPosts);
    
    toast({
      title: "Post actualizado",
      description: "El post se ha actualizado exitosamente",
    });

    setIsEditModalOpen(false);
    resetForm();
    setSelectedPost(null);
  };

  const handleDelete = (postId) => {
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    
    toast({
      title: "Post eliminado",
      description: "El post se ha eliminado exitosamente",
    });
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
                <p className="text-xl font-bold text-white">{posts.length}</p>
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
          <Card key={post.id} className="bg-black/40 border-purple-500/30">
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
                      <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {post.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{post.user.name}</p>
                      <p className="text-xs text-purple-400">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex space-x-6 text-sm text-purple-200">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes_count} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments_count} comentarios</span>
                    </div>
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
                    onClick={() => handleDelete(post.id)}
                    className="text-red-400 hover:bg-red-900/50"
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
              <Label htmlFor="image" className="text-purple-200">URL de Imagen</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="https://example.com/imagen.jpg (opcional)"
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Crear Post
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
              <Label htmlFor="edit-image" className="text-purple-200">URL de Imagen</Label>
              <Input
                id="edit-image"
                name="image"
                value={formData.image}
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Actualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostsManager;