import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not properly configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'academic-papers';

console.log('Supabase client initialized successfully');
