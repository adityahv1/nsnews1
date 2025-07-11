import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronUp, Users } from 'lucide-react';
import { toast } from 'sonner';

const TEAMS = [
  'WTF (Team Tanisha)',
  'Team Tara',
  'Team Wei-Rong',
  'Sugar Gliders (Team Sara)',
  'Team Emily',
  'Team Nikki',
  'Ctrl+Alt+Elite (Team Michelle)',
  'Team Isabelle',
  'Team Josie',
  'Free Agents Team Lana',
  'Debby 2.0 (Team Debby)',
  'Team Dawn',
  'Team Aditi',
  'Team Devisha'
];

const PollLeaderboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get poll data
  const { data: pollData, isLoading, isError } = useQuery({
    queryKey: ['poll-data'],
    queryFn: async () => {
      try {
        // Get or create the main poll
        let { data: poll, error } = await supabase
          .from('polls')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (!poll && !error) {
          // Create the poll if it doesn't exist
          const { data: newPoll, error: createError } = await supabase
            .from('polls')
            .insert({
              title: 'Best Team Competition',
              description: 'Vote for your favorite team!',
              teams: TEAMS,
              is_active: true
            })
            .select()
            .single();

          if (createError) throw createError;
          poll = newPoll;
        } else if (error) {
          throw error;
        }

        // Get all votes for this poll
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('poll_id', poll.id);

        if (votesError) throw votesError;

        // Check if user has voted
        const userVote = user ? votes.find(vote => vote.user_id === user.id) : null;

        // Calculate vote counts
        const voteCounts = TEAMS.reduce((acc, team) => {
          acc[team] = votes.filter(vote => vote.team_name === team).length;
          return acc;
        }, {} as Record<string, number>);

        const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

        // Sort teams by vote count
        const sortedTeams = TEAMS.map(team => ({
          name: team,
          votes: voteCounts[team] || 0,
          percentage: totalVotes > 0 ? ((voteCounts[team] || 0) / totalVotes) * 100 : 0
        })).sort((a, b) => b.votes - a.votes);

        return {
          poll,
          votes,
          userVote,
          sortedTeams,
          totalVotes
        };
      } catch (error) {
        console.error('Poll data error:', error);
        // Return fallback data when database fails
        const sortedTeams = TEAMS.map((team, index) => ({
          name: team,
          votes: 0,
          percentage: 0
        }));

        return {
          poll: null,
          votes: [],
          userVote: null,
          sortedTeams,
          totalVotes: 0
        };
      }
    }
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (teamName: string) => {
      if (!user) throw new Error('Not authenticated');
      if (!pollData?.poll) throw new Error('Poll not found');

      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: pollData.poll.id,
          user_id: user.id,
         email: user.email || 'Unknown',
          team_name: teamName
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-data'] });
      toast.success('Vote recorded successfully!');
    },
    onError: (error) => {
      toast.error('Failed to record vote');
    }
  });

  const handleVote = (teamName: string) => {
    if (!user) {
      toast.error('Please sign up to vote! Use the Sign Up / Login button in the top right.');
      return;
    }
    
    if (pollData?.userVote) {
      toast.error('You have already voted');
      return;
    }

    voteMutation.mutate(teamName);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg p-3 h-12"></div>
      ))}
    </div>;
  }

  if (!pollData) {
    return <div className="text-center py-4 text-gray-500">
      <p>Unable to load polls. Please try again later.</p>
    </div>;
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium">NS Cup Team Votes 2025, July</h3>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{pollData.totalVotes} votes</span>
          </div>
          {pollData.userVote && (
            <Badge variant="outline" className="text-xs">
              You voted: {pollData.userVote.team_name}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {pollData.sortedTeams.map((team, index) => (
          <div key={team.name} className="group">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-white transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {team.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {team.votes} votes
                </span>
                
                {user ? (
                  <Button
                    size="sm"
                    variant={pollData.userVote?.team_name === team.name ? "default" : "outline"}
                    onClick={() => handleVote(team.name)}
                    disabled={voteMutation.isPending || !!pollData.userVote}
                    className="h-8 px-3 flex items-center gap-1"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-xs">
                      {pollData.userVote?.team_name === team.name ? "Voted" : "Vote"}
                    </span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(team.name)}
                    className="h-8 px-3 flex items-center gap-1"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-xs">Vote</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!user && (
        <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
          <p>Sign in to vote for your favorite team!</p>
        </div>
      )}
    </div>
  );
};

export default PollLeaderboard;