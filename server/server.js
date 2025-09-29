// 1. Importar dependencias
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

// 2. Configuración inicial
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares
// La siguiente línea es la que "conecta" el frontend con el backend,
// permitiendo que tu página web (cliente) pueda hacerle peticiones.
app.use(cors());
app.use(express.json()); // Permite al servidor entender JSON

// 4. Configuración de la conexión a la base de datos
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

// 5. Definir las rutas de la API (Endpoints)

// GET /api/asignaturas - Obtener todas las asignaturas
app.get('/api/asignaturas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM asignaturas ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener asignaturas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// POST /api/asignaturas - Crear una nueva asignatura
app.post('/api/asignaturas', async (req, res) => {
    const { nombre_asignatura, codigo_asignatura, creditos, total_horas } = req.body;

    if (!nombre_asignatura || !codigo_asignatura || !creditos || !total_horas) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO asignaturas (nombre_asignatura, codigo_asignatura, creditos, total_horas) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre_asignatura, codigo_asignatura, creditos, total_horas]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear asignatura:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: `El código de asignatura '${codigo_asignatura}' ya existe.` });
        }
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
