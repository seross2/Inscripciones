import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import multer from 'multer';

// Cargar variables de entorno explícitamente al inicio
dotenv.config();

// Configuración para obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The rest of your application code follows...

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Servir archivos estáticos desde la carpeta 'client'
app.use(express.static(path.join(__dirname, '..', 'client')));

// Check if environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required in your .env file'
  );
  process.exit(1); // Exit if credentials are not found
}

// Initialize Supabase client
// Usamos la SERVICE_KEY para operaciones de backend, que bypass RLS.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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

app.get('/PortalPagos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'Html', 'PortalPagos.html'));
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
      // Asegurarse de que min y max son números válidos antes de aplicar el filtro
      if (!isNaN(parseInt(min)) && !isNaN(parseInt(max))) {
        query = query.gte('Creditos', parseInt(min)).lte('Creditos', parseInt(max));
      }
    }

    // Filtro por rango de horas
    if (req.query.horas) {
      const [min, max] = req.query.horas.split('-');
      if (!isNaN(parseInt(min)) && !isNaN(parseInt(max))) {
        query = query.gte('TotalHoras', parseInt(min)).lte('TotalHoras', parseInt(max));
      }
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

  // Después de una autenticación exitosa, buscar el avatar del estudiante.
  let avatarUrl = null;
  try {
    const { data: estudiante } = await supabase
      .from('ESTUDIANTES')
      .select('Avatar')
      .eq('Email', user.email)
      .single();
    if (estudiante && estudiante.Avatar) {
      avatarUrl = estudiante.Avatar;
    }
  } catch (e) {
    // No hacer nada si no se encuentra el estudiante, el avatar será null.
  }

  // Si las contraseñas coinciden, el login es exitoso.
  // Creamos una "sesión" simple para el frontend.
  const session = {
    user: {
      id: user.usuario_id,
      email: user.email,
      nombre_usuario: user.nombre_usuario,
      avatar: avatarUrl // Añadimos el avatar a la sesión
    }
  };
  res.status(200).json({ message: 'Login exitoso', session: session });
});

app.get('/api/mis-cursos', async (req, res) => {
  const { email } = req.query; // Cambiado de req.body a req.query
  if (!email) {
    return res.status(400).json({ error: 'Email es requerido.' });
  }

  try {
    // 1. Encontrar al usuario por su email para obtener sus créditos y datos de sesión.
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (usuarioError) throw usuarioError;
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // 2. Encontrar el perfil de ESTUDIANTE asociado a ese email para obtener su EstudianteID.
    const { data: estudiante, error: estudianteError } = await supabase
      .from('ESTUDIANTES')
      .select('*') // Obtenemos todos los datos del estudiante
      .eq('Email', email)
      .single();

    // Si no hay perfil de estudiante, significa que no se ha inscrito a nada. Devolvemos una lista vacía.
    if (estudianteError || !estudiante) {
      // Aún así, devolvemos los datos básicos del usuario para mostrar su perfil
      const perfilBasico = {
        nombre_completo: usuario.nombre_usuario,
        email: usuario.email,
        Creditos: usuario.Creditos,
      };
      return res.json({ estudiante: perfilBasico, inscripciones: [] });
    }

    // 3. Combinar la información del usuario (créditos) y del estudiante (perfil)
    const perfilCompleto = { ...estudiante, Creditos: usuario.Creditos };

    // 4. Obtener todas las inscripciones usando el EstudianteID correcto.
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

    res.json({ estudiante: perfilCompleto, inscripciones });

  } catch (error) {
    console.error('Error fetching mis-cursos:', error.message);
    res.status(500).json({ error: 'No se pudieron obtener los datos de los cursos.' });
  }
});

