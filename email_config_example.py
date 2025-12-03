# Exemplo de configuração de email
# Copie este arquivo para email_config.py e configure suas credenciais

EMAIL_CONFIG = {
    # Gmail
    'server': 'imap.gmail.com',
    'port': 993,
    'username': 'suporte@empresa.com',
    'password': 'senha-de-app-do-gmail'  # Use senha de app, não a senha normal
}

# Outlook/Hotmail
# EMAIL_CONFIG = {
#     'server': 'outlook.office365.com',
#     'port': 993,
#     'username': 'suporte@empresa.com',
#     'password': 'sua-senha'
# }

# Yahoo
# EMAIL_CONFIG = {
#     'server': 'imap.mail.yahoo.com',
#     'port': 993,
#     'username': 'suporte@yahoo.com',
#     'password': 'sua-senha'
# }

# Para ativar o monitoramento de email:
# 1. Configure as credenciais acima
# 2. Descomente as linhas no backend.py
# 3. Reinicie o servidor