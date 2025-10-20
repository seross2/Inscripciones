document.addEventListener('DOMContentLoaded', () => {
    const formRegister = document.getElementById('form-register');
    const mensajeError = document.getElementById('mensaje-error'); // Usamos el p para errores

    formRegister.addEventListener('submit', async (event) => {
        event.preventDefault();
        mensajeError.textContent = ''; // Limpiamos errores previos

        // NOTA: El HTML de registro no tiene un campo para 'nombre_usuario' (floatingUsername).
        // Usaremos los campos de nombre y apellido.
        const nombre = document.getElementById('floatingFirstName').value;
        const apellido = document.getElementById('floatingLastName').value;
        const email = document.getElementById('floatingInput').value;
        const password = document.getElementById('floatingPassword').value;
        const confirmPassword = document.getElementById('floatingConfirmPassword').value;

        if (!nombre || !email || !password || !confirmPassword) {
            mensajeError.textContent = 'Todos los campos son obligatorios.';
            return;
        }

        if (password !== confirmPassword) {
            mensajeError.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Enviamos un nombre de usuario combinando nombre y apellido
                body: JSON.stringify({ nombre_usuario: `${nombre} ${apellido}`, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo registrar el usuario.');
            }

            alert(data.message); // Usamos el alert simple
            window.location.href = '/Login.html'; // Redirigimos inmediatamente

        } catch (error) {
            mensajeError.textContent = error.message;
            console.error('Error en el registro:', error);
        }
    });
});