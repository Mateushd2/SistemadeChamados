from flask import Flask, jsonify, request, abort, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flasgger import Swagger
try:
    from email_reader import EmailTicketReader
except ImportError:
    EmailTicketReader = None
    print("Aviso: Módulo de email não disponível. Funcionalidade de email desabilitada.")

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend
swagger = Swagger(app) # Inicializa o Flasgger para documentação

# --- Variáveis e Estrutura de Dados Mock ---
AGENT_NAME = "Mateus Assis"
MOCK_USERNAME = 'Mateus Assis'
MOCK_PASSWORD_HASH = generate_password_hash('LOUVRE') # Senha segura (simulada)

# Dicionário para armazenar os tickets (simula o banco de dados)
mock_tickets = {}

# --- Funções Auxiliares ---

# serialização de datas
def datetime_to_iso(dt):
    """Garante que a data seja retornada no formato ISO 8601."""
    if isinstance(dt, str):
        return dt
    return dt.isoformat()

# update de status do ticket e atribuição
def update_ticket_status_logic(ticket, new_status):
    """Atualiza o status e aplica a lógica de atribuição de agente."""
    ticket['status'] = new_status
    if new_status == 'Em Andamento' and not ticket['assignedTo']:
        ticket['assignedTo'] = AGENT_NAME
    # Quando reaberto, mantemos a atribuição, mas o status é 'Aberto'
    elif new_status == 'Aberto':
        pass 
    return ticket


# --- Endpoints da API ---

## 1. GET /api/tickets
@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """
    Lista tickets com filtros de status e busca.
    ---
    tags:
      - Tickets
    parameters:
      - name: status
        in: query
        type: string
        enum: ['Aberto', 'Em Andamento', 'Fechado']
        required: false
        description: Filtra tickets por status.
      - name: search
        in: query
        type: string
        required: false
        description: Busca por assunto, remetente, ID ou agente.
    responses:
      200:
        description: Lista de tickets retornada com sucesso.
    """
    status_filter = request.args.get('status')
    search_query = request.args.get('search', '').lower()
    
    tickets_list = list(mock_tickets.values())
    
    if status_filter:
        tickets_list = [t for t in tickets_list if t['status'].lower() == status_filter.lower()]

    if search_query:
        tickets_list = [
            t for t in tickets_list 
            if search_query in t['subject'].lower() 
            or search_query in t['from'].lower() 
            or search_query in t['id'].lower()
            or (t['assignedTo'] and search_query in t['assignedTo'].lower())
        ]
        
    for ticket in tickets_list:
        ticket['createdAt'] = datetime_to_iso(ticket['createdAt'])
        for msg in ticket['messages']:
            msg['timestamp'] = datetime_to_iso(msg['timestamp'])

    return jsonify(tickets_list)

## 2. POST /api/tickets
@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    """
    Cria um novo ticket (primeiro contato).
    ---
    tags:
      - Tickets
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [subject, from, message]
          properties:
            subject: {type: string, example: "Meu pedido está atrasado"}
            from: {type: string, format: email, example: "cliente@email.com"}
            message: {type: string, example: "Ainda não recebi minha encomenda."}
            priority: {type: string, enum: [Baixa, Média, Alta], default: Média}
    responses:
      201: {description: Ticket criado com sucesso.}
      400: {description: Campos obrigatórios faltando.}
    """
    data = request.get_json()
    
    if not all(k in data for k in ('subject', 'from', 'message')):
        abort(400, description="Campos 'subject', 'from' e 'message' são obrigatórios.")

    new_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    new_ticket = {
        'id': new_id,
        'subject': data['subject'],
        'from': data['from'],
        'status': 'Aberto',
        'priority': data.get('priority', 'Média'),
        'createdAt': current_time,
        'assignedTo': None,
        'is_read': False,
        'messages': [
            {
                'text': data['message'], 
                'timestamp': current_time, 
                'author': data['from']
            }
        ]
    }
    
    mock_tickets[new_id] = new_ticket
    
    return jsonify(new_ticket), 201

