const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const conectarBanco = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// 1. LISTAR TODOS OS USUÁRIOS (GET /users)
app.get('/users', async (req, res) => {
  try {
    // Traz todos os campos MENOS a senha (Regra 13)
    const users = await db.all('SELECT id, name, email, login, active FROM users');
    const formatados = users.map(u => ({ ...u, active: Boolean(u.active) }));
    res.status(200).json(formatados);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao buscar usuários.' });
  }
});

// 2. BUSCAR UM USUÁRIO POR ID (GET /users/:id)
app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, login, active FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.status(200).json({ ...user, active: Boolean(user.active) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
});

// 3. CADASTRAR NOVO USUÁRIO (POST /users)
app.post('/users', async (req, res) => {
  const { name, email, login, password, active } = req.body;

  // Validações das Regras de Negócio
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ erro: 'O nome é obrigatório e precisa ter pelo menos 3 caracteres.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  }
  if (!login || login.trim().length < 3) {
    return res.status(400).json({ erro: 'O login é obrigatório e precisa ter pelo menos 3 caracteres.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ erro: 'A senha é obrigatória e precisa ter pelo menos 8 caracteres.' });
  }

  try {
    // Checa se e-mail ou login já existem
    const existente = await db.get(
      'SELECT id FROM users WHERE email = ? OR login = ?',
      [email.trim(), login.trim()]
    );
    if (existente) {
      return res.status(400).json({ erro: 'Este e-mail ou login já está cadastrado no sistema.' });
    }

    // Feitiço da Bonnie: criptografa a senha antes de salvar
    const passwordHash = await bcrypt.hash(password, 10);
    const statusAtivo = active === undefined ? 1 : (active ? 1 : 0);

    const resultado = await db.run(
      'INSERT INTO users (name, email, login, password, active) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), login.trim(), passwordHash, statusAtivo]
    );

    // Devolve o usuário criado sem expor a senha (Status 201 Created)
    res.status(201).json({
      id: resultado.lastID,
      name: name.trim(),
      email: email.trim(),
      login: login.trim(),
      active: Boolean(statusAtivo)
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
  }
});

// 4. EDITAR USUÁRIO EXISTENTE (PUT /users/:id)
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, login, password, active } = req.body;

  try {
    const usuarioAtual = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!usuarioAtual) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ erro: 'O nome precisa ter pelo menos 3 caracteres.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (!login || login.trim().length < 3) {
      return res.status(400).json({ erro: 'O login precisa ter pelo menos 3 caracteres.' });
    }

    // Verifica duplicidade em OUTROS usuários (id != atual)
    const duplicado = await db.get(
      'SELECT id FROM users WHERE (email = ? OR login = ?) AND id != ?',
      [email.trim(), login.trim(), id]
    );
    if (duplicado) {
      return res.status(400).json({ erro: 'Já existe outro usuário com este e-mail ou login.' });
    }

    // Se mandou senha nova, valida e criptografa; se deixou em branco na edição, mantém a antiga
    let senhaFinal = usuarioAtual.password;
    if (password && password.length > 0) {
      if (password.length < 8) {
        return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 8 caracteres.' });
      }
      senhaFinal = await bcrypt.hash(password, 10);
    }

    const statusAtivo = active === undefined ? usuarioAtual.active : (active ? 1 : 0);

    await db.run(
      'UPDATE users SET name = ?, email = ?, login = ?, password = ?, active = ? WHERE id = ?',
      [name.trim(), email.trim(), login.trim(), senhaFinal, statusAtivo, id]
    );

    res.status(200).json({
      id: Number(id),
      name: name.trim(),
      email: email.trim(),
      login: login.trim(),
      active: Boolean(statusAtivo)
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
});

// 5. EXCLUIR USUÁRIO (DELETE /users/:id)
app.delete('/users/:id', async (req, res) => {
  try {
    const resultado = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (resultado.changes === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado para exclusão.' });
    }
    res.status(200).json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir usuário.' });
  }
});

// Inicia o cofre e abre o servidor
conectarBanco().then((conexao) => {
  db = conexao;
  app.listen(3000, () => {
    console.log('Backend completo rodando em http://localhost:3000');
  });
});