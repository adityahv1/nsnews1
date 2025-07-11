import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import PollLeaderboard from '@/components/PollLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, TrendingUp } from 'lucide-react';

const HomePage = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Latest News
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No news posts yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts?.map((post, index) => (
                  <div key={post.id}>
                    <PostCard post={post} />
                    {index < posts.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team Poll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PollLeaderboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;