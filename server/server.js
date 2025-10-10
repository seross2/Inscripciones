import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

// Configuración para obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// The rest of your application code follows...

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'client'
app.use(express.static(path.join(__dirname, '..', 'client')));

// Check if environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_ANON_KEY are required in your .env file'
  );
  process.exit(1); // Exit if credentials are not found
}

// Initialize Supabase client
// This should now work correctly because dotenv has loaded the variables.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get('/', (req, res) => {
  // Ahora, la ruta principal servirá tu archivo HTML
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'PantallaInicio.html'));
});

app.get('/CursosLinea.Html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'CursosLinea.Html'));
});

// --- Rutas para servir otras páginas HTML ---

app.get('/Login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'Login.html'));
});

app.get('/Register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'Register.html'));
});

app.get('/DetalleCurso.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'DetalleCurso.html'));
});

app.get('/MisCursos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'MisCursos.html'));
});

// Example API route to fetch data from Supabase
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('your_table_name').select('*');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching from Supabase:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Supabase.' });
  }
});

// --- ENDPOINT PARA ASIGNATURAS ---

app.get('/api/asignaturas', async (req, res) => {
  try {
    // Empezamos la consulta a la tabla 'ASIGNATURAS'
    let query = supabase.from('ASIGNATURAS').select('*');

    // Filtro de búsqueda por nombre
    if (req.query.search) {
      query = query.ilike('NombreAsignatura', `%${req.query.search}%`);
    }

    // Filtro por rango de créditos
    if (req.query.creditos) {
      const [min, max] = req.query.creditos.split('-');
      query = query.gte('Creditos', parseInt(min)).lte('Creditos', parseInt(max));
    }

    // Filtro por rango de horas
    if (req.query.horas) {
      const [min, max] = req.query.horas.split('-');
      query = query.gte('TotalHoras', parseInt(min)).lte('TotalHoras', parseInt(max));
    }


    // Ejecutamos la consulta final
    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching asignaturas:', error.message);
    res.status(500).json({ error: 'Failed to fetch asignaturas.' });
  }
});

