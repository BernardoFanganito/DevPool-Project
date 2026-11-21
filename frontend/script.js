const API_URL = 'http://localhost:3000/users';

const form = document.getElementById('form-usuario');
const tabela = document.getElementById('tabela-usuarios');
const alerta = document.getElementById('alerta');
const loading = document.getElementById('loading');
const contador = document.getElementById('contador-usuarios');
const tituloForm = document.getElementById('titulo-form');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');

// Mostra mensagem visual de sucesso ou erro
function mostrarAlerta(mensagem, tipo) {
  alerta.textContent = mensagem;
  alerta.className = `alerta ${tipo}`;
  setTimeout(() => {
    alerta.classList.add('escondido');
  }, 4000);
}

// Busca todos os usuários na API (GET /users)
async function carregarUsuarios() {
  loading.classList.remove('escondido');
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error('Falha ao buscar usuários.');
    const usuarios = await resposta.json();

    contador.textContent = `${usuarios.length} usuário(s)`;
    tabela.innerHTML = '';

    if (usuarios.length === 0) {
      tabela.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum usuário cadastrado ainda.</td></tr>';
      return;
    }

    usuarios.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${user.id}</td>
        <td><strong>${user.name}</strong></td>
        <td>${user.login}</td>
        <td>${user.email}</td>
        <td>
          <span class="status-pill ${user.active ? 'status-ativo' : 'status-inativo'}">
            ${user.active ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <button class="btn-acao btn-editar" onclick="prepararEdicao(${user.id})">Editar</button>
          <button class="btn-acao btn-excluir" onclick="excluirUsuario(${user.id}, '${user.name}')">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (erro) {
    mostrarAlerta('Erro ao conectar com o servidor. Verifique se o backend está ligado.', 'erro');
  } finally {
    loading.classList.add('escondido');
  }
}

// Cadastra ou Edita usuário (POST /users ou PUT /users/:id)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('user-id').value;
  const dados = {
    name: document.getElementById('name').value,
    login: document.getElementById('login').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    active: document.getElementById('active').checked
  };

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    const url = id ? `${API_URL}/${id}` : API_URL;
    const metodo = id ? 'PUT' : 'POST';

    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAlerta(resultado.erro || 'Erro ao salvar usuário.', 'erro');
      return;
    }

    mostrarAlerta(id ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!', 'sucesso');
    resetarFormulario();
    carregarUsuarios();
  } catch (erro) {
    mostrarAlerta('Falha de comunicação com o servidor.', 'erro');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = document.getElementById('user-id').value ? 'Salvar Alterações' : 'Inscrever';
  }
});

// Preenche o formulário para edição (GET /users/:id)
async function prepararEdicao(id) {
  try {
    const resposta = await fetch(`${API_URL}/${id}`);
    const user = await resposta.json();

    if (!resposta.ok) {
      mostrarAlerta(user.erro || 'Usuário não encontrado.', 'erro');
      return;
    }

    document.getElementById('user-id').value = user.id;
    document.getElementById('name').value = user.name;
    document.getElementById('login').value = user.login;
    document.getElementById('email').value = user.email;
    document.getElementById('password').value = '';
    document.getElementById('password').placeholder = 'Nova senha (deixe vazio p/ manter)';
    document.getElementById('active').checked = user.active;

    tituloForm.textContent = `Editando #${user.id}`;
    btnSalvar.textContent = 'Salvar Alterações';
    btnCancelar.classList.remove('escondido');
  } catch (erro) {
    mostrarAlerta('Erro ao carregar dados do usuário.', 'erro');
  }
}

// Exclui com confirmação obrigatória (DELETE /users/:id)
async function excluirUsuario(id, nome) {
  const confirmou = confirm(`Tem certeza que deseja excluir permanentemente o usuário "${nome}"?`);
  if (!confirmou) return;

  try {
    const resposta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAlerta(resultado.erro || 'Erro ao excluir.', 'erro');
      return;
    }

    mostrarAlerta('Usuário excluído com sucesso!', 'sucesso');
    carregarUsuarios();
  } catch (erro) {
    mostrarAlerta('Erro de conexão ao tentar excluir.', 'erro');
  }
}

function resetarFormulario() {
  form.reset();
  document.getElementById('user-id').value = '';
  document.getElementById('active').checked = true;
  document.getElementById('password').placeholder = 'Senha (mín. 8 caracteres)';
  tituloForm.textContent = 'Criar uma conta';
  btnSalvar.textContent = 'Inscrever';
  btnCancelar.classList.add('escondido');
}

btnCancelar.addEventListener('click', resetarFormulario);

// Carrega a lista assim que a página abre
carregarUsuarios();