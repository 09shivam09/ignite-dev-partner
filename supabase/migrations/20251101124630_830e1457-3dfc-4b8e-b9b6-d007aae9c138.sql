-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  voting_starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  yes_votes INTEGER NOT NULL DEFAULT 0,
  no_votes INTEGER NOT NULL DEFAULT 0,
  abstain_votes INTEGER NOT NULL DEFAULT 0,
  quorum_required INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL,
  voting_power INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

-- Create delegates table
CREATE TABLE public.delegates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voting_power INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(delegator_id, delegate_id)
);

-- Enable Row Level Security
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "Proposals are viewable by everyone" 
ON public.proposals FOR SELECT USING (true);

CREATE POLICY "Users can create proposals" 
ON public.proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their proposals" 
ON public.proposals FOR UPDATE USING (auth.uid() = creator_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" 
ON public.votes FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Delegates policies
CREATE POLICY "Delegates are viewable by everyone" 
ON public.delegates FOR SELECT USING (true);

CREATE POLICY "Users can manage their delegations" 
ON public.delegates FOR ALL USING (auth.uid() = delegator_id);

-- Create indexes
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_creator ON public.proposals(creator_id);
CREATE INDEX idx_proposals_voting_ends ON public.proposals(voting_ends_at);
CREATE INDEX idx_votes_proposal ON public.votes(proposal_id);
CREATE INDEX idx_votes_user ON public.votes(user_id);
CREATE INDEX idx_delegates_delegator ON public.delegates(delegator_id);
CREATE INDEX idx_delegates_delegate ON public.delegates(delegate_id);

-- Create trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegates_updated_at
BEFORE UPDATE ON public.delegates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delegates;