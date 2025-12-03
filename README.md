# Sistema de Chamados - Integração Frontend + Backend

Este projeto integra um frontend em HTML/CSS/JavaScript com um backend Flask (Python).

## Estrutura do Projeto

```
Tickets/
├── index.html          # Interface do usuário
├── script.js           # Lógica do frontend
├── backend.py          # API Flask
├── requirements.txt    # Dependências Python
└── README.md          # Este arquivo
```

## Como Executar

### 1. Instalar Dependências Python

```bash
pip install -r requirements.txt
```

### 2. Executar o Backend

```bash
python backend.py
```

O servidor será iniciado em: http://127.0.0.1:5000/

### 3. Acessar a Aplicação

Abra seu navegador e acesse: http://127.0.0.1:5000/

## Funcionalidades Integradas

- ✅ **Listagem de Tickets**: Busca tickets da API com filtros
- ✅ **Criação de Tickets**: Envia novos tickets para o backend
- ✅ **Detalhes do Ticket**: Carrega informações completas via API
- ✅ **Atualização de Status**: Modifica status através da API
- ✅ **Métricas em Tempo Real**: Calcula estatísticas dos tickets
- ✅ **Pesquisa e Filtros**: Funciona com parâmetros da API

## API Endpoints

- `GET /api/tickets` - Lista tickets com filtros
- `POST /api/tickets` - Cria novo ticket
- `GET /api/tickets/{id}` - Detalhes do ticket
- `PUT /api/tickets/{id}/status` - Atualiza status
- `POST /api/tickets/{id}/reply` - Adiciona resposta
- `POST /api/tickets/{id}/note` - Adiciona nota interna

## Documentação da API

Acesse: http://127.0.0.1:5000/apidocs/ para ver a documentação Swagger completa.

## Credenciais de Teste

- **Usuário**: Mateus Assis
- **Senha**: LOUVRE