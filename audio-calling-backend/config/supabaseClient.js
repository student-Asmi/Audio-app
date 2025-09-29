import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config() // load .env variables

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

