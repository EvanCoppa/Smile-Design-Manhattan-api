// Data access layer for SQLite database
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Ensure the Users table exists
db.prepare(`CREATE TABLE IF NOT EXISTS Users (
  UserId INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL
)`).run();

function run(sql, params = []) {
  const info = db.prepare(sql).run(...params);
  return { id: info.lastInsertRowid, changes: info.changes };
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

// Client operations
function getClients() {
  return all('SELECT * FROM Clients');
}

function getClientById(id) {
  return get('SELECT * FROM Clients WHERE ClientId = ?', [id]);
}

// Provider lookup
function getProviderById(id) {
  return get('SELECT * FROM Providers WHERE ProviderId = ?', [id]);
}

// Billable lookup
function getBillableByCode(code) {
  return get('SELECT * FROM Billables WHERE BillableCode = ?', [code]);
}

function createClient(data) {
  const { firstName, lastName, DOB, Phone, Email, Address } = data;
  const result = run(
    'INSERT INTO Clients (FirstName, LastName, DOB, Phone, Email, Address) VALUES (?,?,?,?,?,?)',
    [firstName, lastName, DOB, Phone, Email, Address]
  );
  return getClientById(result.id);
}

function updateClient(id, data) {
  const { firstName, lastName, DOB, Phone, Email, Address } = data;
  run(
    'UPDATE Clients SET FirstName = ?, LastName = ?, DOB = ?, Phone = ?, Email = ?, Address = ? WHERE ClientId = ?',
    [firstName, lastName, DOB, Phone, Email, Address, id]
  );
  return getClientById(id);
}

function deleteClient(id) {
  run('DELETE FROM Clients WHERE ClientId = ?', [id]);
}

// Provider operations
function getProviders() {
  return all('SELECT * FROM Providers');
}

function createProvider(data) {
  const { firstName, lastName, Specialty, Phone, Email } = data;
  const result = run(
    'INSERT INTO Providers (FirstName, LastName, Specialty, Phone, Email) VALUES (?,?,?,?,?)',
    [firstName, lastName, Specialty, Phone, Email]
  );
  return get('SELECT * FROM Providers WHERE ProviderId = ?', [result.id]);
}

function updateProvider(id, data) {
  const { firstName, lastName, Specialty, Phone, Email } = data;
  run(
    'UPDATE Providers SET FirstName = ?, LastName = ?, Specialty = ?, Phone = ?, Email = ? WHERE ProviderId = ?',
    [firstName, lastName, Specialty, Phone, Email, id]
  );
  return get('SELECT * FROM Providers WHERE ProviderId = ?', [id]);
}

function deleteProvider(id) {
  run('DELETE FROM Providers WHERE ProviderId = ?', [id]);
}

// Billable operations
function getBillables() {
  return all('SELECT * FROM Billables');
}

function createBillable(data) {
  const { BillableCode, Description, Cost } = data;
  run(
    'INSERT INTO Billables (BillableCode, Description, Cost) VALUES (?,?,?)',
    [BillableCode, Description, Cost]
  );
  return get('SELECT * FROM Billables WHERE BillableCode = ?', [BillableCode]);
}

function updateBillable(code, data) {
  const { Description, Cost } = data;
  run(
    'UPDATE Billables SET Description = ?, Cost = ? WHERE BillableCode = ?',
    [Description, Cost, code]
  );
  return get('SELECT * FROM Billables WHERE BillableCode = ?', [code]);
}

function deleteBillable(code) {
  run('DELETE FROM Billables WHERE BillableCode = ?', [code]);
}

// ----- Helpers to ensure foreign key rows exist -----
function ensureClientExists(id) {
  if (!getClientById(id)) {
    const c = createClient({ firstName: 'Unknown', lastName: 'Unknown' });
    return c.ClientId;
  }
  return id;
}

function ensureProviderExists(id) {
  if (!getProviderById(id)) {
    const p = createProvider({ firstName: 'Unknown', lastName: 'Unknown' });
    return p.ProviderId;
  }
  return id;
}

function ensureBillableExists(code) {
  if (!getBillableByCode(code)) {
    createBillable({ BillableCode: code, Description: 'Auto created', Cost: 0 });
  }
}

// Visit operations
function getVisits() {
  return all('SELECT * FROM Visits');
}

function getVisitById(id) {
  const visit = get('SELECT * FROM Visits WHERE VisitId = ?', [id]);
  if (!visit) return undefined;
  const details = all('SELECT * FROM VisitDetails WHERE VisitId = ?', [id]);
  const images = all('SELECT ImageId, ImageName, ImageType FROM VisitImages WHERE VisitId = ?', [id]);
  return { ...visit, details, images };
}

function getImageById(id) {
  return get('SELECT ImageId, ImageName, ImageType, ImageData FROM VisitImages WHERE ImageId = ?', [id]);
}

function createVisit(data) {
  let { ClientId, ProviderId, VisitDate, Paid, Notes, details = [], images = [] } = data;

  // ensure related rows exist
  ClientId = ensureClientExists(ClientId);
  ProviderId = ensureProviderExists(ProviderId);
  for (const d of details) {
    ensureBillableExists(d.BillableCode);
  }

  const result = run(
    'INSERT INTO Visits (ClientId, ProviderId, VisitDate, Paid, Notes) VALUES (?,?,?,?,?)',
    [ClientId, ProviderId, VisitDate, Paid ? 1 : 0, Notes]
  );
  const visitId = result.id;

  for (const d of details) {
    run(
      'INSERT INTO VisitDetails (VisitId, BillableCode, Quantity) VALUES (?,?,?)',
      [visitId, d.BillableCode, d.Quantity || 1]
    );
  }

  for (const img of images) {
    run(
      'INSERT INTO VisitImages (VisitId, ImageName, ImageType, ImageData) VALUES (?,?,?,?)',
      [visitId, img.name, img.type, img.data]
    );
  }

  return getVisitById(visitId);
}

function updateVisit(id, data) {
  const { ClientId, ProviderId, VisitDate, Paid, Notes } = data;
  run(
    'UPDATE Visits SET ClientId = ?, ProviderId = ?, VisitDate = ?, Paid = ?, Notes = ? WHERE VisitId = ?',
    [ClientId, ProviderId, VisitDate, Paid ? 1 : 0, Notes, id]
  );
  return get('SELECT * FROM Visits WHERE VisitId = ?', [id]);
}

function deleteVisit(id) {
  run('DELETE FROM VisitDetails WHERE VisitId = ?', [id]);
  run('DELETE FROM VisitImages WHERE VisitId = ?', [id]);
  run('DELETE FROM Visits WHERE VisitId = ?', [id]);
}

// User operations
function createUser(email, passwordHash) {
  const result = run(
    'INSERT INTO Users (email, passwordHash) VALUES (?, ?)',
    [email, passwordHash]
  );
  return get('SELECT * FROM Users WHERE UserId = ?', [result.id]);
}

function getUserByEmail(email) {
  return get('SELECT * FROM Users WHERE email = ?', [email]);
}

function getUsers() {
  return all('SELECT UserId, email FROM Users');
}

module.exports = {
  getClients,
  getClientById,
  getProviderById,
  getBillableByCode,
  createClient,
  updateClient,
  deleteClient,
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getBillables,
  createBillable,
  updateBillable,
  deleteBillable,
  ensureClientExists,
  ensureProviderExists,
  ensureBillableExists,
  getVisits,
  getVisitById,
  getImageById,
  createVisit,
  updateVisit,
  deleteVisit,
  createUser,
  getUserByEmail,
  getUsers,
};

