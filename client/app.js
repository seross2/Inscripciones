// Esta constante es la que "conecta" el frontend con el backend.
// Apunta a la dirección donde está corriendo tu servidor Node.js.
const API_URL = 'http://localhost:3000/api';

const form = document.getElementById('form-nueva-asignatura');
const tablaBody = document.querySelector('#tabla-asignaturas tbody');
const errorMessage = document.getElementById('error-message');

async function cargarAsignaturas() {
    try {
        // Hacemos la petición (fetch) a la URL del backend
        const response = await fetch(`${API_URL}/asignaturas`);
        if (!response.ok) throw new Error('No se pudieron cargar las asignaturas.');

        const asignaturas = await response.json();
        tablaBody.innerHTML = '';
        asignaturas.forEach(asig => {
            const fila = `
                <tr>
                    <td>${asig.id}</td>
                    <td>${asig.nombre_asignatura}</td>
                    <td>${asig.codigo_asignatura}</td>
                    <td>${asig.creditos}</td>
                    <td>${asig.total_horas}</td>
                </tr>
            `;
            tablaBody.innerHTML += fila;
        });
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Error al conectar con el servidor.';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    errorMessage.textContent = '';

    const nuevaAsignatura = {
        nombre_asignatura: document.getElementById('nombre').value,
        codigo_asignatura: document.getElementById('codigo').value,
        creditos: parseInt(document.getElementById('creditos').value),
        total_horas: parseInt(document.getElementById('horas').value)
    };

    try {
        const response = await fetch(`${API_URL}/asignaturas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaAsignatura),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al crear la asignatura.');

        form.reset();
        cargarAsignaturas();
    } catch (error) {
        console.error('Error al enviar:', error);
        errorMessage.textContent = error.message;
    }
}

document.addEventListener('DOMContentLoaded', cargarAsignaturas);
form.addEventListener('submit', handleFormSubmit);