## 3. GET /api/tickets/<ticket_id>
@app.route('/api/tickets/<string:ticket_id>', methods=['GET'])
def get_ticket_detail(ticket_id):
    """
    Busca ticket por ID.
    ---
    tags:
      - Tickets
    parameters:
      - name: ticket_id
        in: path
        type: string
        required: true
        description: O ID único do ticket.
    responses:
      200: {description: Detalhes do ticket, marcado como lido.}
      404: {description: Ticket não encontrado.}
    """
    ticket = mock_tickets.get(ticket_id)
    
    if not ticket:
        abort(404, description="Ticket não encontrado.")

    ticket['is_read'] = True
    
    ticket['createdAt'] = datetime_to_iso(ticket['createdAt'])
    for msg in ticket['messages']:
        msg['timestamp'] = datetime_to_iso(msg['timestamp'])
        
    return jsonify(ticket)

## 4. PUT /api/tickets/<string:ticket_id>/status
@app.route('/api/tickets/<string:ticket_id>/status', methods=['PUT'])
def update_ticket_status(ticket_id):
    """
    Atualiza o status de um ticket e atribui responsável.
    ---
    tags:
      - Tickets
    parameters:
      - name: ticket_id
        in: path
        type: string
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [status]
          properties:
            status:
              type: string
              enum: [Aberto, Em Andamento, Fechado]
              example: Em Andamento
    responses:
      200: {description: Status atualizado com sucesso.}
      400: {description: Status inválido.}
      404: {description: Ticket não encontrado.}
    """
    ticket = mock_tickets.get(ticket_id)
    if not ticket:
        abort(404, description="Ticket não encontrado.")
        
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status or new_status not in ['Aberto', 'Em Andamento', 'Fechado']:
        abort(400, description="Status inválido. Deve ser 'Aberto', 'Em Andamento' ou 'Fechado'.")

    mock_tickets[ticket_id] = update_ticket_status_logic(ticket, new_status)
    
    mock_tickets[ticket_id]['messages'].append({
        'text': f"Status alterado para **{new_status}** pelo agente {AGENT_NAME}.",
        'timestamp': datetime.now().isoformat(),
        'author': 'SYSTEM',
        'isInternal': True
    })

    return jsonify({'message': f"Ticket {ticket_id} atualizado para status: {new_status}"}), 200

## 5. POST /api/tickets/<string:ticket_id>/reply
@app.route('/api/tickets/<string:ticket_id>/reply', methods=['POST'])
def add_reply_to_ticket(ticket_id):
    """
    Adiciona uma resposta pública do agente ao ticket.
    ---
    tags:
      - Tickets
    parameters:
      - name: ticket_id
        in: path
        type: string
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [text]
          properties:
            text: {type: string, example: "Verificamos o seu problema e está resolvido."}
    responses:
      200: {description: Resposta adicionada com sucesso.}
      400: {description: Texto da resposta obrigatório.}
      403: {description: Não é possível responder a ticket fechado.}
      404: {description: Ticket não encontrado.}
    """
    ticket = mock_tickets.get(ticket_id)
    if not ticket:
        abort(404, description="Ticket não encontrado.")

    if ticket['status'] == 'Fechado':
        abort(403, description="Não é possível responder a um ticket fechado.")
        
    data = request.get_json()
    reply_text = data.get('text')
    
    if not reply_text:
        abort(400, description="O campo 'text' da resposta é obrigatório.")
        
    new_message = {
        'text': reply_text,
        'timestamp': datetime.now().isoformat(),
        'author': AGENT_NAME
    }
    
    ticket['messages'].append(new_message)
    
    return jsonify({'message': 'Resposta adicionada com sucesso.', 'new_message': new_message}), 200

