# 🎫 Sistema de Chamados

Sistema completo de gerenciamento de tickets com integração de email, desenvolvido em Flask + HTML/CSS/JavaScript.

## ✨ Funcionalidades

- 📧 **Recebimento automático via email** - Converte emails em tickets
- 🎯 **Gerenciamento completo** - Criar, editar, responder tickets
- 📊 **Dashboard com métricas** - Relatórios e gráficos em tempo real
- 🔄 **Sistema de prioridades** - Baixa, Média, Alta
- 💬 **Notas internas** - Comunicação entre agentes
- 🌙 **Modo escuro/claro** - Interface moderna e responsiva
- 🔍 **Busca e filtros** - Encontre tickets rapidamente

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 2. Configurar Email (Opcional)
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
EMAIL_USERNAME=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
```

### 3. Executar o Sistema
```bash
python backend.py
```

### 4. Acessar a Aplicação
- **Interface**: http://127.0.0.1:5000/
- **API Docs**: http://127.0.0.1:5000/apidocs/

## 🔐 Login Padrão

- **Usuário**: Mateus Assis
- **Senha**: LOUVRE

## 📁 Estrutura do Projeto

```
├── backend.py          # API Flask principal
├── index.html          # Interface web
├── script.js           # Lógica do frontend
├── email_reader.py     # Módulo de integração com email
├── requirements.txt    # Dependências Python
├── .env.example       # Exemplo de configuração
└── README.md          # Documentação
```

## 🛠️ Tecnologias

- **Backend**: Flask, Python
- **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS
- **Gráficos**: Chart.js
- **Email**: IMAP (Gmail)
- **API**: REST com documentação Swagger

## 📧 Configuração de Email

Para ativar o recebimento automático de tickets via email:

1. Configure uma conta Gmail
2. Ative a verificação em 2 etapas
3. Gere uma "senha de app"
4. Configure no arquivo `.env`

## 🔧 API Endpoints

- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Criar ticket
- `GET /api/tickets/{id}` - Detalhes do ticket
- `PUT /api/tickets/{id}/status` - Atualizar status
- `PUT /api/tickets/{id}/priority` - Atualizar prioridade
- `POST /api/tickets/{id}/reply` - Responder ticket
- `POST /api/tickets/{id}/note` - Adicionar nota interna

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar.

## 🤝 Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.