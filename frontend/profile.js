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

document.getElementById('profileName').textContent = user.fullname;
document.getElementById('profileEmail').textContent = user.email;
document.getElementById('profileAvatar').textContent = user.fullname.charAt(0).toUpperCase();

const ptabButtons = document.querySelectorAll('.ptab-btn');
const myItemsSection = document.getElementById('myItemsSection');
const claimsReceivedSection = document.getElementById('claimsReceivedSection');

ptabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        ptabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.ptab;
        myItemsSection.style.display = target === 'myItems' ? 'block' : 'none';
        claimsReceivedSection.style.display = target === 'claimsReceived' ? 'block' : 'none';
    });
});

// async function loadMyItems() {
//     const loading = document.getElementById('myItemsLoading');
//     const grid = document.getElementById('myItemsGrid');

//     try {
//         const response = await fetch('http://localhost:3000/my-items', {
//             headers: { 'Authorization': `Bearer ${token}` }
//         });
//         const items = await response.json();

//         loading.style.display = 'none';

//         if (items.length === 0) {
//             grid.innerHTML = '<p class="loading-text">You haven\'t reported any items yet.</p>';
//             return;
//         }

//         grid.innerHTML = items.map(item => {
//             const imageHtml = item.image_url
//                 ? `<img src="http://localhost:3000/uploads/${item.image_url}" alt="${item.title}" class="item-image">`
//                 : `<div class="item-image-placeholder">📦</div>`;
//             const badgeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';

//             return `
//                 <div class="item-card">
//                     ${imageHtml}
//                     <div class="item-body">
//                         <span class="item-badge ${badgeClass}">${item.type}</span>
//                         <div class="item-title">${item.title}</div>
//                         <div class="item-category">${item.category}</div>
//                         <div class="item-footer">Status: ${item.status}</div>
//                     </div>
//                 </div>
//             `;
//         }).join('');
//     } catch (err) {
//         loading.textContent = 'Could not load your items.';
//     }
// }

async function loadMyItems() {
    const loading = document.getElementById('myItemsLoading');
    const grid = document.getElementById('myItemsGrid');

    try {
        const response = await fetch('http://localhost:3000/my-items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await response.json();

        loading.style.display = 'none';

        if (items.length === 0) {
            grid.innerHTML = '<p class="loading-text">You haven\'t reported any items yet.</p>';
            return;
        }

        grid.innerHTML = items.map(item => {
            const imageHtml = item.image_url
                ? `<img src="http://localhost:3000/uploads/${item.image_url}" alt="${item.title}" class="item-image">`
                : `<div class="item-image-placeholder">📦</div>`;
            const badgeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';

            const returnButtonHtml = item.status === 'active'
                ? `<button class="btn-return" data-id="${item.id}">Mark as Returned</button>`
                : `<span class="returned-label">✓ Returned</span>`;

            return `
                <div class="item-card">
                    ${imageHtml}
                    <div class="item-body">
                        <span class="item-badge ${badgeClass}">${item.type}</span>
                        <div class="item-title">${item.title}</div>
                        <div class="item-category">${item.category}</div>
                        <div class="item-footer">Status: ${item.status}</div>
                        ${returnButtonHtml}
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-return').forEach(btn => {
            btn.addEventListener('click', () => markAsReturned(btn.dataset.id));
        });
    } catch (err) {
        loading.textContent = 'Could not load your items.';
    }
}

async function markAsReturned(itemId) {
    if (!confirm('Mark this item as returned?')) return;

    try {
        const response = await fetch(`http://localhost:3000/items/${itemId}/return`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            loadMyItems();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
}

async function loadClaimsReceived() {
    const loading = document.getElementById('claimsLoading');
    const list = document.getElementById('claimsList');

    try {
        const response = await fetch('http://localhost:3000/my-claims-received', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const claims = await response.json();

        loading.style.display = 'none';

        if (claims.length === 0) {
            list.innerHTML = '<p class="loading-text">No claims have been made on your items yet.</p>';
            return;
        }

        list.innerHTML = claims.map(claim => {
            const dateFormatted = new Date(claim.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            return `
                <div class="claim-card">
                    <div class="claim-info">
                        <h3>${claim.item_title} (${claim.item_type})</h3>
                        <div class="claim-meta">Claimed by ${claim.claimant_name} (${claim.claimant_email}) · ${dateFormatted}</div>
                        <div class="claim-message">${claim.message || 'No message provided.'}</div>
                    </div>
                    <span class="claim-status">${claim.status}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        loading.textContent = 'Could not load claims.';
    }
}

loadMyItems();
loadClaimsReceived();