app.get('/api/asignaturas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Obtener los detalles de la asignatura
    const { data: asignaturaData, error: asignaturaError } = await supabase
      .from('ASIGNATURAS')
      .select('*')
      .eq('AsignaturaID', id)
      .single();

    if (asignaturaError) throw asignaturaError;
    if (!asignaturaData) return res.status(404).json({ error: 'Asignatura no encontrada.' });

    // 2. Obtener los grupos y profesores asociados
    const { data: gruposData, error: gruposError } = await supabase
      .from('GRUPOS')
      .select(`
        *
        ,PROFESORES ( Nombre, Apellido, Departamento )
        ,HORARIOS ( * )
        ,INSCRIPCIONES ( count )
        ,PERIODOS_ACADEMICOS ( * )
      `)
      .eq('AsignaturaID', id);

    if (gruposError) throw gruposError;

    res.json({ asignatura: asignaturaData, grupos: gruposData });

  } catch (error) {
    console.error(`Error fetching details for asignatura ${id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch asignatura details.' });
  }
});

app.get('/api/profesores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('PROFESORES').select('ProfesorID, Nombre, Apellido');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profesores.' });
  }
});

app.get('/api/periodos', async (req, res) => {
  try {
    // Asegúrate de tener una tabla 'PERIODOS_ACADEMICOS' con 'PeriodoID' y 'NombrePeriodo'
    const { data, error } = await supabase.from('PERIODOS_ACADEMICOS').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch periodos.' });
  }
});

app.post('/api/horarios', async (req, res) => {
  try {
    const { DiaSemana, HoraInicio, HoraFin, Salon } = req.body;

    // 1. Verificar si ya existe un horario que se cruce
    const { data: existingHorarios, error: checkError } = await supabase
      .from('HORARIOS')
      .select('HorarioID')
      .eq('DiaSemana', DiaSemana)
      .eq('Salon', Salon)
      .lt('HoraInicio', HoraFin) // El nuevo horario empieza antes de que el existente termine
      .gt('HoraFin', HoraInicio); // El nuevo horario termina después de que el existente empiece

    if (checkError) {
      throw checkError;
    }

    if (existingHorarios && existingHorarios.length > 0) {
      // Si se encuentra un conflicto, se devuelve un error 409 (Conflict)
      return res.status(409).json({ error: `Conflicto: El salón ${Salon} ya está ocupado en ese día y hora.` });
    }

    // 2. Si no hay conflictos, insertar el nuevo horario
    const { data, error } = await supabase.from('HORARIOS').insert(req.body).select();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating horario:', error.message);
    res.status(500).json({ error: 'No se pudo crear el horario.' });
  }
});

app.post('/api/grupos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('GRUPOS').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating group:', error.message);
    res.status(500).json({ error: 'Failed to create group.' });
  }
});


// --- ENDPOINTS DE AUTENTICACIÓN ---

// Endpoint para registrar un nuevo usuario
app.post('/api/register', async (req, res) => {
  const { nombre_usuario, email, password: plainTextPassword } = req.body;

  if (!nombre_usuario || !email || !plainTextPassword) {
    return res.status(400).json({ error: 'Nombre de usuario, email y contraseña son requeridos.' });
  }

  try {
    // Codificar (hash) la contraseña de forma segura
    const saltRounds = 10;
    const contrasena_hash = await bcrypt.hash(plainTextPassword, saltRounds);

    // Insertar el nuevo usuario directamente en tu tabla 'usuarios'
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre_usuario,
        email,
        contrasena_hash, // Guardamos la contraseña codificada
        rol_id: 1, // Rol por defecto 'cliente'
      })
      .select();

    if (error) {
      // Manejar errores comunes como email duplicado
      if (error.code === '23505') {
        return res.status(409).json({ error: 'El email o nombre de usuario ya existe.' });
      }
      throw error;
    }

    res.status(201).json({ message: '¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error en el registro:', error.message);
    res.status(500).json({ error: 'No se pudo registrar el usuario.' });
  }
});

// Endpoint para iniciar sesión
app.post('/api/login', async (req, res) => {
  const { email, password: plainTextPassword } = req.body;

  if (!email || !plainTextPassword) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  // 1. Buscar al usuario por su email en tu tabla 'usuarios'
  const { data: users, error } = await supabase.from('usuarios').select('*').eq('email', email);

  if (error || !users || users.length === 0) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const user = users[0];

  // 2. Comparar la contraseña del formulario con la contraseña codificada en la base de datos
  const passwordMatches = await bcrypt.compare(plainTextPassword, user.contrasena_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Si las contraseñas coinciden, el login es exitoso.
  // Creamos una "sesión" simple para el frontend.
  const session = { user: { id: user.usuario_id, email: user.email, nombre: user.nombre_usuario } };
  res.status(200).json({ message: 'Login exitoso', session: session });
});

app.get('/api/mis-cursos', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email es requerido.' });
  }

  try {
    // 1. Encontrar al estudiante por su email
    const { data: estudiante, error: estudianteError } = await supabase
      .from('ESTUDIANTES')
      .select('*')
      .eq('Email', email)
      .single();

    if (estudianteError) throw estudianteError;
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    // 2. Obtener todas las inscripciones de ese estudiante con datos anidados
    const { data: inscripciones, error: inscripcionesError } = await supabase
      .from('INSCRIPCIONES')
      .select(`
        *,
        GRUPOS (
          *,
          ASIGNATURAS (*),
          PROFESORES (*),
          PERIODOS_ACADEMICOS (*)
        )
      `)
      .eq('EstudianteID', estudiante.EstudianteID);

    if (inscripcionesError) throw inscripcionesError;

    res.json({ estudiante, inscripciones });

  } catch (error) {
    console.error('Error fetching mis-cursos:', error.message);
    res.status(500).json({ error: 'No se pudieron obtener los datos de los cursos.' });
  }
});

app.post('/api/inscripciones', async (req, res) => {
  const { Nombre, Apellido, Email, Telefono, FechaNacimiento, GrupoID } = req.body;

  if (!Nombre || !Apellido || !Email || !Telefono || !FechaNacimiento || !GrupoID) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    // --- NUEVA VALIDACIÓN DE CAPACIDAD ---
    // 1. Obtener la capacidad del grupo y el número actual de inscritos
    const { data: grupoData, error: grupoError } = await supabase
      .from('GRUPOS')
      .select('Capacidad, INSCRIPCIONES (count)')
      .eq('GrupoID', GrupoID)
      .single();

    if (grupoError) throw new Error('No se pudo verificar la capacidad del grupo.');

    const capacidad = grupoData.Capacidad;
    const inscritos = grupoData.INSCRIPCIONES[0].count;

    // 2. Comparar y devolver error si el grupo está lleno
    if (inscritos >= capacidad) {
      return res.status(409).json({ error: 'El grupo ya ha alcanzado su capacidad máxima. No se puede inscribir.' });
    }
    // --- FIN DE LA VALIDACIÓN ---


    // Paso 1: Buscar o crear el estudiante
    let { data: estudiante, error: findError } = await supabase
      .from('ESTUDIANTES')
      .select('EstudianteID')
      .eq('Email', Email)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw findError;
    }

    if (!estudiante) {
      // Si el estudiante no existe, lo creamos
      const { data: nuevoEstudiante, error: createError } = await supabase
        .from('ESTUDIANTES')
        .insert({ Nombre, Apellido, Email, Telefono, FechaNacimiento })
        .select('EstudianteID')
        .single();
      
      if (createError) throw createError;
      estudiante = nuevoEstudiante;
    }

    const estudianteId = estudiante.EstudianteID;

    // Paso 2: Verificar si ya existe una inscripción para este estudiante y grupo
    const { data: existingInscripcion, error: checkInscripcionError } = await supabase
      .from('INSCRIPCIONES')
      .select('InscripcionID')
      .eq('EstudianteID', estudianteId)
      .eq('GrupoID', GrupoID)
      .single();

    if (checkInscripcionError && checkInscripcionError.code !== 'PGRST116') throw checkInscripcionError;
    if (existingInscripcion) return res.status(409).json({ error: 'Ya estás inscrito en este grupo.' });

    // Paso 3: Crear la inscripción
    const { error: inscripcionError } = await supabase
      .from('INSCRIPCIONES')
      .insert({ EstudianteID: estudianteId, GrupoID: GrupoID });

    if (inscripcionError) throw inscripcionError;

    res.status(201).json({ message: '¡Inscripción realizada con éxito!' });
  } catch (error) {
    console.error('Error en el proceso de inscripción:', error.message);
    res.status(500).json({ error: 'No se pudo completar la inscripción.' });
  }
});

app.delete('/api/inscripciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('INSCRIPCIONES')
      .delete()
      .eq('InscripcionID', id);

    if (error) throw error;

    res.json({ message: 'Inscripción cancelada exitosamente.' });
  } catch (error) {
    console.error('Error al cancelar la inscripción:', error.message);
    res.status(500).json({ error: 'No se pudo cancelar la inscripción.' });
  }
});


app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`🚀 Server ready at: ${url}`);
});