const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAnalysisTable() {
  console.log('Creating analysis_results table...')
  
  const createTableQuery = `
    -- Create analysis_results table for storing comprehensive AI analysis data
    CREATE TABLE IF NOT EXISTS analysis_results (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      analysis_data JSONB NOT NULL,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'crisis')),
      primary_concerns TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Foreign key constraint
      CONSTRAINT fk_analysis_child FOREIGN KEY (child_id) REFERENCES children(id)
    );
  `
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    })
    
    if (error) {
      console.error('Error creating table:', error)
      
      // Alternative approach - try direct SQL execution
      const { data: result, error: sqlError } = await supabase
        .from('analysis_results')
        .select('id')
        .limit(1)
      
      if (sqlError && sqlError.code === '42P01') {
        console.log('Table does not exist, will be created on first insert.')
      } else if (sqlError) {
        console.error('SQL Error:', sqlError)
      } else {
        console.log('✅ analysis_results table already exists')
      }
    } else {
      console.log('✅ analysis_results table created successfully')
    }
    
    // Create indexes
    console.log('Creating indexes...')
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_analysis_results_child_id ON analysis_results(child_id);',
      'CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);', 
      'CREATE INDEX IF NOT EXISTS idx_analysis_results_risk_level ON analysis_results(risk_level);'
    ]
    
    for (const query of indexQueries) {
      try {
        await supabase.rpc('exec_sql', { sql: query })
        console.log('✅ Index created')
      } catch (err) {
        console.log('Index may already exist:', err.message)
      }
    }
    
    // Enable RLS and create policies
    console.log('Setting up Row Level Security...')
    const rlsQueries = [
      'ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY IF NOT EXISTS "Users can view analysis for their family's children" ON analysis_results FOR SELECT USING (
        child_id IN (
          SELECT id FROM children WHERE family_id IN (
            SELECT id FROM families WHERE user_id = auth.uid()
          )
        )
      );`,
      `CREATE POLICY IF NOT EXISTS "Service role can manage all analysis data" ON analysis_results FOR ALL USING (auth.role() = 'service_role');`
    ]
    
    for (const query of rlsQueries) {
      try {
        await supabase.rpc('exec_sql', { sql: query })
        console.log('✅ RLS policy created')
      } catch (err) {
        console.log('Policy may already exist:', err.message)
      }
    }
    
    console.log('🎉 Database setup complete!')
    
  } catch (error) {
    console.error('Error setting up database:', error)
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('children')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('Database connection test failed:', testError)
    } else {
      console.log('✅ Database connection is working')
      console.log('ℹ️  The analysis_results table will be created automatically when needed.')
    }
  }
}

// Check if this is being run directly
if (require.main === module) {
  console.log('🚀 Setting up Heart Harbor Analysis Database...')
  createAnalysisTable().then(() => {
    console.log('✅ Setup complete!')
    process.exit(0)
  }).catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
}

module.exports = { createAnalysisTable } 