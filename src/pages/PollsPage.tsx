import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Vote, BarChart3 } from 'lucide-react';
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

const PollsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get poll data
  const { data: pollData, isLoading } = useQuery({
    queryKey: ['poll-data'],
    queryFn: async () => {
      // Get or create the main poll
      let { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (!poll) {
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
      toast.error('Please sign in to vote');
      return;
    }
    
    if (pollData?.userVote) {
      toast.error('You have already voted');
      return;
    }

    voteMutation.mutate(teamName);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="animate-pulse p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            NS Cup Opinion Poll
          </CardTitle>
          <p className="text-gray-600">Vote for your favorite team! One vote per user. All votes are anonymous.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{pollData?.totalVotes || 0} total votes</span>
              </div>
              {pollData?.userVote && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Vote className="h-3 w-3" />
                  You voted: {pollData.userVote.team_name}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {pollData?.sortedTeams.map((team, index) => (
              <div key={team.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">#{index + 1}</span>
                      {index < 3 && (
                        <Trophy className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-amber-600'
                        }`} />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">{team.votes}</p>
                      <p className="text-sm text-gray-500">{team.percentage.toFixed(1)}%</p>
                    </div>
                    {!pollData?.userVote && user && (
                      <Button
                        onClick={() => handleVote(team.name)}
                        disabled={voteMutation.isPending}
                        className="min-w-[80px]"
                      >
                        {voteMutation.isPending ? 'Voting...' : 'Vote'}
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={team.percentage} className="h-3" />
              </div>
            ))}
          </div>

          {!user && (
            <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Sign in to vote for your favorite team!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PollsPage;