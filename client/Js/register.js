const formRegistro = document.getElementById('form-register');
const mensajeError = document.getElementById('mensaje-error');

formRegistro.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional
    mensajeError.textContent = '';

    // Combinamos nombre y apellido para el 'nombre_usuario'
    const nombre = document.getElementById('floatingFirstName').value;
    const apellido = document.getElementById('floatingLastName').value;
    const nombre_usuario = `${nombre} ${apellido}`.trim();

    const email = document.getElementById('floatingInput').value;
    const password = document.getElementById('floatingPassword').value;
    const confirmPassword = document.getElementById('floatingConfirmPassword').value;

    if (password !== confirmPassword) {
        mensajeError.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    if (!nombre_usuario || !email || !password) {
        mensajeError.textContent = 'Por favor, completa todos los campos requeridos.';
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre_usuario, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ocurrió un error desconocido.');
        }

        alert(data.message); // Muestra el mensaje "Usuario registrado..."
        window.location.href = '/Login.html'; // Redirige a la página de login

    } catch (error) {
        mensajeError.textContent = error.message;
        console.error('Error en el registro:', error);
    }
});