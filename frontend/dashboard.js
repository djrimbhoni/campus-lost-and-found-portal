const token = localStorage.getItem('token');
const userJSON = localStorage.getItem('user');

if (!token || !userJSON) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userJSON);
document.getElementById('welcomeMessage').textContent = `Welcome, ${user.fullname}! 👋`;
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