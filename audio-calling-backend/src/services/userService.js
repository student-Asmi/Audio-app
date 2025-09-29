import { supabase } from '../config/supabaseClient.js'

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) console.error(error)
  else console.log(data)
}
