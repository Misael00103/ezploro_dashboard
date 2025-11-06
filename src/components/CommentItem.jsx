// components/CommentItem.jsx
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { createCommentReply } from '../services/eventCommentService'; // Ajusta la ruta

const CommentItem = ({ comment, eventId, onReplyAdded, depth = 0 }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const replyData = {
        eventId,
        commentId: comment.comment_id || comment.id,
        text: replyText,
        images: [] // Puedes extenderlo después
      };

      await createCommentReply(replyData);
      setReplyText('');
      setReplying(false);
      onReplyAdded();
      toast({ title: "Respuesta enviada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo responder", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('es-ES', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-purple-500/30 pl-4' : ''}`}>
      {/* Comentario */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user?.profile_picture || comment.user?.avatar} />
          <AvatarFallback className="bg-purple-600 text-white text-xs">
            {(comment.user?.display_name || comment.user?.name || 'U').charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-white">{comment.user?.display_name || comment.user?.name}</span>
            <span className="text-purple-400">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-purple-200 text-sm">{comment.text}</p>

          {/* Botón Responder */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplying(!replying)}
            className="h-auto p-0 text-xs text-purple-300 hover:text-purple-100"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Responder
          </Button>
        </div>
      </div>

      {/* Formulario de respuesta */}
      {replying && (
        <div className="ml-11 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="bg-black/50 border-purple-500/30 text-white text-sm resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={loading || !replyText.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-xs"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplying(false)}
              className="text-xs text-purple-300"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Replies anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.comment_id || reply.id}
              comment={reply}
              eventId={eventId}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;