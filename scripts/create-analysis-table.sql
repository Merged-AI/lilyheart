-- Create analysis_results table for storing comprehensive AI analysis data
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'crisis')),
  primary_concerns TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT fk_analysis_child FOREIGN KEY (child_id) REFERENCES children(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analysis_results_child_id ON analysis_results(child_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_risk_level ON analysis_results(risk_level);

-- Enable RLS
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view analysis for their family's children" ON analysis_results FOR SELECT USING (
  child_id IN (
    SELECT id FROM children WHERE family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Service role can manage all analysis data" ON analysis_results FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON analysis_results TO authenticated;
GRANT ALL ON analysis_results TO service_role; 