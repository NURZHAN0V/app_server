const express = require('express');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const JWT_SECRET = 'Секретная-фраза-в-2025-ГОДУ'

app.use(express.json())

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return res.status(401).json({ error: "Нужен токен авторизации" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Токен недействительный или истек" });
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.send('Привет, мир! Сервер обновился!')
});

app.get('/info', (req, res) => {
  res.json({
    server: 'App Server',
    version: '0.0.2',
    status: 'работает'
  });
});

app.get('/hello/:name', (req, res) => {
  const name = req.params.name;
  res.json({ message: `Привет, ${name}!` });
});

// Задачи CRUD: Create, Read, Update, Delete
app.post('/tasks', authenticate, (req, res) => {
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Поле title пустое' })

  const sql = 'INSERT INTO tasks (title, user_id) VALUES (?, ?)';
  db.run(sql, [title, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Не удалось создать задачу' });

    res.status(201).json({
      message: 'Задача успешно создана',
      title: title
    });
  });
});

app.get('/tasks', authenticate, (req, res) => {
  const sql = 'SELECT id, title, done, created_at FROM tasks WHERE user_id = ?';
  db.all(sql, [req.user.id], (err, tasks) => {
    if (err) return res.status(500).json({ error: "Не удалось получить задачи" });
    res.json(tasks);
  });
});

app.get('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT id, title, done, created_at FROM tasks WHERE id = ? AND user_id = ?';
  db.get(sql, [id, req.user.id], (err, task) => {
    if (err) return res.status(500).json({ error: "Не удалось получить задачи" });
    res.json(task);
  });
});

app.put('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { title, done } = req.body;

  if (!title) return res.status(400).json({ error: "Поле title не найдено" });

  const sql = `UPDATE tasks SET title = ?, done = ? WHERE id = ? AND user_id = ?`;

  db.run(sql, [title, done, id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: "Не удалось обновить задачу" });
    res.json({ success: "Данные успешно обновлены" });
  });
});

app.delete('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
  db.run(sql, [id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: "Не удалось удалить задачу" });
    res.json({ success: "Задача была удалена" });
  });
});

// здесь будут маршруты для пользователей

// регистрация пользователя
app.post('/auth/register', (req, res) => {
  const { email, pass } = req.body;

  const password_hash = bcrypt.hashSync(pass, 10);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password_hash], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.status(201).json({
      message: "пользователь успешно создан",
      email
    });
  });
});

// авторизация
app.post('/auth/login', (req, res) => {
  const { email, pass } = req.body;

  db.get('SELECT id, email, password FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = bcrypt.compareSync(pass, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({
      id: user.id,
      email: user.email
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token
    });
  });
});

app.get('/me', authenticate, (req, res) => {
  db.get(`SELECT id, email, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: "Не удалось получить пользователя" });
    console.log(user);
    
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    res.json({ user })
  });
});


app.listen(port, () => {
  console.log(`Приложение запущено и работает на порту ${port}`)
});

// закрытие базы данных по завершению работы сервера
const shutdown = () => {
  console.log("Останавливаем сервер...");

  db.close(err => {
    if (err) {
      console.error('Не получилось закрыть базу');
      process.exit(1);
    }
    console.log('База закрыта. До встречи!');
    process.exit(0);
  })
}

process.on('SIGINT', shutdown)
process.off('SIGTERM', shutdown)