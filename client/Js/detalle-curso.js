document.addEventListener('DOMContentLoaded', () => {
    const detalleContainer = document.getElementById('detalle-asignatura');
    const gruposContainer = document.getElementById('lista-grupos');

    // Obtener el ID de la asignatura desde la URL
    const params = new URLSearchParams(window.location.search);
    const asignaturaId = params.get('id');

    if (!asignaturaId) {
        detalleContainer.innerHTML = '<p class="text-danger">No se especificó una asignatura.</p>';
        return;
    }

    // Cargar detalles de la asignatura y sus grupos
    const cargarDetalles = async () => {
        try {
            const response = await fetch(`/api/asignaturas/${asignaturaId}`);
            if (!response.ok) throw new Error('No se pudo cargar la información.');
            const { asignatura, grupos } = await response.json();

            // Usamos una imagen por defecto si no hay una en la base de datos
            const imageUrl = asignatura.Imagen || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop';

            // Mostrar detalles de la asignatura
            detalleContainer.innerHTML = `
                <div class="row g-5 align-items-center">
                    <div class="col-lg-6">
                        <div class="asignatura-header p-5 bg-white rounded-3 shadow-sm">
                            <h1 class="display-5 fw-bold">${asignatura.NombreAsignatura}</h1>
                            <p class="fs-4 text-muted">Código: ${asignatura.CodigoAsignatura}</p>
                            <hr class="my-4">
                            <p><strong>Créditos:</strong> ${asignatura.Creditos} | <strong>Horas Totales:</strong> ${asignatura.TotalHoras}</p>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <img src="${imageUrl}" class="img-fluid rounded shadow-lg" alt="Imagen de ${asignatura.NombreAsignatura}">
                    </div>
                </div>
            `;

            // Mostrar grupos existentes
            gruposContainer.innerHTML = '';
            if (grupos.length > 0) {
                grupos.forEach(grupo => {
                    const horariosHtml = grupo.HORARIOS.length > 0
                        ? `<ul class="horarios-list mt-2 text-muted">
                            ${grupo.HORARIOS.map(h => `<li><i class="bi bi-clock"></i> ${h.DiaSemana}: ${h.HoraInicio.substring(0,5)} - ${h.HoraFin.substring(0,5)} (Salón: ${h.Salon})</li>`).join('')}
                           </ul>`
                        : '<p class="text-muted small mt-2">Sin horarios asignados.</p>';

                    gruposContainer.innerHTML += `
                        <div class="col">
                            <div class="card h-100 shadow-sm grupo-card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Grupo ${grupo.NumeroGrupo}</h5>
                                    <span class="badge bg-success">${grupo.PERIODOS_ACADEMICOS.NombrePeriodo || 'Sin Periodo'}</span>
                                </div>
                                <div class="card-body">
                                    <p class="mb-2 profesor-info">
                                        <i class="bi bi-person-fill"></i> <strong>Profesor:</strong> ${grupo.PROFESORES.Nombre} ${grupo.PROFESORES.Apellido}
                                        <span class="badge bg-info text-dark ms-2">${grupo.PROFESORES.Departamento}</span>
                                    </p>
                                    <p class="mb-2"><strong>Capacidad:</strong> ${grupo.Capacidad} estudiantes</p>
                                    <hr>
                                    <h6 class="card-subtitle mb-2 text-muted">Horarios:</h6>
                                    ${horariosHtml}
                                </div>
                                <div class="card-footer bg-transparent border-0 text-center pb-3">
                                    <button class="btn btn-success btn-inscribir w-100" data-grupoid="${grupo.GrupoID}">Inscribirse</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                gruposContainer.innerHTML = '<p class="text-muted">Aún no hay grupos para esta asignatura.</p>';
            }

        } catch (error) {
            console.error('Error:', error);
            detalleContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // Carga inicial
    cargarDetalles();
});