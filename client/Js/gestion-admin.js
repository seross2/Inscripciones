document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario es admin, si no, redirigir.
    const sessionData = localStorage.getItem('app.session');
    if (!sessionData || JSON.parse(sessionData).user.rol_id !== 2) {
        // alert('Acceso denegado. Debes ser administrador.');
        window.location.href = '/';
        return;
    }

    // Saludo personalizado para el admin en el header
    const session = JSON.parse(sessionData);
    const adminGreeting = document.getElementById('admin-greeting');
    if (adminGreeting && session.user) {
        adminGreeting.innerHTML = `Hola Dios, <span class="fw-bold text-white">${session.user.nombre_usuario}</span>`;
    }

    const asignaturasBody = document.getElementById('tabla-asignaturas-body');
    const profesoresBody = document.getElementById('tabla-profesores-body');
    const gruposBody = document.getElementById('tabla-grupos-body');
    const horariosBody = document.getElementById('tabla-horarios-body');

    // --- MODALES ---
    const asignaturaModal = new bootstrap.Modal(document.getElementById('modal-asignatura'));
    const formAsignatura = document.getElementById('form-asignatura');
    const modalAsignaturaLabel = document.getElementById('modalAsignaturaLabel');

    // --- FUNCIONES GENÉRICAS ---
    const fetchData = async (endpoint) => {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Error al cargar datos de ${endpoint}`);
        return response.json();
    };

    const deleteData = async (endpoint, id, callback) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
        try {
            const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar.');
            callback(); // Recargar la tabla
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    // --- GESTIÓN DE ASIGNATURAS ---
    const cargarAsignaturas = async () => {
        try {
            const asignaturas = await fetchData('/api/asignaturas');
            asignaturasBody.innerHTML = '';
            asignaturas.forEach(asig => {
                asignaturasBody.innerHTML += `
                    <tr>
                        <td>${asig.AsignaturaID}</td>
                        <td>${asig.NombreAsignatura}</td>
                        <td>${asig.CodigoAsignatura}</td>
                        <td>${asig.Creditos}</td>
                        <td>${asig.TotalHoras}</td>
                        <td class="action-buttons">
                            <button class="btn btn-warning btn-sm btn-editar-asignatura" data-id="${asig.AsignaturaID}" data-bs-toggle="modal" data-bs-target="#modal-asignatura">Editar</button>
                            <button class="btn btn-danger btn-sm btn-borrar-asignatura" data-id="${asig.AsignaturaID}">Borrar</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error(error);
            asignaturasBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    asignaturasBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-borrar-asignatura')) {
            const id = e.target.dataset.id;
            deleteData('/api/asignaturas', id, cargarAsignaturas);
        }
        if (e.target.classList.contains('btn-editar-asignatura')) {
            const id = e.target.dataset.id;
            const response = await fetch(`/api/asignaturas/${id}`);
            const { asignatura } = await response.json();

            modalAsignaturaLabel.textContent = 'Editar Asignatura';
            document.getElementById('asignatura-id').value = asignatura.AsignaturaID;
            document.getElementById('asignatura-nombre').value = asignatura.NombreAsignatura;
            document.getElementById('asignatura-codigo').value = asignatura.CodigoAsignatura;
            document.getElementById('asignatura-creditos').value = asignatura.Creditos;
            document.getElementById('asignatura-horas').value = asignatura.TotalHoras;
            document.getElementById('asignatura-imagen-url').value = asignatura.Imagen || '';
        }
    });

    // Limpiar modal de asignatura al abrir para "Nueva Asignatura"
    document.getElementById('modal-asignatura').addEventListener('show.bs.modal', (event) => {
        // Si el botón que disparó el modal NO es de editar, limpiamos el form.
        if (!event.relatedTarget.classList.contains('btn-editar-asignatura')) {
            modalAsignaturaLabel.textContent = 'Nueva Asignatura';
            formAsignatura.reset();
            document.getElementById('asignatura-id').value = '';
            // Limpiar el campo de archivo por si acaso
            document.getElementById('asignatura-imagen-file').value = '';
        }
    });

    // Enviar formulario de asignatura (Crear/Editar)
    formAsignatura.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('asignatura-id').value;
        const esEdicion = !!id;

        const codigoAsignatura = document.getElementById('asignatura-codigo').value;
        let imageUrl = document.getElementById('asignatura-imagen-url').value;
        const imagenFile = document.getElementById('asignatura-imagen-file').files[0];

        // Si se seleccionó un archivo, subirlo primero
        if (imagenFile) {
            const formData = new FormData();
            formData.append('imagen', imagenFile);
            formData.append('codigo_asignatura', codigoAsignatura);

            try {
                const uploadResponse = await fetch('/api/asignaturas/upload-imagen', {
                    method: 'POST',
                    body: formData,
                });
                const uploadResult = await uploadResponse.json();
                if (!uploadResponse.ok) throw uploadResult;
                imageUrl = uploadResult.imageUrl; // Usar la nueva URL de la imagen subida
            } catch (uploadError) {
                const mensajeDiv = document.getElementById('modal-asignatura-mensaje');
                mensajeDiv.innerHTML = `<div class="alert alert-danger">${uploadError.error || 'Error al subir la imagen.'}</div>`;
                return; // Detener el guardado si la subida falla
            }
        }

        const body = {
            NombreAsignatura: document.getElementById('asignatura-nombre').value,
            CodigoAsignatura: codigoAsignatura,
            Creditos: parseInt(document.getElementById('asignatura-creditos').value),
            TotalHoras: parseInt(document.getElementById('asignatura-horas').value),
            Imagen: imageUrl, // Añadir la URL de la imagen al cuerpo de la petición
        };

        const endpoint = esEdicion ? `/api/asignaturas/${id}` : '/api/asignaturas';
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) throw result;

            asignaturaModal.hide();
            cargarAsignaturas();

        } catch (error) {
            const mensajeDiv = document.getElementById('modal-asignatura-mensaje');
            mensajeDiv.innerHTML = `<div class="alert alert-danger">${error.error || 'Ocurrió un error.'}</div>`;
        }
    });

    // --- GESTIÓN DE PROFESORES ---
    const cargarProfesores = async () => {
        try {
            // Nota: El endpoint actual solo devuelve ID, Nombre y Apellido. Lo ajustaremos para que devuelva todo.
            // Por ahora, vamos a crear un endpoint que sí devuelva todo.
            const response = await fetch('/api/profesores/all'); // Asumimos que crearemos este endpoint
            if (!response.ok) throw new Error('No se pudo cargar la lista completa de profesores.');
            const profesores = await response.json();

            profesoresBody.innerHTML = '';
            profesores.forEach(prof => {
                profesoresBody.innerHTML += `
                    <tr>
                        <td>${prof.ProfesorID}</td>
                        <td>${prof.Nombre}</td>
                        <td>${prof.Apellido}</td>
                        <td>${prof.Email}</td>
                        <td>${prof.Departamento}</td>
                        <td class="action-buttons">
                            <button class="btn btn-warning btn-sm btn-editar-profesor" data-id="${prof.ProfesorID}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-borrar-profesor" data-id="${prof.ProfesorID}">Borrar</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error(error);
            profesoresBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    profesoresBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-profesor')) {
            const id = e.target.dataset.id;
            deleteData('/api/profesores', id, cargarProfesores);
        }
        if (e.target.classList.contains('btn-editar-profesor')) {
            alert('Funcionalidad de editar aún no implementada.');
        }
    });

    // --- GESTIÓN DE GRUPOS ---
    const cargarGrupos = async () => {
        try {
            const grupos = await fetchData('/api/grupos');
            gruposBody.innerHTML = '';
            grupos.forEach(g => {
                // Manejar casos donde las relaciones son nulas
                const nombreAsignatura = g.ASIGNATURAS ? g.ASIGNATURAS.NombreAsignatura : 'N/A';
                const nombreProfesor = g.PROFESORES ? `${g.PROFESORES.Nombre} ${g.PROFESORES.Apellido}` : 'N/A';
                const nombrePeriodo = g.PERIODOS_ACADEMICOS ? g.PERIODOS_ACADEMICOS.NombrePeriodo : 'N/A';

                gruposBody.innerHTML += `
                    <tr>
                        <td>${g.GrupoID}</td>
                        <td>${g.NumeroGrupo}</td>
                        <td>${nombreAsignatura}</td>
                        <td>${nombreProfesor}</td>
                        <td>${nombrePeriodo}</td>
                        <td>${g.Capacidad}</td>
                        <td class="action-buttons">
                            <button class="btn btn-warning btn-sm btn-editar-grupo" data-id="${g.GrupoID}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-borrar-grupo" data-id="${g.GrupoID}">Borrar</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error(error);
            gruposBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    gruposBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-grupo')) {
            const id = e.target.dataset.id;
            deleteData('/api/grupos', id, cargarGrupos);
        }
        if (e.target.classList.contains('btn-editar-grupo')) {
            alert('Funcionalidad de editar aún no implementada.');
        }
    });

    // --- GESTIÓN DE HORARIOS ---
    const cargarHorarios = async () => {
        try {
            const horarios = await fetchData('/api/horarios');
            horariosBody.innerHTML = '';
            horarios.forEach(h => {
                const infoGrupo = h.GRUPOS ? `G${h.GRUPOS.NumeroGrupo} (${h.GRUPOS.ASIGNATURAS.NombreAsignatura})` : 'Sin asignar';
                horariosBody.innerHTML += `
                    <tr>
                        <td>${h.HorarioID}</td>
                        <td>${infoGrupo}</td>
                        <td>${h.DiaSemana}</td>
                        <td>${h.HoraInicio.substring(0, 5)}</td>
                        <td>${h.HoraFin.substring(0, 5)}</td>
                        <td>${h.Salon}</td>
                        <td class="action-buttons">
                            <button class="btn btn-warning btn-sm btn-editar-horario" data-id="${h.HorarioID}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-borrar-horario" data-id="${h.HorarioID}">Borrar</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error(error);
            horariosBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    horariosBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-horario')) {
            const id = e.target.dataset.id;
            deleteData('/api/horarios', id, cargarHorarios);
        }
        if (e.target.classList.contains('btn-editar-horario')) {
            alert('Funcionalidad de editar aún no implementada.');
        }
    });

    // --- Carga Inicial ---
    const init = () => {
        cargarAsignaturas();
        cargarProfesores();
        cargarGrupos();
        cargarHorarios();
    };

    init();
});

// Para que la carga de profesores funcione, necesitamos un endpoint que devuelva todos los datos.
// Añade esto a tu server.js:
/*
app.get('/api/profesores/all', async (req, res) => {
  try {
    const { data, error } = await supabase.from('PROFESORES').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all profesores.' });
  }
});
*/