## 6. POST /api/tickets/<string:ticket_id>/note
@app.route('/api/tickets/<string:ticket_id>/note', methods=['POST'])
def add_internal_note(ticket_id):
    """
    Adiciona uma nota interna (privada) ao ticket.
    ---
    tags:
      - Tickets
    parameters:
      - name: ticket_id
        in: path
        type: string
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [text]
          properties:
            text: {type: string, example: "Lembrar de verificar o log X na próxima interação."}
    responses:
      200: {description: Nota interna adicionada com sucesso.}
      400: {description: Texto da nota obrigatório.}
      404: {description: Ticket não encontrado.}
    """
    ticket = mock_tickets.get(ticket_id)
    if not ticket:
        abort(404, description="Ticket não encontrado.")
        
    data = request.get_json()
    note_text = data.get('text')
    
    if not note_text:
        abort(400, description="O campo 'text' da nota é obrigatório.")
        
    new_message = {
        'text': f"[NOTA INTERNA] {note_text}",
        'timestamp': datetime.now().isoformat(),
        'author': AGENT_NAME,
        'isInternal': True
    }
    
    ticket['messages'].append(new_message)
    
    return jsonify({'message': 'Nota interna adicionada com sucesso.', 'new_note': new_message}), 200


## 6.5. PUT /api/tickets/<string:ticket_id>/priority
@app.route('/api/tickets/<string:ticket_id>/priority', methods=['PUT'])
def update_ticket_priority(ticket_id):
    """
    Atualiza a prioridade de um ticket.
    ---
    tags:
      - Tickets
    parameters:
      - name: ticket_id
        in: path
        type: string
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [priority]
          properties:
            priority:
              type: string
              enum: [Baixa, Média, Alta]
              example: Alta
    responses:
      200: {description: Prioridade atualizada com sucesso.}
      400: {description: Prioridade inválida.}
      404: {description: Ticket não encontrado.}
    """
    ticket = mock_tickets.get(ticket_id)
    if not ticket:
        abort(404, description="Ticket não encontrado.")
        
    data = request.get_json()
    new_priority = data.get('priority')
    
    if not new_priority or new_priority not in ['Baixa', 'Média', 'Alta']:
        abort(400, description="Prioridade inválida. Deve ser 'Baixa', 'Média' ou 'Alta'.")

    ticket['priority'] = new_priority
    
    ticket['messages'].append({
        'text': f"Prioridade alterada para **{new_priority}** pelo agente {AGENT_NAME}.",
        'timestamp': datetime.now().isoformat(),
        'author': 'SYSTEM',
        'isInternal': True
    })

    return jsonify({'message': f"Prioridade do ticket {ticket_id} atualizada para: {new_priority}"}), 200