app.post('/api/inscripciones', async (req, res) => {
  // Volvemos a usar los datos completos del formulario
  const { usuario_id, GrupoID, Nombre, Apellido, Email, Telefono, FechaNacimiento } = req.body;

  if (!usuario_id || !GrupoID || !Nombre || !Apellido || !Email || !Telefono || !FechaNacimiento) {
    return res.status(400).json({ error: 'Todos los campos del formulario son requeridos.' });
  }

  try {
    // --- NUEVA VALIDACIÓN DE CAPACIDAD ---
    // 1. Obtener la capacidad del grupo y el número actual de inscritos
    const { data: grupoData, error: grupoError } = await supabase
      .from('GRUPOS')
      .select('Capacidad, AsignaturaID, ASIGNATURAS ( Creditos ), INSCRIPCIONES (count)')
      .eq('GrupoID', GrupoID)
      .single();

    // Verificación robusta de que los datos del grupo y la asignatura se cargaron.
    if (grupoError || !grupoData || !grupoData.ASIGNATURAS) {
      console.error('Error al obtener datos del grupo o la asignatura asociada:', grupoError);
      throw new Error('No se pudo verificar la información del grupo.');
    }

    const capacidad = grupoData.Capacidad;
    // Corrección: Manejar el caso donde no hay inscripciones previas.
    const inscritos = grupoData.INSCRIPCIONES[0]?.count || 0;

    // 2. Validar si el grupo está lleno
    if (inscritos >= capacidad) {
      return res.status(409).json({ error: 'El grupo ya ha alcanzado su capacidad máxima. No se puede inscribir.' });
    }

    // 3. Buscar o crear al estudiante en la tabla ESTUDIANTES
    let { data: estudiante, error: findError } = await supabase
      .from('ESTUDIANTES')
      .select('EstudianteID')
      .eq('Email', Email)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw findError;
    }

    if (!estudiante) {
      // Si el estudiante no existe, lo creamos con los datos del formulario
      const { data: nuevoEstudiante, error: createError } = await supabase
        .from('ESTUDIANTES')
        .insert({ Nombre, Apellido, Email, Telefono, FechaNacimiento })
        .select('EstudianteID')
        .single();
      
      if (createError) throw createError;
      estudiante = nuevoEstudiante;
    }

    // 4. Validar si ya existe una inscripción para este estudiante y grupo
    const { data: existingInscripcion, error: checkInscripcionError } = await supabase
      .from('INSCRIPCIONES')
      .select('InscripcionID')
      .eq('EstudianteID', estudiante.EstudianteID)
      .eq('GrupoID', GrupoID)
      .single();

    if (checkInscripcionError && checkInscripcionError.code !== 'PGRST116') throw checkInscripcionError;
    if (existingInscripcion) return res.status(409).json({ error: 'Ya estás inscrito en este grupo.' });

    // --- NUEVO MÉTODO DE VERIFICACIÓN DE CRÉDITOS ---

    // 5. Obtener los créditos requeridos para la asignatura.
    const creditosRequeridos = grupoData.ASIGNATURAS.Creditos;
    if (typeof creditosRequeridos !== 'number') {
      console.error('Error Crítico: El costo en créditos de la asignatura no es un número válido.');
      return res.status(500).json({ error: 'No se pudo determinar el costo del curso.' });
    }

    // 6. Obtener los créditos actuales del usuario (de la tabla usuarios).
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('"Creditos"')
      .eq('usuario_id', usuario_id)
      .single();

    if (usuarioError) {
      console.error('Error de Base de Datos: No se pudo obtener el saldo del usuario.', usuarioError);
      throw new Error('No se pudo verificar el saldo del usuario.');
    }

    const creditosActuales = usuario.Creditos || 0;

    // 7. Comparar créditos y devolver error si son insuficientes.
    if (creditosActuales < creditosRequeridos) {
      return res.status(402).json({ error: `Créditos insuficientes. Tienes ${creditosActuales} y necesitas ${creditosRequeridos}.` });
    }

    // 8. Si hay créditos suficientes, proceder a descontarlos usando la función RPC.
    // CORRECCIÓN: Aseguramos el orden correcto de los parámetros para que coincida con la definición de la función SQL.
    const { error: decrementoError } = await supabase.rpc('decrementar_creditos', { // Usa la función con parámetros en orden alfabético
      p_cantidad: creditosRequeridos,
      p_id_usuario: usuario_id,
    });

    if (decrementoError) {
      console.error('Error de Base de Datos: La función decrementar_creditos falló.', decrementoError);
      throw new Error('Error al procesar los créditos.');
    }

    // 9. Crear la inscripción final usando el EstudianteID.
    const { error: inscripcionError } = await supabase
      .from('INSCRIPCIONES')
      .insert({ EstudianteID: estudiante.EstudianteID, GrupoID: GrupoID });

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
    // 1. Obtener los detalles de la inscripción para saber a quién y cuánto reembolsar.
    const { data: inscripcion, error: findError } = await supabase
      .from('INSCRIPCIONES')
      .select(`
        ESTUDIANTES ( Email ),
        GRUPOS ( ASIGNATURAS ( Creditos ) )
      `)
      .eq('InscripcionID', id)
      .single();

    if (findError || !inscripcion || !inscripcion.ESTUDIANTES) {
      return res.status(404).json({ error: 'Inscripción no encontrada.' });
    }

    // 2. Encontrar al usuario en la tabla 'usuarios' usando el email del estudiante inscrito.
    const emailEstudiante = inscripcion.ESTUDIANTES.Email;
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('usuario_id')
      .eq('email', emailEstudiante)
      .single();

    if (usuarioError || !usuario) {
      throw new Error('No se pudo encontrar la cuenta de usuario asociada para el reembolso.');
    }

    // 3. Reembolsar los créditos a la cuenta del usuario encontrada.
    const creditosAReembolsar = inscripcion.GRUPOS.ASIGNATURAS.Creditos;
    if (creditosAReembolsar > 0) {
      const { error: creditosError } = await supabase.rpc('incrementar_creditos', {
        p_id_usuario: usuario.usuario_id,
        p_cantidad: creditosAReembolsar
      });
      if (creditosError) throw new Error('No se pudo realizar el reembolso de créditos.');
    }
    // 4. Eliminar la inscripción de la base de datos.
    const { error: deleteError } = await supabase
      .from('INSCRIPCIONES')
      .delete()
      .eq('InscripcionID', id);

    if (deleteError) throw deleteError;

    res.json({ message: `Inscripción cancelada. Se han reembolsado ${creditosAReembolsar} créditos a tu cuenta.` });
  } catch (error) {
    console.error('Error al cancelar la inscripción:', error.message);
    res.status(500).json({ error: 'No se pudo cancelar la inscripción.' });
  }
});

