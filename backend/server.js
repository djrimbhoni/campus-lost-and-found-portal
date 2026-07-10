// const express = require('express');
// const db = require('./db');
// const app = express();
// const PORT = 3000;

// app.get('/', (req, res) => {
//     res.send('🎉 Campus Lost & Found backend is alive!');
// });

// app.listen(PORT, () => {
//     console.log(`Server is running at http://localhost:${PORT}`);
// });

require('dotenv').config();
const authMiddleware = require('./authMiddleware');
const adminMiddleware = require('./adminMiddleware');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const upload = require('./upload');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('🎉 Campus Lost & Found backend is alive!');
});

app.post('/register', (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Something went wrong.' });
        }

        const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';
        db.query(sql, [fullname, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'An account with this email already exists.' });
                }
                console.error(err);
                return res.status(500).json({ error: 'Database error.' });
            }

            res.status(201).json({ message: 'Registration successful!' });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Something went wrong.' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            res.status(200).json({
                message: 'Login successful!',
                token: token,
                user: { id: user.id, fullname: user.fullname, email: user.emai, role: user.role }
            });
        });
    });
});

app.post('/report-lost', authMiddleware, upload.single('image'), (req, res) => {
    const { title, description, category } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? req.file.filename : null;

    if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required.' });
    }

    const sql = 'INSERT INTO items (user_id, type, title, description, category, image_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, 'lost', title, description, category, imageUrl], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        res.status(201).json({ message: 'Lost item reported successfully!', itemId: result.insertId });
    });
});

app.post('/report-found', authMiddleware, upload.single('image'), (req, res) => {
    const { title, description, category } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? req.file.filename : null;

    if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required.' });
    }

    const sql = 'INSERT INTO items (user_id, type, title, description, category, image_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, 'found', title, description, category, imageUrl], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        res.status(201).json({ message: 'Found item reported successfully!', itemId: result.insertId });
    });
});

app.get('/items', (req, res) => {
    const sql = `
        SELECT items.*, users.fullname AS reporter_name
        FROM items
        JOIN users ON items.user_id = users.id
        ORDER BY items.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        res.status(200).json(results);
    });
});

app.post('/claim', authMiddleware, (req, res) => {
    const { itemId, message } = req.body;
    const claimantId = req.user.id;

    if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required.' });
    }

    const checkSql = 'SELECT user_id FROM items WHERE id = ?';
    db.query(checkSql, [itemId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        if (results[0].user_id === claimantId) {
            return res.status(400).json({ error: 'You cannot claim your own reported item.' });
        }

        const insertSql = 'INSERT INTO claims (item_id, claimant_id, message) VALUES (?, ?, ?)';
        db.query(insertSql, [itemId, claimantId, message], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'You have already claimed this item.' });
                }
                console.error(err);
                return res.status(500).json({ error: 'Database error.' });
            }

            res.status(201).json({ message: 'Claim submitted successfully! The reporter will be notified.' });
        });
    });
});

app.get('/my-items', authMiddleware, (req, res) => {
    const userId = req.user.id;

    const sql = 'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        res.status(200).json(results);
    });
});

app.get('/my-claims-received', authMiddleware, (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT claims.*, items.title AS item_title, items.type AS item_type,
               users.fullname AS claimant_name, users.email AS claimant_email
        FROM claims
        JOIN items ON claims.item_id = items.id
        JOIN users ON claims.claimant_id = users.id
        WHERE items.user_id = ?
        ORDER BY claims.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        res.status(200).json(results);
    });
});

app.get('/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    const sql = 'SELECT id, fullname, email, role, created_at FROM users ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }
        res.status(200).json(results);
    });
});

app.get('/admin/items', authMiddleware, adminMiddleware, (req, res) => {
    const sql = `
        SELECT items.*, users.fullname AS reporter_name
        FROM items
        JOIN users ON items.user_id = users.id
        ORDER BY items.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }
        res.status(200).json(results);
    });
});

app.delete('/admin/items/:id', authMiddleware, adminMiddleware, (req, res) => {
    const itemId = req.params.id;

    const sql = 'DELETE FROM items WHERE id = ?';
    db.query(sql, [itemId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        res.status(200).json({ message: 'Item deleted successfully.' });
    });
});

app.patch('/items/:id/return', authMiddleware, (req, res) => {
    const itemId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const checkSql = 'SELECT user_id, status FROM items WHERE id = ?';
    db.query(checkSql, [itemId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        const item = results[0];
        const isOwner = item.user_id === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'You can only mark your own items as returned.' });
        }

        if (item.status === 'returned') {
            return res.status(400).json({ error: 'This item is already marked as returned.' });
        }

        const updateSql = 'UPDATE items SET status = ? WHERE id = ?';
        db.query(updateSql, ['returned', itemId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error.' });
            }

            res.status(200).json({ message: 'Item marked as returned!' });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});