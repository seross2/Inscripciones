// Esta constante es la que "conecta" el frontend con el backend.
// Apunta a la dirección donde está corriendo tu servidor Node.js.
const API_URL = 'http://localhost:3000/api';

// --- Configuración del Cliente de Supabase para el Frontend ---
// REEMPLAZA CON TUS PROPIAS CLAVES DE SUPABASE
const SUPABASE_URL = 'https://jalzujkplxioipiatwiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHp1amtwbHhpb2lwaWF0d2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0MjMsImV4cCI6MjA3NTM0NTQyM30.A2BEqJqKg5E_SqKi1s4P7r1m-qPH4doyJiKQoKmD8Lw';

// Necesitas la librería de Supabase en tu HTML para que esto funcione.
// Añade esto en el <head> de GestionAdmin.html: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Selectores para Asignaturas ---
const formAsignatura = document.getElementById('form-nueva-asignatura');
const tablaBodyAsignaturas = document.querySelector('#tabla-asignaturas tbody');
const errorAsignatura = document.getElementById('error-message-asignatura');

// --- Selectores para Profesores ---
const formProfesor = document.getElementById('form-nuevo-profesor');
const tablaBodyProfesores = document.querySelector('#tabla-profesores tbody');
const errorProfesor = document.getElementById('error-message-profesor');

async function cargarAsignaturas() {
    try {
        // Hacemos la petición (fetch) a la URL del backend
        const response = await fetch(`${API_URL}/asignaturas`);
        if (!response.ok) throw new Error('No se pudieron cargar las asignaturas.');
        errorAsignatura.textContent = '';

        const asignaturas = await response.json();
        tablaBodyAsignaturas.innerHTML = '';
        asignaturas.forEach(asig => {
            const fila = `
                <tr>
                    <td>${asig.AsignaturaID}</td>
                    <td>${asig.NombreAsignatura}</td>
                    <td>${asig.CodigoAsignatura}</td>
                    <td>${asig.Creditos}</td>
                    <td>${asig.TotalHoras}</td>
                </tr>
            `;
            tablaBodyAsignaturas.innerHTML += fila;
        });
    } catch (error) {
        console.error('Error:', error);
        errorAsignatura.textContent = 'Error al conectar con el servidor para cargar asignaturas.';
    }
}

async function handleAsignaturaSubmit(event) {
    event.preventDefault();
    errorAsignatura.textContent = '';

    const nuevaAsignatura = {
        nombre_asignatura: document.getElementById('nombre').value,
        codigo_asignatura: document.getElementById('codigo').value,
        creditos: parseInt(document.getElementById('creditos').value),
        total_horas: parseInt(document.getElementById('horas').value),
        // Simplemente tomamos el texto del campo de la URL
        imagen_url: document.getElementById('imagen').value,
        descripcion_curso: document.getElementById('descripcion').value
    };

    try {
        const response = await fetch(`${API_URL}/asignaturas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaAsignatura),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al crear la asignatura.');

        formAsignatura.reset();
        cargarAsignaturas();
    } catch (error) {
        console.error('Error al enviar:', error);
        errorAsignatura.textContent = error.message;
    }
}

async function cargarProfesores() {
    try {
        const response = await fetch(`${API_URL}/profesores`);
        if (!response.ok) throw new Error('No se pudieron cargar los profesores.');
        errorProfesor.textContent = '';

        const profesores = await response.json();
        tablaBodyProfesores.innerHTML = '';
        profesores.forEach(prof => {
            const fila = `
                <tr>
                    <td>${prof.ProfesorID}</td>
                    <td>${prof.Nombre}</td>
                    <td>${prof.Apellido}</td>
                    <td>${prof.Email}</td>
                    <td>${prof.Departamento || 'N/A'}</td>
                </tr>
            `;
            tablaBodyProfesores.innerHTML += fila;
        });
    } catch (error) {
        console.error('Error:', error);
        errorProfesor.textContent = 'Error al conectar con el servidor para cargar profesores.';
    }
}

async function handleProfesorSubmit(event) {
    event.preventDefault();
    errorProfesor.textContent = '';

    const nuevoProfesor = {
        nombre: document.getElementById('profesor-nombre').value,
        apellido: document.getElementById('profesor-apellido').value,
        email: document.getElementById('profesor-email').value,
        departamento: document.getElementById('profesor-departamento').value,
    };

    try {
        const response = await fetch(`${API_URL}/profesores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProfesor),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al crear el profesor.');

        formProfesor.reset();
        cargarProfesores();
    } catch (error) {
        console.error('Error al enviar:', error);
        errorProfesor.textContent = error.message;
    }
}

// Asegúrate de que el bucket 'imagenes-cursos' exista en Supabase Storage
// y que tenga políticas de acceso público para poder ver las imágenes.
// Puedes crearlo desde el dashboard de Supabase -> Storage.

document.addEventListener('DOMContentLoaded', () => {
    cargarAsignaturas();
    cargarProfesores();
});
formAsignatura.addEventListener('submit', handleAsignaturaSubmit);
formProfesor.addEventListener('submit', handleProfesorSubmit);
