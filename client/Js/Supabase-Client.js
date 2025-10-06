// Carga las variables del archivo .env
require('dotenv').config(); 

import { createClient } from '@supabase/supabase-js'

// 1. Acceder a las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Verificación básica para asegurar que las claves se cargaron
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Las variables SUPABASE_URL y SUPABASE_ANON_KEY no están definidas en process.env. Revisa tu archivo .env.')
}

// 2. Inicializar y exportar el cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)