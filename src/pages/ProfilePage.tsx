import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileText, MessageCircle, Heart, Vote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  
  // Get user profile data first
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      // First try to find by username (email prefix)
      const { data: users, error } = await supabase
        .from('users')
        .select('*, auth.users!inner(email)')
        .ilike('auth.users.email', `${username}%`);
      
      if (error) throw error;
      
      // Find exact match or closest match
      const user = users.find(u => u.auth.users.email.split('@')[0] === username) || users[0];
      return user;
    }
  });

  // Get user's posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', userProfile?.auth?.users?.email],
    queryFn: async () => {
      if (!userProfile?.auth?.users?.email) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('email', userProfile.auth.users.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.auth?.users?.email
  });

  // Get user's comments
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['user-comments', userProfile?.auth?.users?.email],
    queryFn: async () => {
      if (!userProfile?.auth?.users?.email) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select('*, posts!inner(title)')
        .eq('email', userProfile.auth.users.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.auth?.users?.email
  });

  // Get user's votes
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['user-votes', userProfile?.auth?.users?.email],
    queryFn: async () => {
      if (!userProfile?.auth?.users?.email) return [];
      
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('email', userProfile.auth.users.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.auth?.users?.email
  });

  // Get user's likes count
  const { data: likesCount } = useQuery({
    queryKey: ['user-likes-count', userProfile?.auth?.users?.email],
    queryFn: async () => {
      if (!userProfile?.auth?.users?.email) return 0;
      
      // Get user posts first
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('email', userProfile.auth.users.email);
      
      if (postsError) throw postsError;
      
      if (userPosts.length === 0) return 0;
      
      // Get likes on user's posts
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('id')
        .in('post_id', userPosts.map(p => p.id));
      
      if (likesError) throw likesError;
      return likes.length;
    },
    enabled: !!userProfile?.auth?.users?.email
  });

  if (profileLoading || postsLoading || commentsLoading || votesLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="animate-pulse p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <div>
              <div className="text-lg font-semibold">{userProfile.name}</div>
              <div className="text-sm text-gray-500 font-normal">@{userProfile.auth.users.email.split('@')[0]}</div>
              <div className="text-xs text-gray-400 font-normal">{userProfile.auth.users.email}</div>
            </div>
          </CardTitle>
          {userProfile.bio && (
            <p className="text-gray-600 mt-2">{userProfile.bio}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{posts?.length || 0} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments?.length || 0} comments</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{likesCount || 0} likes received</span>
            </div>
            <div className="flex items-center gap-1">
              <Vote className="h-4 w-4" />
              <span>{votes?.length || 0} votes cast</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="votes">Votes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4">
              {posts?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts?.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <Link to={`/posts/${post.id}`} className="block">
                        <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1">
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="comments" className="space-y-4">
              {comments?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No comments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">
                          Commented on: 
                        </span>
                        <Link 
                          to={`/posts/${comment.post_id}`}
                          className="text-sm font-medium hover:text-blue-600 transition-colors"
                        >
                          {comment.posts?.title || 'Unknown Post'}
                        </Link>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                      <span className="text-sm text-gray-500 mt-2 block">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="votes" className="space-y-4">
              {votes?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Vote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No votes cast yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {votes?.map((vote) => (
                    <div key={vote.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{vote.team_name}</p>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <Badge variant="outline">Team Vote</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <p>Activity timeline coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;