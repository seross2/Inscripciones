import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuración de Variables de Entorno ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Inicialización de Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Servir archivos estáticos ---
// Esto le dice a Express que la carpeta 'client' contiene archivos públicos.
const clientPath = path.resolve(__dirname, '../client');
app.use('/client', express.static(clientPath));

// --- Ruta Principal ---
// Cuando alguien visite la raíz ('/'), le enviaremos el archivo HTML principal.
app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'Html', 'PantallaInicio.html'));
});

// --- Rutas para las otras páginas HTML ---
app.get('/CursosLinea.Html', (req, res) => {
    res.sendFile(path.join(clientPath, 'Html', 'CursosLinea.Html'));
});

// Asumo que tienes un Login.html y Register.html en la misma carpeta
app.get('/Login.html', (req, res) => {
    res.sendFile(path.join(clientPath, 'Html', 'Login.html'));
});

app.get('/Register.html', (req, res) => {
    res.sendFile(path.join(clientPath, 'Html', 'Register.html'));
});

app.get('/GestionAdmin.html', (req, res) => {
    res.sendFile(path.join(clientPath, 'Html', 'GestionAdmin.html'));
});

// --- Conexión a Supabase (usando las variables de entorno) ---
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

if (supabase) {
    console.log("✅ Cliente de Supabase inicializado.");
} else {
    console.error("❌ Error al inicializar el cliente de Supabase. Revisa tus variables de entorno.");
    process.exit(1); // Salir si no se puede conectar
}

// --- Rutas de la API ---

// GET /api/asignaturas - Obtener todas las asignaturas
app.get('/api/asignaturas', async (req, res) => {
    const { data, error } = await supabase.from('ASIGNATURAS').select('*');
    if (error) {
        console.error('Error al obtener asignaturas:', error);
        return res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
    res.status(200).json(data);
});

// POST /api/asignaturas - Crear una nueva asignatura
app.post('/api/asignaturas', async (req, res) => {
    const { nombre_asignatura, codigo_asignatura, creditos, total_horas, imagen_url, descripcion_curso } = req.body;
    const { data, error } = await supabase
        .from('ASIGNATURAS')
        .insert([{ 
            NombreAsignatura: nombre_asignatura, 
            CodigoAsignatura: codigo_asignatura, 
            Creditos: creditos, 
            TotalHoras: total_horas,
            Imagen: imagen_url,
            Descripcion_Curso: descripcion_curso
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear asignatura:', error);
        if (error.code === '23505') { // Error de unicidad
            return res.status(409).json({ message: `La asignatura con código '${codigo_asignatura}' ya existe.` });
        }
        return res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
    res.status(201).json(data);
});

// GET /api/profesores - Obtener todos los profesores
app.get('/api/profesores', async (req, res) => {
    const { data, error } = await supabase.from('PROFESORES').select('*');
    if (error) {
        console.error('Error al obtener profesores:', error);
        return res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
    res.status(200).json(data);
});

// POST /api/profesores - Crear un nuevo profesor
app.post('/api/profesores', async (req, res) => {
    const { nombre, apellido, email, departamento } = req.body;
    const { data, error } = await supabase
        .from('PROFESORES')
        .insert([{ 
            Nombre: nombre, 
            Apellido: apellido, 
            Email: email, 
            Departamento: departamento 
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear profesor:', error);
        if (error.code === '23505') { // Error de unicidad (probablemente por el email)
            return res.status(409).json({ message: `El email '${email}' ya está registrado.` });
        }
        return res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
    res.status(201).json(data);
});

// --- Iniciar el servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