## 7. POST /api/tickets/customer_message (Lógica de Reabertura)
@app.route('/api/tickets/customer_message', methods=['POST'])
def handle_customer_reply():
    """
    Simula o recebimento de uma mensagem do cliente (com reabertura).
    ---
    tags:
      - Tickets
    description: Recebe uma mensagem do cliente e anexa ao ticket existente. Se o ticket estiver Fechado, ele é reaberto para 'Aberto'. Se não existir, cria um novo ticket.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [from, message]
          properties:
            from: {type: string, format: email, example: "cliente@email.com"}
            message: {type: string, example: "O problema que eu tinha voltou a acontecer."}
            subject: {type: string, description: "Opcional, usado apenas se um novo ticket for criado.", example: "Problema Recorrente"}
    responses:
      200: {description: Mensagem anexada ao ticket existente.}
      201: {description: Novo ticket criado.}
      400: {description: Campos 'from' e 'message' obrigatórios.}
    """
    data = request.get_json()

    if not all(k in data for k in ('from', 'message')):
        abort(400, description="Campos 'from' e 'message' são obrigatórios.")

    customer_email = data['from']
    message_text = data['message']
    
    target_ticket = None
    
    # 1. Prioriza tickets Abertos ou Em Andamento do mesmo cliente
    for ticket in mock_tickets.values():
        if ticket['from'] == customer_email and ticket['status'] in ['Aberto', 'Em Andamento']:
            target_ticket = ticket
            break
            
    # 2. Tenta encontrar o ticket Fechado mais recente para reabrir
    if not target_ticket:
        closed_tickets = sorted(
            [t for t in mock_tickets.values() if t['from'] == customer_email and t['status'] == 'Fechado'],
            key=lambda x: datetime.fromisoformat(x['createdAt']),
            reverse=True
        )
        if closed_tickets:
            target_ticket = closed_tickets[0]

    current_time = datetime.now().isoformat()
    new_message = {
        'text': message_text,
        'timestamp': current_time,
        'author': customer_email,
        'isInternal': False
    }

    if target_ticket:
        # Lógica de REABERTURA
        if target_ticket['status'] == 'Fechado':
            target_ticket = update_ticket_status_logic(target_ticket, 'Aberto')
            target_ticket['messages'].append({
                'text': f"Ticket reaberto pelo cliente **{customer_email}** (resposta após fechamento).",
                'timestamp': current_time,
                'author': 'SYSTEM',
                'isInternal': True
            })
            
        target_ticket['messages'].append(new_message)
        target_ticket['is_read'] = False 
        target_ticket['createdAt'] = current_time # Atualiza o timestamp (simulando atividade recente)
        
        return jsonify({'message': f"Mensagem anexada ao ticket {target_ticket['id']}. Status: {target_ticket['status']}", 'ticket': target_ticket}), 200

    else:
        # 3. Criar um novo ticket
        new_id = str(uuid.uuid4())
        new_ticket = {
            'id': new_id,
            'subject': data.get('subject', 'Novo Contato do Cliente (Sem Assunto)'),
            'from': customer_email,
            'status': 'Aberto', 
            'priority': data.get('priority', 'Média'),
            'createdAt': current_time,
            'assignedTo': None,
            'is_read': False,
            'messages': [new_message]
        }
        mock_tickets[new_id] = new_ticket
        return jsonify({'message': "Novo ticket criado.", 'ticket': new_ticket}), 201


## 8. POST /api/auth/login
@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Login do Agente
    ---
    tags:
      - Autenticação
    description: Verifica as credenciais de login e retorna um token de sessão simulado.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [username, password]
          properties:
            username:
              type: string
              example: Mateus Assis
            password:
              type: string
              example: LOUVRE
    responses:
      200:
        description: Login bem-sucedido.
        schema:
          type: object
          properties:
            message: {type: string}
            agent: {type: string}
            token: {type: string}
      401:
        description: Credenciais inválidas.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # A senha é verificada contra um hash (simulação de boa prática de segurança)
    if username == MOCK_USERNAME and check_password_hash(MOCK_PASSWORD_HASH, password):
        return jsonify({
            'message': 'Login bem-sucedido!',
            'agent': AGENT_NAME,
            'token': str(uuid.uuid4()),
        }), 200
    else:
        abort(401, description="Credenciais inválidas.")


# Rota para servir arquivos estáticos (HTML, CSS, JS)
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    print("Acesse: http://127.0.0.1:5000/")
    
    # Configuração de email
    if EmailTicketReader:
        EMAIL_CONFIG = {
            'server': 'imap.gmail.com',
            'port': 993,
            'username': os.getenv('EMAIL_USERNAME', 'seu-email@gmail.com'),
            'password': os.getenv('EMAIL_PASSWORD', 'sua-senha-de-app')
        }
        
        try:
            # Inicia monitoramento de email
            email_reader = EmailTicketReader(EMAIL_CONFIG)
            email_reader.start_monitoring(interval=60)
            print("Monitoramento de email ativado!")
        except Exception as e:
            print(f"Erro ao iniciar monitoramento de email: {e}")
            print("Sistema continuará sem monitoramento de email.")
    else:
        print("Módulo de email não disponível.")
    
    # Acesse a aplicação em: http://127.0.0.1:5000/
    # Acesse a documentação Swagger em: http://127.0.0.1:5000/apidocs/
    app.run(debug=True, port=5000, host='0.0.0.0')