const form = document.getElementById('registerForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = data.message;
            message.className = 'form-message success';
            form.reset();
        } else {
            message.textContent = data.error;
            message.className = 'form-message error';
        }
    } catch (err) {
        message.textContent = 'Could not connect to server. Please try again.';
        message.className = 'form-message error';
    }
});