// --- ENDPOINTS DE PAGOS ---

// Obtener historial de pagos de un usuario
app.get('/api/pagos', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email es requerido.' });
  }

  try {
    // 1. Encontrar al usuario por su email para obtener su ID
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('usuario_id')
      .eq('email', email)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 2. Obtener todos los pagos de ese usuario
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('*')
      .eq('usuario_id', usuario.usuario_id)
      .order('fecha_pago', { ascending: false });

    if (pagosError) throw pagosError;

    res.json(pagos);
  } catch (error) {
    console.error('Error fetching pagos:', error.message);
    res.status(500).json({ error: 'No se pudieron obtener los pagos.' });
  }
});

// Simular la creación de un pago
app.post('/api/pagos', async (req, res) => {
  const { usuario_id, monto, moneda, metodo_pago } = req.body;

  if (!usuario_id || !monto) {
    return res.status(400).json({ error: 'usuario_id y monto son requeridos.' });
  }

  try {
    const nuevoPago = {
      usuario_id,
      referencia_externa: `sim_${Date.now()}`, // Referencia de pago simulada
      monto,
      moneda: moneda || 'USD',
      metodo_pago: metodo_pago || 'Tarjeta de Crédito',
      estado_pago: 'COMPLETADO', // Asumimos que el pago es exitoso inmediatamente
    };

    const { data, error } = await supabase.from('pagos').insert(nuevoPago).select().single();
    if (error) throw error;

    // --- LÓGICA PARA AÑADIR CRÉDITOS ---
    if (metodo_pago === 'Compra de Créditos') {
      const PRECIO_POR_CREDITO = 20000;
      const creditosComprados = Math.floor(monto / PRECIO_POR_CREDITO);

      if (creditosComprados > 0) {
        // Usamos rpc para llamar a una función de base de datos que incrementa los créditos de forma atómica.
        // DEBES CREAR ESTA FUNCIÓN EN TU BASE DE DATOS SUPABASE.
        // Ve a SQL Editor > New Query y pega el código SQL que te proporcionaré.
        const { error: creditosError } = await supabase.rpc('incrementar_creditos', {
          p_id_usuario: usuario_id,
          p_cantidad: creditosComprados
        });
        if (creditosError) throw new Error('No se pudieron actualizar los créditos del usuario.');
      }
    }

    res.status(201).json({ message: 'Pago realizado con éxito.', pago: data });
  } catch (error) {
    console.error('Error al crear el pago:', error.message);
    res.status(500).json({ error: 'No se pudo procesar el pago.' });
  }
});

// Endpoint para subir/actualizar el avatar de un estudiante
app.post('/api/avatar', upload.single('avatar'), async (req, res) => {
  const { email } = req.body;
  if (!req.file || !email) {
    return res.status(400).json({ error: 'Se requiere un archivo de imagen y el email del usuario.' });
  }

  try {
    // 1. Definir el nombre y la ruta del archivo en Supabase Storage
    const fileName = `avatar_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const filePath = `public/${fileName}`;

    // 2. Subir el archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('Avatar') // CORRECCIÓN: Usar el nombre de bucket correcto "Avatar"
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error detallado de Supabase Storage (upload):', uploadError);
      throw new Error(`Error al subir el avatar: ${uploadError.message}`);
    }

    // 3. Obtener la URL pública del archivo subido
    const { data: urlData } = supabase.storage.from('Avatar').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // 4. Actualizar la columna 'Avatar' en la tabla ESTUDIANTES
    const { error: updateError } = await supabase
      .from('ESTUDIANTES')
      .update({ Avatar: publicUrl })
      .eq('Email', email);

    if (updateError) {
      console.error('Error detallado de Supabase DB (update):', updateError);
      throw new Error(`Error al actualizar la base de datos: ${updateError.message}`);
    }

    res.json({ message: 'Avatar actualizado con éxito.', avatarUrl: publicUrl });
  } catch (error) {
    console.error('Error completo en la subida del avatar:', error);
    res.status(500).json({ error: 'No se pudo actualizar el avatar. Revisa la consola del servidor para más detalles.' });
  }
});

app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`🚀 Server ready at: ${url}`);
});