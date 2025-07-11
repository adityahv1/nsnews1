import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Calendar, User, Edit, Save, X, Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    media_urls: string[];
    email: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title,
    content: post.content,
    tags: post.tags,
    tagInput: ''
  });
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Get like count and user's like status
  const { data: likeData } = useQuery({
    queryKey: ['post-likes', post.id],
    queryFn: async () => {
      const { data: likes, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id);
      
      if (error) throw error;
      
      const userLiked = user ? likes.some(like => like.user_id === user.id) : false;
      return { count: likes.length, userLiked };
    }
  });

  // Get comment count
  const { data: commentCount } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id')
        .eq('post_id', post.id);
      
      if (error) throw error;
      return data.length;
    }
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (likeData?.userLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes', post.id] });
    },
    onError: (error) => {
      toast.error('Failed to update like');
    }
  });

  const handleLike = () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    likeMutation.mutate();
  };

  const isOwner = user && user.id === post.user_id;
  const isEdited = post.updated_at !== post.created_at;

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        title: post.title,
        content: post.content,
        tags: post.tags,
        tagInput: ''
      });
      setMediaToRemove([]);
      setNewFiles([]);
    }
    setIsEditing(!isEditing);
  };

  const handleAddTag = () => {
    if (editForm.tagInput.trim() && !editForm.tags.includes(editForm.tagInput.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveExistingMedia = (url: string) => {
    setMediaToRemove(prev => [...prev, url]);
  };

  const handleRestoreMedia = (url: string) => {
    setMediaToRemove(prev => prev.filter(u => u !== url));
  };

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);

    try {
      // Upload new files
      const newMediaUrls = newFiles.length > 0 ? await uploadFiles(newFiles) : [];
      
      // Calculate final media URLs (existing - removed + new)
      const finalMediaUrls = [
        ...post.media_urls.filter(url => !mediaToRemove.includes(url)),
        ...newMediaUrls
      ];

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          tags: editForm.tags,
          media_urls: finalMediaUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;

      // Delete removed media from storage
      if (mediaToRemove.length > 0) {
        const filesToDelete = mediaToRemove.map(url => {
          const fileName = url.split('/').pop();
          return fileName;
        }).filter(Boolean);

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('media')
            .remove(filesToDelete);
        }
      }

      toast.success('Post updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsEditing(false);
      setMediaToRemove([]);
      setNewFiles([]);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const renderMedia = (url: string, index: number) => {
    const isMarkedForRemoval = mediaToRemove.includes(url);
    const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi');
    
    const mediaElement = isVideo ? (
      <video
        key={index}
        src={url}
        controls
        className="w-full h-48 object-cover rounded-md"
      />
    ) : (
      <img
        key={index}
        src={url}
        alt={`Media ${index + 1}`}
        className="w-full h-48 object-cover rounded-md"
      />
    );

    if (isVideo) {
      return isEditing ? (
        <div key={index} className={`relative ${isMarkedForRemoval ? 'opacity-50' : ''}`}>
          {mediaElement}
          <div className="absolute top-2 right-2 flex gap-1">
            {isMarkedForRemoval ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRestoreMedia(url)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveExistingMedia(url)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isMarkedForRemoval && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
              <span className="text-white font-medium">Will be removed</span>
            </div>
          )}
        </div>
      ) : mediaElement;
    }
    
    return isEditing ? (
      <div key={index} className={`relative ${isMarkedForRemoval ? 'opacity-50' : ''}`}>
        {mediaElement}
        <div className="absolute top-2 right-2 flex gap-1">
          {isMarkedForRemoval ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRestoreMedia(url)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleRemoveExistingMedia(url)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isMarkedForRemoval && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
            <span className="text-white font-medium">Will be removed</span>
          </div>
        )}
      </div>
    ) : mediaElement;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>{post.email}</span>
              <Calendar className="h-4 w-4 ml-2" />
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {isEdited && (
                <Badge variant="outline" className="text-xs">
                  edited
                </Badge>
              )}
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditToggle}
                className="flex items-center gap-1"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                />
              </div>
            </div>
          ) : (
            <Link to={`/posts/${post.id}`}>
              <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your content here..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={editForm.tagInput}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tagInput: e.target.value }))}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {editForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editForm.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Add New Media</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="edit-file-upload"
                  />
                  <label
                    htmlFor="edit-file-upload"
                    className="flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-500">Click to upload images or videos</span>
                  </label>
                </div>
                
                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">New files to add:</Label>
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-700 line-clamp-3">{post.content}</p>
          )}
          
          {(post.media_urls.length > 0 || isEditing) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {post.media_urls.slice(0, isEditing ? undefined : 4).map((url, index) => renderMedia(url, index))}
              {!isEditing && post.media_urls.length > 4 && (
                <div className="flex items-center justify-center bg-gray-100 rounded-md h-48">
                  <span className="text-gray-500">+{post.media_urls.length - 4} more</span>
                </div>
              )}
            </div>
          )}
          
          {!isEditing && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-2">
            {isEditing ? (
              <div className="flex gap-2 w-full">
                <Button onClick={handleSaveEdit} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1 ${
                likeData?.userLiked ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${likeData?.userLiked ? 'fill-current' : ''}`} />
              <span>{likeData?.count || 0}</span>
            </Button>
            
            <Link to={`/posts/${post.id}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount || 0}</span>
              </Button>
            </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PostCard;