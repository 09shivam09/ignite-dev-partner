-- Add indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_proposals_creator_id ON proposals(creator_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Create function to update proposal status based on end date
CREATE OR REPLACE FUNCTION update_proposal_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.voting_ends_at < now() AND NEW.status = 'active' THEN
    -- Check if quorum is met
    IF (NEW.yes_votes + NEW.no_votes + NEW.abstain_votes) >= NEW.quorum_required THEN
      -- Quorum met, check result
      IF NEW.yes_votes > NEW.no_votes THEN
        NEW.status = 'passed';
      ELSE
        NEW.status = 'rejected';
      END IF;
    ELSE
      -- Quorum not met
      NEW.status = 'failed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update proposal status
DROP TRIGGER IF EXISTS update_proposal_status_trigger ON proposals;
CREATE TRIGGER update_proposal_status_trigger
BEFORE UPDATE ON proposals
FOR EACH ROW
EXECUTE FUNCTION update_proposal_status();

-- Add proposal comments table for proper discussion
CREATE TABLE IF NOT EXISTS proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES proposal_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for proposal_comments
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for proposal_comments
DROP POLICY IF EXISTS "Proposal comments are viewable by everyone" ON proposal_comments;
CREATE POLICY "Proposal comments are viewable by everyone"
ON proposal_comments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create their own proposal comments" ON proposal_comments;
CREATE POLICY "Users can create their own proposal comments"
ON proposal_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own proposal comments" ON proposal_comments;
CREATE POLICY "Users can update their own proposal comments"
ON proposal_comments FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own proposal comments" ON proposal_comments;
CREATE POLICY "Users can delete their own proposal comments"
ON proposal_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for proposal_comments
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal_id ON proposal_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_user_id ON proposal_comments(user_id);