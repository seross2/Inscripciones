document.addEventListener('DOMContentLoaded', () => {
    const formRecuperar = document.getElementById('form-recuperar');
    const mensajeContainer = document.getElementById('mensaje-container');

    const mostrarMensaje = (mensaje, tipo = 'danger') => {
        mensajeContainer.innerHTML = `<div class="alert alert-${tipo}" role="alert">${mensaje}</div>`;
    };

    formRecuperar.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = formRecuperar.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;

        const email = document.getElementById('floatingInput').value;

        if (!email) {
            mostrarMensaje('Por favor, ingresa tu correo electrónico.');
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Instrucciones';
            return;
        }

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            // Por seguridad, siempre mostramos un mensaje genérico para no revelar si un email existe o no.
            mostrarMensaje(result.message, 'success');
            // Actualizamos el botón para que refleje que el proceso terminó.
            submitButton.innerHTML = 'Enviado';
        } catch (error) {
            mostrarMensaje('Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.');
            // Si hay un error, reactivamos el botón para que el usuario pueda intentarlo de nuevo.
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Instrucciones';
        }
    });
});