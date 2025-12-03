import imaplib
import email
from email.header import decode_header
import threading
import time
import json
from datetime import datetime
try:
    import requests
except ImportError:
    import urllib.request
    import urllib.parse
    requests = None

class EmailTicketReader:
    def __init__(self, email_config, api_base_url="http://127.0.0.1:5000"):
        self.email_config = email_config
        self.api_base_url = api_base_url
        self.running = False
        
    def connect_to_email(self):
        """Conecta ao servidor de email"""
        try:
            mail = imaplib.IMAP4_SSL(self.email_config['server'], self.email_config['port'])
            mail.login(self.email_config['username'], self.email_config['password'])
            return mail
        except Exception as e:
            print(f"Erro ao conectar ao email: {e}")
            return None
    
    def decode_mime_words(self, s):
        """Decodifica cabeçalhos MIME"""
        if s is None:
            return ""
        decoded_fragments = decode_header(s)
        return ''.join([
            fragment.decode(encoding or 'utf-8') if isinstance(fragment, bytes) else fragment
            for fragment, encoding in decoded_fragments
        ])
    
    def extract_email_content(self, msg):
        """Extrai o conteúdo do email"""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    charset = part.get_content_charset() or 'utf-8'
                    body = part.get_payload(decode=True).decode(charset, errors='ignore')
                    break
        else:
            charset = msg.get_content_charset() or 'utf-8'
            body = msg.get_payload(decode=True).decode(charset, errors='ignore')
        
        return body.strip()
    
    def create_ticket_from_email(self, sender, subject, body):
        """Cria um ticket via API a partir do email"""
        try:
            data = {
                "from": sender,
                "message": body,
                "subject": subject
            }
            
            if requests:
                # Usa requests se disponível
                response = requests.post(f"{self.api_base_url}/api/tickets/customer_message", 
                    json=data,
                    headers={'Content-Type': 'application/json'}
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    print(f"Email processado: {result['message']}")
                    return True
                else:
                    print(f"Erro ao processar email: {response.status_code}")
                    return False
            else:
                # Fallback usando urllib
                import urllib.request
                import urllib.parse
                
                json_data = json.dumps(data).encode('utf-8')
                req = urllib.request.Request(
                    f"{self.api_base_url}/api/tickets/customer_message",
                    data=json_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                with urllib.request.urlopen(req) as response:
                    if response.status in [200, 201]:
                        result = json.loads(response.read().decode('utf-8'))
                        print(f"Email processado: {result['message']}")
                        return True
                    else:
                        print(f"Erro ao processar email: {response.status}")
                        return False
                
        except Exception as e:
            print(f"Erro ao criar ticket: {e}")
            return False
    
    def check_new_emails(self):
        """Verifica novos emails e cria tickets"""
        mail = self.connect_to_email()
        if not mail:
            return
        
        try:
            mail.select('inbox')
            
            # Busca emails não lidos
            status, messages = mail.search(None, 'UNSEEN')
            
            if status == 'OK' and messages[0]:
                email_ids = messages[0].split()
                
                for email_id in email_ids:
                    try:
                        # Busca o email
                        status, msg_data = mail.fetch(email_id, '(RFC822)')
                        
                        if status == 'OK':
                            email_body = msg_data[0][1]
                            msg = email.message_from_bytes(email_body)
                            
                            # Extrai informações do email
                            sender = self.decode_mime_words(msg.get('From'))
                            subject = self.decode_mime_words(msg.get('Subject'))
                            body = self.extract_email_content(msg)
                            
                            # Extrai apenas o endereço de email
                            if '<' in sender and '>' in sender:
                                sender = sender.split('<')[1].split('>')[0]
                            
                            print(f"Novo email de {sender}: {subject}")
                            
                            # Cria o ticket
                            if self.create_ticket_from_email(sender, subject, body):
                                # Marca como lido apenas se o ticket foi criado com sucesso
                                mail.store(email_id, '+FLAGS', '\\Seen')
                                
                    except Exception as e:
                        print(f"Erro ao processar email {email_id}: {e}")
                        
        except Exception as e:
            print(f"Erro ao verificar emails: {e}")
        finally:
            mail.close()
            mail.logout()
    
    def start_monitoring(self, interval=30):
        """Inicia o monitoramento de emails"""
        self.running = True
        
        def monitor():
            while self.running:
                print(f"Verificando novos emails... {datetime.now()}")
                self.check_new_emails()
                time.sleep(interval)
        
        thread = threading.Thread(target=monitor, daemon=True)
        thread.start()
        print("Monitoramento de email iniciado")
    
    def stop_monitoring(self):
        """Para o monitoramento de emails"""
        self.running = False
        print("Monitoramento de email parado")

# Configuração de exemplo
EMAIL_CONFIG = {
    'server': 'imap.gmail.com',  # Para Gmail
    'port': 993,
    'username': 'seu-email@gmail.com',
    'password': 'sua-senha-de-app'  # Use senha de app para Gmail
}

# Para usar:
# email_reader = EmailTicketReader(EMAIL_CONFIG)
# email_reader.start_monitoring(interval=60)  # Verifica a cada 60 segundos