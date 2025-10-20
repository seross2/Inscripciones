document.addEventListener('DOMContentLoaded', () => {
    const formRestablecer = document.getElementById('form-restablecer');
    const mensajeContainer = document.getElementById('mensaje-container');
    const submitButton = formRestablecer.querySelector('button[type="submit"]');

    const mostrarMensaje = (mensaje, tipo = 'danger') => {
        mensajeContainer.innerHTML = `<div class="alert alert-${tipo}" role="alert">${mensaje}</div>`;
    };

    // Supabase maneja el token de la URL automáticamente.
    // Cuando el usuario llega a esta página desde el enlace del correo,
    // Supabase crea una sesión de "recuperación de contraseña".

    formRestablecer.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = document.getElementById('floatingPassword').value;
        const confirmPassword = document.getElementById('floatingConfirmPassword').value;

        if (!password || !confirmPassword) {
            mostrarMensaje('Ambos campos de contraseña son requeridos.');
            return;
        }

        if (password !== confirmPassword) {
            mostrarMensaje('Las contraseñas no coinciden.');
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Actualizando...`;

        try {
            // Para usar las funciones de Supabase en el cliente, necesitamos un cliente de Supabase.
            // Lo creamos aquí con la clave pública (anon key).
            const SUPABASE_URL = 'https://jalzujkplxioipiatwiw.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHp1amtwbHhpb2lwaWF0d2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0MjMsImV4cCI6MjA3NTM0NTQyM30.A2BEqJqKg5E_SqKi1s4P7r1m-qPH4doyJiKQoKmD8Lw';
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Usamos la función de Supabase para actualizar la contraseña del usuario.
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;

            mostrarMensaje('¡Contraseña actualizada con éxito! Serás redirigido para iniciar sesión.', 'success');

            setTimeout(() => {
                window.location.href = '/Login.html';
            }, 3000);

        } catch (error) {
            mostrarMensaje(error.message || 'El enlace de recuperación puede haber expirado.');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Nueva Contraseña';
        }
    });
});