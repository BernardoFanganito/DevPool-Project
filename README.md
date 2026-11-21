# DevPool Project

Sistema de gestão de usuários com backend em Node.js, Express e SQLite, e frontend em HTML, CSS e JavaScript puro.

## Como rodar

1. Entre na pasta do backend e instale as dependências:

   ```bash
   cd backend
   npm install
   ```

2. Inicie o servidor (roda em http://localhost:3000):

   ```bash
   node server.js
   ```

3. Abra o arquivo `frontend/index.html` no navegador.

## Funcionalidades

- Listar, cadastrar, editar e excluir usuários
- Validação de dados no backend
- Senhas armazenadas com hash (bcryptjs)