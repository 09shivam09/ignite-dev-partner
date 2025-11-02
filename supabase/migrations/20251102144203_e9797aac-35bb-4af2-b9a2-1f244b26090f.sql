-- Fix function search path
CREATE OR REPLACE FUNCTION update_proposal_status()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;