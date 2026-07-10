const token = localStorage.getItem('token');
const userJSON = localStorage.getItem('user');

if (!token || !userJSON) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userJSON);
document.getElementById('userGreeting').textContent = user.fullname;


if (user.role === 'admin') {
    const adminLink = document.createElement('li');
    adminLink.innerHTML = '<a href="admin.html">Admin Panel</a>';
    document.querySelector('.nav-links').appendChild(adminLink);
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

const form = document.getElementById('reportLostForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);

    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/report-lost`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
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