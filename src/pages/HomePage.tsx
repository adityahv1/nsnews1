import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import PollLeaderboard from '@/components/PollLeaderboard';
import { Newspaper } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-medium text-gray-900">Latest News</h2>
          <p className="text-sm text-gray-500">Stay updated with the latest posts and announcements</p>
        </div>
        
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-lg p-6">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
            <Newspaper className="h-10 w-10 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No news posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-medium text-gray-900">NSCup Polls</h2>
          <p className="text-sm text-gray-500">Vote for your favorite teams in the competition</p>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-lg p-6">
          <PollLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default HomePage;