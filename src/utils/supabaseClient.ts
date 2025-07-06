import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjprfsdducpkxeezzvst.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcHJmc2RkdWNwa3hlZXp6dnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM3MDE0NywiZXhwIjoyMDY2OTQ2MTQ3fQ.2WGYpUeHdSkv0e-a4tYsTzwMjV43yv-CzRBAfcEQpGw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
