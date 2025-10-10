document.addEventListener('DOMContentLoaded', () => {
    const perfilContainer = document.getElementById('perfil-estudiante');
    const inscripcionesContainer = document.getElementById('lista-inscripciones');
    const noInscripcionesMsg = document.getElementById('no-inscripciones');
    const filtroNombre = document.getElementById('filtro-nombre-curso');
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const filtroEstado = document.getElementById('filtro-estado');
    const notificacionesContainer = document.getElementById('notificaciones-container');
    const confirmacionModal = new bootstrap.Modal(document.getElementById('modal-confirmar-cancelacion'));
    const cancelarInscripcionIdInput = document.getElementById('cancelar-inscripcion-id');
    const btnConfirmarCancelacion = document.getElementById('btn-confirmar-cancelacion');

    let todasLasInscripciones = [];

    // Función para renderizar las inscripciones
    const renderInscripciones = (inscripciones) => {
        inscripcionesContainer.innerHTML = '';
        if (inscripciones.length === 0) {
            noInscripcionesMsg.style.display = 'block';
        } else {
            noInscripcionesMsg.style.display = 'none';
            inscripciones.forEach(insc => {
                const card = `
                    <div class="col">
                        <div class="card h-100 shadow-sm inscription-card">
                            <div class="card-body">
                                <h5 class="card-title">${insc.GRUPOS.ASIGNATURAS.NombreAsignatura}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">Grupo: ${insc.GRUPOS.NumeroGrupo}</h6>
                                <p class="card-text">
                                    <strong>Profesor:</strong> ${insc.GRUPOS.PROFESORES.Nombre} ${insc.GRUPOS.PROFESORES.Apellido}<br>
                                    <strong>Periodo:</strong> ${insc.GRUPOS.PERIODOS_ACADEMICOS.NombrePeriodo}<br>
                                    <strong>Estado:</strong> <span class="badge bg-info">${insc.EstadoInscripcion}</span>
                                </p>
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-danger btn-cancelar" data-inscripcionid="${insc.InscripcionID}">Cancelar Inscripción</button>
                                </div>
                            </div>
                            <div class="card-footer text-muted">
                                Inscrito el: ${new Date(insc.FechaInscripcion).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                `;
                inscripcionesContainer.innerHTML += card;
            });
        }
    };

    // Función para aplicar filtros
    const aplicarFiltros = () => {
        const nombreQuery = filtroNombre.value.toLowerCase();
        const periodoId = filtroPeriodo.value;
        const estadoQuery = filtroEstado.value;

        const inscripcionesFiltradas = todasLasInscripciones.filter(insc => {
            const matchNombre = insc.GRUPOS.ASIGNATURAS.NombreAsignatura.toLowerCase().includes(nombreQuery);
            const matchPeriodo = !periodoId || insc.GRUPOS.PeriodoID.toString() === periodoId;
            const matchEstado = !estadoQuery || insc.EstadoInscripcion.toLowerCase() === estadoQuery;
            return matchNombre && matchPeriodo && matchEstado;
        });

        renderInscripciones(inscripcionesFiltradas);
    };

    // Cargar datos iniciales
    const cargarDatos = async () => {
        const sessionData = localStorage.getItem('app.session');
        if (!sessionData) {
            window.location.href = '/Login.html'; // Redirigir si no hay sesión
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            const userEmail = session.user.email;

            const response = await fetch(`/api/mis-cursos?email=${encodeURIComponent(userEmail)}`);
            if (!response.ok) throw new Error('No se pudieron cargar tus datos.');
            
            const { estudiante, inscripciones } = await response.json();

            // Renderizar perfil
            perfilContainer.innerHTML = `
                <div class="card profile-card">
                    <div class="card-header">Perfil del Estudiante</div>
                    <div class="card-body">
                        <h5 class="card-title">${estudiante.Nombre} ${estudiante.Apellido}</h5>
                        <p class="card-text"><strong>Email:</strong> ${estudiante.Email}</p>
                        <p class="card-text"><strong>Teléfono:</strong> ${estudiante.Telefono}</p>
                    </div>
                </div>
            `;

            // Guardar y renderizar inscripciones
            todasLasInscripciones = inscripciones;
            renderInscripciones(todasLasInscripciones);

            // Cargar opciones de filtro de periodo
            const periodos = [...new Set(inscripciones.map(i => i.GRUPOS.PeriodoID))];
            const periodosData = inscripciones.map(i => i.GRUPOS.PERIODOS_ACADEMICOS);
            periodos.forEach(id => {
                const periodo = periodosData.find(p => p.PeriodoID === id);
                if (periodo) {
                    filtroPeriodo.innerHTML += `<option value="${periodo.PeriodoID}">${periodo.NombrePeriodo}</option>`;
                }
            });

        } catch (error) {
            console.error('Error:', error);
            perfilContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // Event listeners para los filtros
    filtroNombre.addEventListener('input', aplicarFiltros);
    filtroPeriodo.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);

    // Función para mostrar notificaciones
    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        notificacionesContainer.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        // La notificación se puede cerrar manualmente o desaparecerá si se muestra otra.
    };

    // Event listener para los botones de cancelar
    inscripcionesContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-cancelar')) {
            const inscripcionId = event.target.getAttribute('data-inscripcionid');
            // Guardar el ID en el input oculto del modal y mostrarlo
            cancelarInscripcionIdInput.value = inscripcionId;
            confirmacionModal.show();
        }
    });

    // Event listener para el botón de confirmación final en el modal
    btnConfirmarCancelacion.addEventListener('click', async () => {
        const inscripcionId = cancelarInscripcionIdInput.value;
        if (!inscripcionId) return;

        try {
            const response = await fetch(`/api/inscripciones/${inscripcionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'No se pudo cancelar la inscripción.');
            }

            confirmacionModal.hide(); // Ocultar el modal de confirmación
            mostrarNotificacion(result.message, 'success');
            cargarDatos(); // Recargar la lista de inscripciones
        } catch (error) {
            confirmacionModal.hide();
            mostrarNotificacion(error.message, 'danger');
        }
    });

    cargarDatos();
});