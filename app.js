const express = require('express')
const app = express()
const port = 3000

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

app.listen(port, () => {
  console.log(`Приложение запущено и работает на порту ${port}`)
})
