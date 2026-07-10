const token = localStorage.getItem('token');
const userJSON = localStorage.getItem('user');

if (!token || !userJSON) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userJSON);

if (user.role !== 'admin') {
    alert('Access denied. Admins only.');
    window.location.href = 'dashboard.html';
}

document.getElementById('userGreeting').textContent = user.fullname;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

const adminLink = document.createElement('li');
adminLink.innerHTML = '<a href="admin.html" class="active">Admin Panel</a>';
document.querySelector('.nav-links').appendChild(adminLink);

const atabButtons = document.querySelectorAll('.atab-btn');
const adminItemsSection = document.getElementById('adminItemsSection');
const adminUsersSection = document.getElementById('adminUsersSection');

atabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        atabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.atab;
        adminItemsSection.style.display = target === 'items' ? 'block' : 'none';
        adminUsersSection.style.display = target === 'users' ? 'block' : 'none';
    });
});

async function loadAdminItems() {
    const loading = document.getElementById('adminItemsLoading');
    const container = document.getElementById('adminItemsTable');

    try {
        const response = await fetch('http://localhost:3000/admin/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await response.json();

        loading.style.display = 'none';

        const rows = items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.type}</td>
                <td>${item.category}</td>
                <td>${item.reporter_name}</td>
                <td>${item.status}</td>
                <td><button class="btn-delete" data-id="${item.id}">Delete</button></td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Title</th><th>Type</th><th>Category</th><th>Reported By</th><th>Status</th><th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(btn.dataset.id));
        });
    } catch (err) {
        loading.textContent = 'Could not load items.';
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`http://localhost:3000/admin/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadAdminItems();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete item.');
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
}

async function loadAdminUsers() {
    const loading = document.getElementById('adminUsersLoading');
    const container = document.getElementById('adminUsersTable');

    try {
        const response = await fetch('http://localhost:3000/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        loading.style.display = 'none';

        const rows = users.map(u => {
            const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
            const dateFormatted = new Date(u.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            return `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.fullname}</td>
                    <td>${u.email}</td>
                    <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                    <td>${dateFormatted}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (err) {
        loading.textContent = 'Could not load users.';
    }
}

loadAdminItems();
loadAdminUsers();