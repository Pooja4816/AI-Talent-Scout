import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://owyugsanxbowzqibmpfd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXVnc2FueGJvd3pxaWJtcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjE5MDYsImV4cCI6MjA5MjY5NzkwNn0.3DflYVqGXgYiCcYKAujJBcgu3CYZ07jmvVLJTMBjj6E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);