const token = localStorage.getItem('token');
const userJSON = localStorage.getItem('user');

if (token && userJSON) {
    const user = JSON.parse(userJSON);
    document.getElementById('userGreeting').textContent = user.fullname;
    if (user.role === 'admin') {
    const adminLink = document.createElement('li');
    adminLink.innerHTML = '<a href="admin.html">Admin Panel</a>';
    document.querySelector('.nav-links').appendChild(adminLink);
}
} else {
    document.querySelector('.nav-right').style.display = 'none';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

const itemsGrid = document.getElementById('itemsGrid');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const tabButtons = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

let allItems = [];
let currentTypeFilter = 'all';
let currentCategoryFilter = 'all';
let currentSearchTerm = '';

async function fetchItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        const data = await response.json();

        if (response.ok) {
            allItems = data;
            renderItems();
        } else {
            loadingMessage.textContent = 'Failed to load items.';
        }
    } catch (err) {
        loadingMessage.textContent = 'Could not connect to server.';
    }
}

function renderItems() {
    let filteredItems = allItems;

    if (currentTypeFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.type === currentTypeFilter);
    }

    if (currentCategoryFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentCategoryFilter);
    }

    if (currentSearchTerm.trim() !== '') {
        const term = currentSearchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(term);
            const descMatch = (item.description || '').toLowerCase().includes(term);
            return titleMatch || descMatch;
        });
    }

    loadingMessage.style.display = 'none';

    if (filteredItems.length === 0) {
        emptyMessage.style.display = 'block';
        itemsGrid.innerHTML = '';
        return;
    }

    emptyMessage.style.display = 'none';

    const currentUser = userJSON ? JSON.parse(userJSON) : null;

    itemsGrid.innerHTML = filteredItems.map(item => {
        const imageHtml = item.image_url
            ? `<img src="${item.image_url}" alt="${item.title}" class="item-image">`
            : `<div class="item-image-placeholder">📦</div>`;

        const badgeClass = item.status === 'returned'
            ? 'badge-returned'
            : (item.type === 'lost' ? 'badge-lost' : 'badge-found');
        const badgeLabel = item.status === 'returned' ? 'returned' : item.type;
        const dateFormatted = new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        const canClaim = item.type === 'lost' && item.status === 'active' && currentUser && currentUser.id !== item.user_id;
        const claimButtonHtml = canClaim
            ? `<button class="btn-claim" data-item-id="${item.id}" data-item-title="${item.title}">Claim This</button>`
            : '';

        return `
            <div class="item-card">
                ${imageHtml}
                <div class="item-body">
                    <span class="item-badge ${badgeClass}">${badgeLabel}</span>
                    <div class="item-title">${item.title}</div>
                    <div class="item-category">${item.category}</div>
                    <p class="item-description">${item.description || 'No description provided.'}</p>
                    <div class="item-footer">Reported by ${item.reporter_name} · ${dateFormatted}</div>
                    ${claimButtonHtml}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-claim').forEach(btn => {
        btn.addEventListener('click', () => openClaimModal(btn.dataset.itemId, btn.dataset.itemTitle));
    });
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTypeFilter = btn.dataset.filter;
        renderItems();
    });
});

categoryFilter.addEventListener('change', () => {
    currentCategoryFilter = categoryFilter.value;
    renderItems();
});

let searchDebounceTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        currentSearchTerm = searchInput.value;
        renderItems();
    }, 250);
});

fetchItems();

const claimModal = document.getElementById('claimModal');
const claimItemTitle = document.getElementById('claimItemTitle');
const claimText = document.getElementById('claimText');
const claimMessage = document.getElementById('claimMessage');
const cancelClaimBtn = document.getElementById('cancelClaimBtn');
const submitClaimBtn = document.getElementById('submitClaimBtn');

let activeItemId = null;

function openClaimModal(itemId, itemTitle) {
    activeItemId = itemId;
    claimItemTitle.textContent = itemTitle;
    claimText.value = '';
    claimMessage.textContent = '';
    claimModal.classList.add('show');
}

function closeClaimModal() {
    claimModal.classList.remove('show');
    activeItemId = null;
}

cancelClaimBtn.addEventListener('click', closeClaimModal);

claimModal.addEventListener('click', (event) => {
    if (event.target === claimModal) {
        closeClaimModal();
    }
});

submitClaimBtn.addEventListener('click', async () => {
    if (!activeItemId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ itemId: activeItemId, message: claimText.value })
        });

        const data = await response.json();

        if (response.ok) {
            claimMessage.textContent = data.message;
            claimMessage.className = 'form-message success';
            setTimeout(closeClaimModal, 1500);
        } else {
            claimMessage.textContent = data.error;
            claimMessage.className = 'form-message error';
        }
    } catch (err) {
        claimMessage.textContent = 'Could not connect to server.';
        claimMessage.className = 'form-message error';
    }
});