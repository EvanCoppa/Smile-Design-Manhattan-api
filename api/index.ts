const express = require('express');
const data = require('./data');
const business = require('./business');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));

app.use(cors({
  origin: 'https://guaranteeth-slides.vercel.app', // or your actual frontend domain
  credentials: true
}));

// Authentication Routes
app.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (data.getUserByEmail(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hash = business.hashPassword(password);
    const user = data.createUser(email, hash);
    res.status(201).json({ id: user.UserId, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = data.getUserByEmail(email);
    if (!user || !business.verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', (req, res) => {
  try {
    const rows = data.getUsers();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Clients Routes ----
app.get('/clients', async (req, res) => {
  try {
    const rows = data.getClients();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/clients/:id', async (req, res) => {
  try {
    const row = data.getClientById(req.params.id);
    if (!row) return res.sendStatus(404);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const row = data.createClient(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/clients/:id', async (req, res) => {
  try {
    const row = data.updateClient(req.params.id, req.body);
    if (!row) return res.sendStatus(404);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/clients/:id', async (req, res) => {
  try {
    data.deleteClient(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Providers Routes ----
app.get('/providers', async (req, res) => {
  try {
    const rows = data.getProviders();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/providers', async (req, res) => {
  try {
    const row = data.createProvider(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/providers/:id', async (req, res) => {
  try {
    const row = data.updateProvider(req.params.id, req.body);
    if (!row) return res.sendStatus(404);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/providers/:id', async (req, res) => {
  try {
    data.deleteProvider(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Billables Routes ----
app.get('/billables', async (req, res) => {
  try {
    const rows = data.getBillables();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/billables', async (req, res) => {
  try {
    const row = data.createBillable(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/billables/:code', async (req, res) => {
  try {
    const row = data.updateBillable(req.params.code, req.body);
    if (!row) return res.sendStatus(404);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/billables/:code', async (req, res) => {
  try {
    data.deleteBillable(req.params.code);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Visits Routes ----
app.get('/visits', async (req, res) => {
  try {
    const rows = data.getVisits();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/visits/:id', async (req, res) => {
  try {
    const visit = data.getVisitById(req.params.id);
    if (!visit) return res.sendStatus(404);
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/visits', async (req, res) => {
  try {
    const newVisit = data.createVisit(req.body);
    res.status(201).json(newVisit);
  } catch (err) {
    res.status(500).json({ error: err.message + "hello"});
  }
});

app.get('/images/:id', async (req, res) => {
  try {
    const image = data.getImageById(req.params.id);
    if (!image) return res.sendStatus(404);
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/visits/:id', async (req, res) => {
  try {
    const row = data.updateVisit(req.params.id, req.body);
    if (!row) return res.sendStatus(404);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/visits/:id', async (req, res) => {
  try {
    data.deleteVisit(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
    res.send('Smile Design Manhattan API');
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

