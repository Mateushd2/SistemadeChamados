# Sistema de Chamados 

Este é um projeto para um sistema de chamados mono-agente, desenvolvido para a criação, visualização e gerenciamento de tickets de suporte. O projeto é construído com HTML, CSS (usando Tailwind CSS), JavaScript e Python.

## Visão Geral do Projeto

O objetivo principal deste projeto é demonstrar a criação de uma interface de usuário responsiva e interativa para um sistema de tickets. Ele mostra o fluxo de trabalho de um agente de suporte, permitindo que o usuário crie novos tickets, visualize o histórico de mensagens, responda aos clientes e atualize o status dos chamados.

## Recursos (Features)

* **Criação de Tickets**: Formulário para abrir novos tickets com campos para e-mail do remetente, assunto e mensagem.
* **Listagem de Tickets**: Exibe uma lista de tickets simulados, com informações como assunto, remetente, status e data de criação.
* **Filtros e Pesquisa**:
    * Filtros por status do ticket (**Aberto**, **Em Andamento** e **Fechado**).
    * Barra de pesquisa para encontrar tickets por assunto, e-mail ou ID.
* **Visualização Detalhada do Ticket**:
    * Ao selecionar um ticket na lista, um painel lateral exibe o histórico completo de mensagens.
    * Permite responder às mensagens e alterar o status do ticket.
    * Botão para expandir o histórico de mensagens para o modo de tela cheia.
* **Gerenciamento de Status**:
    * Um ticket recém-criado tem o status **Aberto**.
    * Um agente pode **Aceitar** um ticket, mudando seu status para **Em Andamento**.
    * É possível mudar o status de um ticket para **Fechado** ou **Reabrir** um ticket fechado.
* **Funcionalidade de Agente de Suporte**:
    * Simula a interação do agente de suporte com os tickets.
    * O nome do agente (`Mateus Assis`) é definido diretamente no código.
* **Recursos Adicionais**:
    * Botão para alternar entre **modo claro e modo escuro**.
    * Funcionalidade de copiar o ID do usuário para a área de transferência.

## Tecnologias Utilizadas

* **HTML5**: Estrutura do documento.
* **Tailwind CSS**: Framework CSS de utilidades para estilização rápida e responsiva.
* **JavaScript (ES6+)**: Lógica de interação, manipulação do DOM e gerenciamento de estado em memória.

## Como Executar o Projeto

Como este é um projeto de frontend estático, você só precisa de um navegador para executá-lo.

1.  **Clone o repositório** (se estiver hospedado) ou baixe o arquivo `index.html`.
2.  **Abra o arquivo `index.html`** em seu navegador preferido (Chrome, Firefox, Edge, etc.).
3.  O sistema estará pronto para ser usado.

Não há necessidade de instalar dependências ou configurar um servidor local, pois o projeto não possui backend.
