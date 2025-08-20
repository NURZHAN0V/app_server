const express = require('express');
const db = require('./config/db');

const app = express();
const port = 3000;

app.use(express.json())

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

// Задачи CRUD
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Поле title пустое' })

  const sql = 'INSERT INTO tasks (title) VALUES (?)';
  db.run(sql, [title], (err) => {
    if (err) return res.status(500).json({ error: 'Не удалось создать задачу' });

    res.status(201).json({
      message: 'Задача успешно создана',
      title: title
    });
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