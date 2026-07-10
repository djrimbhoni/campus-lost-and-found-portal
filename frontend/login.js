const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('${API_BASE_URL}/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            message.textContent = 'Login successful! Redirecting...';
            message.className = 'form-message success';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            message.textContent = data.error;
            message.className = 'form-message error';
        }
    } catch (err) {
        message.textContent = 'Could not connect to server. Please try again.';
        message.className = 'form-message error';
    }
});