const loginView = document.getElementById('login-view');
        const mainApp = document.getElementById('main-app');
        const loginForm = document.getElementById('login-form');
        const loginMessage = document.getElementById('login-message');
        const logoutBtn = document.getElementById('logout-btn');

        const ticketsContainer = document.getElementById('tickets-container');
        const newTicketForm = document.getElementById('new-ticket-form');
        const ticketDetailView = document.getElementById('ticket-detail-view');
        const selectedTicketContent = document.getElementById('selected-ticket-content');
        const copyUserIdBtn = document.getElementById('copy-user-id-btn');
        const copyTooltip = document.getElementById('copy-tooltip');
        const ticketCreateView = document.getElementById('ticket-create-view');
        const ticketListView = document.getElementById('ticket-list-view');
        const toggleFullscreenBtn = document.getElementById('toggle-history-fullscreen-btn');
        const expandIcon = document.getElementById('expand-icon');
        const closeIcon = document.getElementById('close-icon');
        const formMessage = document.getElementById('form-message');
        const filterButtons = document.getElementById('ticket-filters').querySelectorAll('button');
        const ticketSearchInput = document.getElementById('ticket-search-input');
        
        // Elementos do modo escuro
        const themeToggleBtn = document.getElementById('theme-toggle');
        const loginThemeToggleBtn = document.getElementById('login-theme-toggle'); 
        const body = document.body;
        const moonIcon = document.getElementById('moon-icon');
        const sunIcon = document.getElementById('sun-icon');
        const loginMoonIcon = document.getElementById('login-moon-icon');
        const loginSunIcon = document.getElementById('login-sun-icon');

        // NOVOS ELEMENTOS DO DASHBOARD
        const reportsBtn = document.getElementById('reports-btn');
        const reportsDashboard = document.getElementById('reports-dashboard');
        const closeReportsBtn = document.getElementById('close-reports-btn');
        const reportsTableBody = document.getElementById('reports-table-body');
        
        // NOVAS VARIÁVEIS PARA AS INSTÂNCIAS DO CHART.JS
        let statusChartInstance = null;
        let priorityChartInstance = null;
        
        const AGENT_NAME = "Mateus Assis";
        let currentFilter = 'Todos';
        let currentTicketId = null;
        let tickets = []; // Array para armazenar tickets da API
        
        // --- NOVO: Dados e Funções da Base de Conhecimento (KB) ---
        
        // Mock Data for Knowledge Base Articles
        const mockKbArticles = [
            { id: 'kb-1', title: 'Guia de Recuperação de Senha', content: 'Prezado cliente, para recuperar sua senha, acesse o link [LINK DE RECUPERAÇÃO] e siga os passos. Se o problema persistir, anexe um print do erro.' },
            { id: 'kb-2', title: 'Como Reportar um Bug', content: 'Para reportar um bug, inclua as seguintes informações: 1. Etapas para reproduzir. 2. Qual o seu navegador. 3. Captura de tela do erro.' },
            { id: 'kb-3', title: 'Link do Manual do Usuário', content: 'Você pode encontrar a solução completa no nosso Manual do Usuário: [LINK DO MANUAL DO USUÁRIO]' }
        ];

        // Função que insere o conteúdo no campo de resposta
        function insertKbContent(textToInsert) {
            const replyMessageTextarea = document.getElementById('reply-message');
            if (replyMessageTextarea) {
                // Anexa o conteúdo com separação para formatação
                replyMessageTextarea.value += (replyMessageTextarea.value.length > 0 ? '\n\n---\n\n' : '') + textToInsert;
                replyMessageTextarea.focus();
                
                // Esconde o painel da KB após a inserção (melhorando UX)
                const kbModal = document.getElementById('kb-simulated-modal');
                if (kbModal) kbModal.classList.add('hidden');
            }
        }
        
        // Função que renderiza a lista de artigos e adiciona os listeners de clique
        function renderKbArticles() {
            const kbArticlesList = document.getElementById('kb-articles-list');
            if (!kbArticlesList) return;

            kbArticlesList.innerHTML = mockKbArticles.map(article => {
                const contentPreview = article.content.substring(0, 80) + '...';
                return `
                    <div data-kb-id="${article.id}" 
                         class="kb-article-item p-3 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors">
                        <h6 class="font-semibold text-gray-800 dark:text-gray-100">${article.title}</h6>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">${contentPreview}</p>
                    </div>
                `;
            }).join('');

            // Adiciona o listener de clique que chama insertKbContent()
            document.querySelectorAll('.kb-article-item').forEach(item => {
                item.addEventListener('click', () => {
                    const articleId = item.dataset.kbId;
                    const article = mockKbArticles.find(a => a.id === articleId);
                    
                    if (article) {
                        insertKbContent(article.content);
                    }
                });
            });
        }
        // --- FIM NOVO: Dados e Funções da Base de Conhecimento (KB) ---
        

        // NOVO: Função para verificar se ticket está fora do SLA
        function isTicketOutOfSLA(ticket) {
            const now = new Date();
            const createdAt = new Date(ticket.createdAt);
            const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
            
            // Define SLA baseado na prioridade (em horas)
            const slaHours = {
                'Alta': 2,
                'Normal': 8,
                'Baixa': 24
            };
            
            return hoursDiff > (slaHours[ticket.priority] || 8) && ticket.status !== 'Fechado';
        }

        // NOVO: Função para obter classes de cor baseadas na prioridade (agora com 'Normal')
        function getPriorityClasses(prioridade) {
            switch (prioridade) {
                case 'Alta':
                    // Prioridade Alta (Ex: Vermelho/Red)
                    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                case 'Média':
                    // Prioridade Média (Foi removida em favor de 'Normal' e 'Alta'/'Baixa')
                    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                case 'Normal':
                    // NOVO: Prioridade Normal (Ex: Azul/Blue)
                    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
                case 'Baixa':
                    // Prioridade Baixa (Ex: Verde/Green)
                    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                default:
                    // Padrão
                    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            }
        }

        // --- NOVO: Funções para API de Métricas ---
        
        // Função para buscar tickets da API
        async function fetchTickets(status = null, search = null) {
            try {
                let url = 'http://127.0.0.1:5000/api/tickets';
                const params = new URLSearchParams();
                if (status && status !== 'Todos') params.append('status', status);
                if (search) params.append('search', search);
                if (params.toString()) url += '?' + params.toString();
                
                const response = await fetch(url);
                if (response.ok) {
                    tickets = await response.json();
                    // Converte strings de data para objetos Date
                    tickets.forEach(ticket => {
                        ticket.createdAt = new Date(ticket.createdAt);
                        ticket.messages.forEach(msg => {
                            msg.timestamp = new Date(msg.timestamp);
                        });
                    });
                    renderTickets(tickets);
                } else {
                    console.error('Erro ao buscar tickets:', response.status);
                }
            } catch (error) {
                console.error('Erro na requisição de tickets:', error);
            }
        }
        
        // Função para buscar métricas calculadas com base nos tickets
        async function fetchMetrics() {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/tickets');
                if (response.ok) {
                    const allTickets = await response.json();
                    const totalTickets = allTickets.length;
                    const openTickets = allTickets.filter(t => t.status === 'Aberto').length;
                    const slaBreachCount = allTickets.filter(t => {
                        const createdAt = new Date(t.createdAt);
                        const hoursDiff = (new Date() - createdAt) / (1000 * 60 * 60);
                        const slaHours = { 'Alta': 2, 'Média': 8, 'Normal': 8, 'Baixa': 24 };
                        return hoursDiff > (slaHours[t.priority] || 8) && t.status !== 'Fechado';
                    }).length;
                    
                    updateMetricsCards({ totalTickets, openTickets, avgResponseTime: '45', slaBreachCount });
                } else {
                    console.error('Erro ao buscar métricas:', response.status);
                }
            } catch (error) {
                console.error('Erro na requisição de métricas:', error);
            }
        }
        
        function updateMetricsCards(metrics) {
            document.getElementById('metric-total-tickets').textContent = metrics.totalTickets || '0';
            document.getElementById('metric-open-tickets').textContent = metrics.openTickets || '0';
            document.getElementById('metric-avg-response').textContent = metrics.avgResponseTime || '0';
            document.getElementById('metric-sla-breach').textContent = metrics.slaBreachCount || '0';
        }
        
        // --- Funções de Navegação e Autenticação (Novas) ---

        function showApp(isLoggedIn) {
            if (isLoggedIn) {
                loginView.classList.add('hidden');
                mainApp.classList.remove('hidden');
                reportsDashboard.classList.add('hidden'); 
                checkThemePreference();
                fetchTickets();
                fetchMetrics();
            } else {
                mainApp.classList.add('hidden');
                ticketDetailView.classList.add('hidden');
                reportsDashboard.classList.add('hidden'); 
                loginView.classList.remove('hidden');
            }
        }
        
        // NOVO: Função para exibir o Dashboard de Relatórios
        function showReportsDashboard() {
            mainApp.classList.add('hidden');
            reportsDashboard.classList.remove('hidden');
            renderReports(); // Chama a função que popula o dashboard e os gráficos
        }

        // NOVO: Função para ocultar o Dashboard de Relatórios
        function hideReportsDashboard() {
            reportsDashboard.classList.add('hidden');
            mainApp.classList.remove('hidden');
        }
        
        // NOVO: Função para renderizar os Gráficos de Status e Prioridade
        function renderCharts() {
            // 1. Processar dados para Status (sem alteração)
            const statusCounts = {};
            tickets.forEach(ticket => {
                statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
            });
            
            const statusLabels = Object.keys(statusCounts);
            const statusData = Object.values(statusCounts);
            const statusColors = statusLabels.map(label => {
                switch (label) {
                    case 'Aberto': return '#48BB78'; // Green
                    case 'Em Andamento': return '#F6E05E'; // Yellow
                    case 'Fechado': return '#F56565'; // Red
                    default: return '#A0AEC0'; // Gray
                }
            });

            // Destruir instância anterior se existir
            if (statusChartInstance) {
                statusChartInstance.destroy();
            }

            const statusCtx = document.getElementById('statusChart').getContext('2d');
            statusChartInstance = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusData,
                        backgroundColor: statusColors,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                // Ajusta a cor da legenda para o tema
                                color: body.classList.contains('dark') ? '#cbd5e0' : '#4a5568'
                            }
                        }
                    }
                }
            });
            
            // 2. Processar dados para Prioridade (Atualizado para 'Normal')
            const priorityCounts = {};
            tickets.forEach(ticket => {
                priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
            });

            const priorityLabels = Object.keys(priorityCounts);
            const priorityData = Object.values(priorityCounts);
            // Cores ajustadas para as prioridades Baixa/Normal/Alta
            const priorityColors = priorityLabels.map(label => {
                switch (label) {
                    case 'Alta': return '#F56565'; // Red
                    case 'Normal': return '#63B3ED'; // Blue (NOVO)
                    case 'Baixa': return '#48BB78'; // Green
                    default: return '#A0AEC0';
                }
            });
            
            // Destruir instância anterior
            if (priorityChartInstance) {
                priorityChartInstance.destroy();
            }

            const priorityCtx = document.getElementById('priorityChart').getContext('2d');
            priorityChartInstance = new Chart(priorityCtx, {
                type: 'doughnut',
                data: {
                    labels: priorityLabels,
                    datasets: [{
                        data: priorityData,
                        backgroundColor: priorityColors,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                // Ajusta a cor da legenda para o tema
                                color: body.classList.contains('dark') ? '#cbd5e0' : '#4a5568'
                            }
                        }
                    }
                }
            });
        }
        
        // NOVO: Função para renderizar os dados de Relatórios (Simulação)
        function renderReports() {
            // 1. Calcular KPIs
            const totalOpen = tickets.filter(t => t.status === 'Aberto').length;
            const totalClosedToday = tickets.filter(t => 
                t.status === 'Fechado' && new Date(t.createdAt).toDateString() === new Date().toDateString()
            ).length;
            
            document.getElementById('kpi-total-open').textContent = totalOpen;
            document.getElementById('kpi-closed-today').textContent = totalClosedToday;
            
            // 2. Popular Tabela de Tickets Recentes
            reportsTableBody.innerHTML = '';
            const recentTickets = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5); // 5 mais recentes

            recentTickets.forEach(ticket => {
                let statusColor = '';
                
                switch (ticket.status) {
                    case 'Aberto': statusColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'; break;
                    case 'Em Andamento': statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'; break;
                    case 'Fechado': statusColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'; break;
                }

                // Utiliza a nova função de classes para a prioridade
                const priorityColor = getPriorityClasses(ticket.priority);

                const row = reportsTableBody.insertRow();
                row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${ticket.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs">${ticket.subject}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${ticket.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColor}">
                            ${ticket.priority}
                        </span>
                    </td>
                `;
            });
            
            // 3. Renderizar Gráficos
            renderCharts(); 
        }
        // FIM NOVO: Dashboard de Relatórios
        

        loginForm.onsubmit = (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (email && password) {
                loginMessage.textContent = "Login bem-sucedido! Carregando painel...";
                loginMessage.classList.remove('text-red-600');
                loginMessage.classList.add('text-green-600');
                setTimeout(() => {
                    showApp(true);
                }, 1000);
            } else {
                loginMessage.textContent = "Por favor, preencha todos os campos.";
                loginMessage.classList.add('text-red-600');
            }
        };

        logoutBtn.onclick = () => {
            showApp(false);
            loginForm.reset();
            loginMessage.textContent = "";
        };

        function renderTickets(tickets) {
            ticketsContainer.innerHTML = '';
            const searchQuery = ticketSearchInput.value.toLowerCase();

            const filteredBySearch = tickets.filter(ticket => {
                const searchFields = [ticket.subject, ticket.from, ticket.id, ticket.assignedTo || ''];
                return searchFields.some(field => field.toLowerCase().includes(searchQuery));
            });
            
            const filteredTickets = filteredBySearch.filter(ticket => currentFilter === 'Todos' || ticket.status.toLowerCase() === currentFilter.toLowerCase());
            
            if (filteredTickets.length === 0) {
                ticketsContainer.innerHTML = '<p class="text-center text-gray-500">Nenhum ticket encontrado.</p>';
                return;
            }

            // Ordena tickets por data de criação (mais antigos primeiro) para numeração correta
            const sortedTickets = [...filteredTickets].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            filteredTickets.forEach((ticket, index) => {
                const ticketElement = document.createElement('div');
                let statusColor = '';
                switch (ticket.status) {
                    case 'Aberto': statusColor = 'bg-green-200 text-green-800'; break;
                    case 'Em Andamento': statusColor = 'bg-yellow-200 text-yellow-800'; break;
                    case 'Fechado': statusColor = 'bg-red-200 text-red-800'; break;
                    default: statusColor = 'bg-gray-200 text-gray-800';
                }

                // NOVO: Usa a função para pegar as classes de prioridade
                const priorityColor = getPriorityClasses(ticket.priority);

                const ticketBgClass = body.classList.contains('dark') && !ticket.is_read 
                                        ? 'new-ticket-highlight' 
                                        : (ticket.is_read ? 'bg-white' : 'bg-gray-100');

                const ticketNumber = sortedTickets.findIndex(t => t.id === ticket.id) + 1;
                const assignedToHtml = ticket.assignedTo ? `<span class="text-xs text-gray-500 mt-1 truncate">Responsável: ${ticket.assignedTo === AGENT_NAME ? 'Você' : ticket.assignedTo}</span>` : '';

                // NOVO: Aplicar classes de alerta para tickets fora do SLA
                const outOfSLA = isTicketOutOfSLA(ticket);
                const slaAlertClasses = outOfSLA ? 'border-red-500 border-2 bg-red-50' : 'border-gray-200';
                const slaIconHtml = outOfSLA ? '<svg class="w-4 h-4 text-red-500 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>' : '';

                ticketElement.className = `p-4 border rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${ticketBgClass} ${slaAlertClasses}`;
                ticketElement.dataset.id = ticket.id;
                ticketElement.innerHTML = `
                    <div class="flex items-center justify-between mb-2 pointer-events-none">
                        <h3 class="text-lg font-semibold text-gray-800 truncate">${slaIconHtml}#${ticketNumber} - ${ticket.subject}</h3>
                        <div class="flex flex-col items-end space-y-1">
                            <span class="text-xs font-medium px-2 py-1 rounded-full ${priorityColor}">${ticket.priority}</span>
                            <span class="text-xs font-medium px-2 py-1 rounded-full ${statusColor}">${ticket.status}</span>
                            ${assignedToHtml}
                        </div>
                    </div>
                    <p class="text-sm text-gray-700 mb-1 pointer-events-none">De: ${ticket.from}</p>
                    <p class="text-xs text-gray-700 pointer-events-none">Criado em: ${ticket.createdAt.toLocaleString()}</p>
                `;
                
                ticketElement.addEventListener('click', () => selectTicketById(ticket.id, ticketNumber));
                ticketElement.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    showContextMenu(event, ticket.id, ticketNumber);
                });
                
                ticketsContainer.appendChild(ticketElement);
            });
        }
        
        
        function showContextMenu(event, ticketId, ticketNumber) {
            hideContextMenu();
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.style.top = `${event.pageY}px`;
            menu.style.left = `${event.pageX}px`;
            menu.dataset.ticketId = ticketId;

            const markAsUnreadItem = document.createElement('div');
            markAsUnreadItem.className = 'context-menu-item';
            markAsUnreadItem.textContent = 'Marcar como não lido';
            markAsUnreadItem.addEventListener('click', () => {
                // Esta funcionalidade precisa ser implementada via API
                console.log('Marcar como não lido - funcionalidade a ser implementada');
                hideContextMenu();
            });

            menu.appendChild(markAsUnreadItem);
            document.body.appendChild(menu);

            document.addEventListener('click', hideContextMenu);
        }

        function hideContextMenu() {
            const menu = document.querySelector('.context-menu');
            if (menu) {
                menu.remove();
                document.removeEventListener('click', hideContextMenu);
            }
        }
        
        async function selectTicketById(id, number) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/tickets/${id}`);
                if (response.ok) {
                    const ticket = await response.json();
                    ticket.createdAt = new Date(ticket.createdAt);
                    ticket.messages.forEach(msg => {
                        msg.timestamp = new Date(msg.timestamp);
                    });
                    currentTicketId = id;
                    renderTicketDetail(ticket, number);
                    ticketDetailView.classList.remove('hidden');
                    fetchTickets(); // Recarrega para atualizar status de lido
                }
            } catch (error) {
                console.error('Erro ao buscar detalhes do ticket:', error);
            }
        }

        function renderTicketDetail(ticket, number) {
            let statusColor = '';
            switch (ticket.status) {
                case 'Aberto': statusColor = 'bg-green-500'; break;
                case 'Em Andamento': statusColor = 'bg-yellow-500'; break;
                case 'Fechado': statusColor = 'bg-red-500'; break;
            }

            // NOVO: Utiliza a função de classes para a prioridade
            const priorityClasses = getPriorityClasses(ticket.priority);

            const messagesHtml = (ticket.messages || []).map(msg => {
                const isAgent = msg.author === AGENT_NAME;
                const isInternal = msg.isInternal || false; 

                let authorDisplay = msg.author;
                let messageClass = '';
                
                if (isInternal) {
                    authorDisplay = `NOTA INTERNA: ${AGENT_NAME}`;
                    messageClass = 'bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-800 dark:border-purple-900 dark:text-gray-50';
                } else if (isAgent) {
                    authorDisplay = `Você (${AGENT_NAME})`;
                    messageClass = 'bg-blue-100 border-blue-200 dark:bg-blue-800 dark:border-blue-900';
                } else {
                    messageClass = 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600';
                }
                
                const highlightClass = body.classList.contains('dark') ? 'text-highlight-date-dark' : 'text-gray-400';
                const highlightAuthorClass = body.classList.contains('dark') ? 'text-highlight-dark' : 'text-gray-800';
                const messageTextColor = isInternal ? '' : 'text-gray-850 dark:text-gray-200';

                return `
                    <div class="p-3 rounded-lg shadow-sm mb-2 border ${messageClass}">
                        <p class="text-sm ${messageTextColor} message-content">${msg.text}</p>
                        <p class="text-xs ${highlightClass} mt-1">
                            Enviado por <span class="font-semibold ${highlightAuthorClass}">${authorDisplay}</span> em ${msg.timestamp.toLocaleString()}
                        </p>
                    </div>
                `;
            }).join('');
            
            const assignedToHtml = ticket.assignedTo ? 
                `<p class="text-sm text-gray-600">Atribuído a: <span class="font-medium text-gray-800">${ticket.assignedTo}</span></p>` : '';

            let actionSectionHtml = '';

            if (ticket.status === 'Aberto') {
                actionSectionHtml = `
                    <div id="accept-ticket-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                        <button id="accept-ticket-btn" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Aceitar Ticket
                        </button>
                    </div>
                `;
            } else if (ticket.status === 'Em Andamento') {
                actionSectionHtml = `
                    <div id="update-status-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                        <label for="status-select" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Atualizar Status</label>
                        <div>
                            <select id="status-select" class="block w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="Aberto">Aberto</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Fechado">Fechado</option>
                            </select>
                            <button id="update-status-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                Salvar Status
                            </button>
                        </div>
                        <div id="update-message" class="mt-2 text-center text-sm"></div>
                    </div>
                    
                    <div id="update-priority-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                        <label for="priority-select" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Mudar Prioridade</label>
                        <div>
                            <select id="priority-select" class="block w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="Baixa">Baixa</option>
                                <option value="Normal">Normal</option>
                                <option value="Alta">Alta</option>
                            </select>
                            <button id="update-priority-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                Salvar Prioridade
                            </button>
                        </div>
                        <div id="priority-message" class="mt-2 text-center text-sm"></div>
                    </div>
                    `;
            } else if (ticket.status === 'Fechado') {
                 actionSectionHtml = `
                    <div id="reopen-ticket-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                        <button id="reopen-ticket-btn" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Reabrir Ticket
                        </button>
                    </div>
                `;
            }

            // Seção de Resposta e Nota Interna (RF1.7 e RF2.2)
            const replySectionHtml = ticket.status !== 'Fechado' ? `
                <div id="reply-to-ticket-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                    <h4 class="font-semibold text-gray-700 dark:text-gray-400 mb-2">Responder ao Cliente (E-mail)</h4>
                    <textarea id="reply-message" rows="3" placeholder="Digite sua resposta aqui..." class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                    
                    <button id="toggle-kb-modal-btn" class="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.203 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.523 5.797 18 7.5 18s3.332.477 4.5 1.247m0-13c1.168.776 2.797 1.247 4.5 1.247 1.703 0 3.332-.477 4.5-1.247M12 6.253v13" />
                        </svg>
                        <span>Buscar na Base de Conhecimento</span>
                    </button>
                    
                    <button id="reply-btn" class="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Enviar Resposta
                    </button>
                    <div id="reply-message-status" class="mt-2 text-center text-sm"></div>
                </div>
                
                <div id="kb-simulated-modal" class="hidden absolute inset-0 z-10 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-purple-300 dark:border-purple-700">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b">
                        <h5 class="text-lg font-bold text-purple-600 dark:text-purple-400">Artigos da Base de Conhecimento</h5>
                        <button id="close-kb-modal-btn" class="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-xl">&times;</button>
                    </div>
                    <div id="kb-articles-list" class="space-y-2 overflow-y-auto max-h-64">
                        </div>
                </div>

                <div id="internal-note-section" class="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner dark:bg-gray-700">
                    <h4 class="font-semibold text-gray-700 dark:text-gray-400 mb-2">Nota Interna (Não enviada ao cliente)</h4>
                    <textarea id="internal-note-message" rows="3" placeholder="Registre uma observação para a equipe..." class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                    <button id="internal-note-btn" class="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Adicionar Nota
                    </button>
                    <div id="internal-note-status" class="mt-2 text-center text-sm"></div>
                </div>
            ` : '';

            selectedTicketContent.innerHTML = `
                <div class="flex items-center justify-between mb-4 border-b pb-2 view-header-content">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">Assunto: #${number} - ${ticket.subject}</h3>
                    <div class="flex flex-col items-end space-y-1">
                         <span class="text-sm font-semibold px-3 py-1 rounded-full ${priorityClasses}">${ticket.priority}</span>
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 rounded-full ${statusColor}"></span>
                            <span class="text-gray-600 dark:text-gray-300">${ticket.status}</span>
                        </div>
                    </div>
                </div>
                <div class="mb-4 space-y-1 view-header-content">
                    <p class="text-sm text-gray-600 dark:text-gray-400">De: <span class="font-medium text-gray-600 dark:text-gray-300">${ticket.from}</span></p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">ID: <span class="font-medium text-gray-800 dark:text-gray-300">${ticket.id}</span></p>
                    ${assignedToHtml}
                </div>
                
                <div id="ticket-history-panel" class="ticket-history-panel max-h-64 overflow-y-auto mb-4 border border-gray-300 p-3 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600">
                    <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Histórico</h4>
                    ${messagesHtml}
                </div>
                
                <div id="action-and-reply-section">
                    ${replySectionHtml}
                    ${actionSectionHtml}
                </div>
            `;
            
            // Lógica para atualização de status
            const statusSelect = document.getElementById('status-select');
            const updateStatusBtn = document.getElementById('update-status-btn');
            const updateMessage = document.getElementById('update-message');

            if (statusSelect) {
                statusSelect.value = ticket.status;
                updateStatusBtn.addEventListener('click', async () => {
                    const newStatus = statusSelect.value;
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });

                        if (response.ok) {
                            updateMessage.textContent = 'Status atualizado com sucesso!';
                            updateMessage.classList.add('text-green-600');
                            setTimeout(() => {
                                updateMessage.textContent = '';
                                updateMessage.classList.remove('text-green-600');
                            }, 2000);
                            fetchTickets();
                            selectTicketById(ticket.id, number);
                        } else {
                            updateMessage.textContent = 'Erro ao atualizar status.';
                            updateMessage.classList.add('text-red-600');
                        }
                    } catch (error) {
                        console.error('Erro:', error);
                        updateMessage.textContent = 'Erro de conexão.';
                        updateMessage.classList.add('text-red-600');
                    }
                });
            }
            
            // NOVO: Lógica para MUDANÇA DE PRIORIDADE
            const prioritySelect = document.getElementById('priority-select');
            const updatePriorityBtn = document.getElementById('update-priority-btn');
            const priorityMessage = document.getElementById('priority-message');
            
            if (prioritySelect) {
                prioritySelect.value = ticket.priority; // Define o valor atual no select
                
                updatePriorityBtn.addEventListener('click', async () => {
                    const newPriority = prioritySelect.value;
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/priority`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ priority: newPriority })
                        });

                        if (response.ok) {
                            priorityMessage.textContent = 'Prioridade atualizada com sucesso!';
                            priorityMessage.classList.add('text-green-600');
                            setTimeout(() => {
                                priorityMessage.textContent = '';
                                priorityMessage.classList.remove('text-green-600');
                            }, 2000);
                            fetchTickets();
                            selectTicketById(ticket.id, number);
                        } else {
                            priorityMessage.textContent = 'Erro ao atualizar prioridade.';
                            priorityMessage.classList.add('text-red-600');
                        }
                    } catch (error) {
                        console.error('Erro:', error);
                        priorityMessage.textContent = 'Erro de conexão.';
                        priorityMessage.classList.add('text-red-600');
                    }
                });
            }
            // FIM NOVO: Lógica para MUDANÇA DE PRIORIDADE
            
            // Lógica para Reabrir/Aceitar 
            const reopenTicketBtn = document.getElementById('reopen-ticket-btn');
            if (reopenTicketBtn) {
                reopenTicketBtn.addEventListener('click', async () => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Em Andamento' })
                        });
                        if (response.ok) {
                            fetchTickets();
                            selectTicketById(ticket.id, number);
                        }
                    } catch (error) {
                        console.error('Erro ao reabrir ticket:', error);
                    }
                });
            }

            const acceptTicketBtn = document.getElementById('accept-ticket-btn');
            if (acceptTicketBtn) {
                acceptTicketBtn.addEventListener('click', async () => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Em Andamento' })
                        });
                        if (response.ok) {
                            fetchTickets();
                            selectTicketById(ticket.id, number);
                        }
                    } catch (error) {
                        console.error('Erro ao aceitar ticket:', error);
                    }
                });
            }

            // Lógica para responder ao ticket 
            const replyBtn = document.getElementById('reply-btn');
            if (replyBtn) {
                const replyMessageTextarea = document.getElementById('reply-message');
                const replyMessageStatus = document.getElementById('reply-message-status');

                replyBtn.addEventListener('click', async () => {
                    const replyText = replyMessageTextarea.value.trim();
                    if (replyText === '') {
                        replyMessageStatus.textContent = 'Por favor, digite uma mensagem.';
                        replyMessageStatus.classList.add('text-red-600');
                        return;
                    }

                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${currentTicketId}/reply`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: replyText })
                        });

                        if (response.ok) {
                            replyMessageTextarea.value = '';
                            replyMessageStatus.textContent = 'Resposta enviada!';
                            replyMessageStatus.classList.add('text-green-600');
                            
                            selectTicketById(currentTicketId, number);
                            
                            setTimeout(() => {
                                replyMessageStatus.textContent = '';
                                replyMessageStatus.classList.remove('text-green-600');
                            }, 1000);
                        } else {
                            replyMessageStatus.textContent = 'Erro ao enviar resposta.';
                            replyMessageStatus.classList.add('text-red-600');
                        }
                    } catch (error) {
                        console.error('Erro:', error);
                        replyMessageStatus.textContent = 'Erro de conexão.';
                        replyMessageStatus.classList.add('text-red-600');
                    }
                });
            }
            
            // Lógica para Base de Conhecimento (Simulação)
            const toggleKbModalBtn = document.getElementById('toggle-kb-modal-btn');
            const kbModal = document.getElementById('kb-simulated-modal');
            const closeKbModalBtn = document.getElementById('close-kb-modal-btn');

            if (toggleKbModalBtn) {
                toggleKbModalBtn.addEventListener('click', () => {
                    kbModal.classList.toggle('hidden');
                    if (!kbModal.classList.contains('hidden')) {
                        renderKbArticles(); // Renderiza os artigos ao abrir
                    }
                });
            }
            if (closeKbModalBtn) {
                closeKbModalBtn.addEventListener('click', () => {
                    kbModal.classList.add('hidden');
                });
            }

            
            // Lógica para Notas Internas 
            const internalNoteBtn = document.getElementById('internal-note-btn');
            if (internalNoteBtn) {
                const internalNoteTextarea = document.getElementById('internal-note-message');
                const internalNoteStatus = document.getElementById('internal-note-status');

                internalNoteBtn.addEventListener('click', async () => {
                    const noteText = internalNoteTextarea.value.trim();
                    if (noteText === '') {
                        internalNoteStatus.textContent = 'Por favor, digite uma nota.';
                        internalNoteStatus.classList.add('text-red-600');
                        return;
                    }

                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/tickets/${currentTicketId}/note`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: noteText })
                        });

                        if (response.ok) {
                            internalNoteTextarea.value = '';
                            internalNoteStatus.textContent = 'Nota interna registrada!';
                            internalNoteStatus.classList.add('text-green-600');
                            
                            selectTicketById(currentTicketId, number);
                            
                            setTimeout(() => {
                                internalNoteStatus.textContent = '';
                                internalNoteStatus.classList.remove('text-green-600');
                            }, 1000);
                        } else {
                            internalNoteStatus.textContent = 'Erro ao registrar nota.';
                            internalNoteStatus.classList.add('text-red-600');
                        }
                    } catch (error) {
                        console.error('Erro:', error);
                        internalNoteStatus.textContent = 'Erro de conexão.';
                        internalNoteStatus.classList.add('text-red-600');
                    }
                });
            }
            // Garante que o histórico role para a última mensagem ao abrir o ticket
            setTimeout(() => {
                const historyPanel = document.getElementById('ticket-history-panel');
                if (historyPanel) historyPanel.scrollTop = historyPanel.scrollHeight;
            }, 100);
        }
        
        // Lidar com o envio do formulário de novo ticket 
        newTicketForm.onsubmit = async (event) => {
            event.preventDefault();
            const subject = document.getElementById('ticket-subject').value;
            const from = document.getElementById('ticket-from').value;
            const message = document.getElementById('ticket-message').value;
            const priority = document.getElementById('ticket-priority').value;

            if (!subject || !from || !message) {
                formMessage.textContent = "Por favor, preencha todos os campos.";
                formMessage.classList.add('text-red-600');
                return;
            }

            formMessage.textContent = "Criando ticket...";
            formMessage.classList.remove('text-red-600', 'text-green-600');
            formMessage.classList.add('text-yellow-600');

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
                
                const response = await fetch('http://127.0.0.1:5000/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, from, message, priority }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    newTicketForm.reset();
                    formMessage.textContent = "Ticket criado com sucesso!";
                    formMessage.classList.remove('text-yellow-600');
                    formMessage.classList.add('text-green-600');
                    fetchTickets();
                    fetchMetrics();
                } else {
                    const errorText = await response.text();
                    formMessage.textContent = `Erro: ${response.status} - ${errorText}`;
                    formMessage.classList.remove('text-yellow-600');
                    formMessage.classList.add('text-red-600');
                }
            } catch (error) {
                console.error('Erro:', error);
                if (error.name === 'AbortError') {
                    formMessage.textContent = "Timeout - Tente novamente.";
                } else {
                    formMessage.textContent = "Erro de conexão - Verifique se o backend está rodando.";
                }
                formMessage.classList.remove('text-yellow-600');
                formMessage.classList.add('text-red-600');
            }
        };
        
        // Função para alternar o modo de tela cheia do histórico 
        function toggleHistoryFullscreen() {
            const historyPanel = document.getElementById('ticket-history-panel');
            const viewHeaderContent = document.querySelectorAll('.view-header-content');
            const actionSection = document.getElementById('action-and-reply-section');
            
            const isFullscreen = ticketDetailView.classList.contains('is-fullscreen');
            
            if (!isFullscreen) {
                // Entrando no modo fullscreen
                ticketDetailView.classList.add('is-fullscreen');
                if (historyPanel) historyPanel.classList.add('ticket-history-panel-fullscreen');
                viewHeaderContent.forEach(el => el.classList.add('hidden'));
                if (actionSection) actionSection.classList.add('hidden');
                ticketCreateView.classList.add('hidden');
                ticketListView.classList.add('hidden');
                expandIcon.classList.add('hidden');
                closeIcon.classList.remove('hidden');
                if (historyPanel) historyPanel.scrollTop = 0;
            } else {
                // Saindo do modo fullscreen
                ticketDetailView.classList.remove('is-fullscreen');
                if (historyPanel) historyPanel.classList.remove('ticket-history-panel-fullscreen');
                viewHeaderContent.forEach(el => el.classList.remove('hidden'));
                if (actionSection) actionSection.classList.remove('hidden');
                ticketCreateView.classList.remove('hidden');
                ticketListView.classList.remove('hidden');
                expandIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
                if (historyPanel) historyPanel.scrollTop = historyPanel.scrollHeight;
            }
        }

        // Função para copiar o ID do usuário 
        function copyUserId() {
            const userId = 'a1b2c3d4-e5f6-7g8h-i9j0';
            if (userId) {
                navigator.clipboard.writeText(userId).then(() => {
                    copyTooltip.classList.add('show');
                    setTimeout(() => {
                        copyTooltip.classList.remove('show');
                    }, 2000);
                }).catch(err => {
                    console.error('Falha ao copiar o ID: ', err);
                });
            }
        }
        
        // Lógica para alternar o modo escuro 
        function toggleDarkMode() {
            body.classList.toggle('dark');
            const isDarkMode = body.classList.contains('dark');
            
            // Alterna ícones da aplicação principal
            moonIcon.classList.toggle('hidden', isDarkMode);
            sunIcon.classList.toggle('hidden', !isDarkMode);

            // Alterna ícones da tela de login
            loginMoonIcon.classList.toggle('hidden', isDarkMode);
            loginSunIcon.classList.toggle('hidden', !isDarkMode);
            
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Renderiza a lista de tickets para aplicar o estilo correto, se a app estiver visível
            if (!mainApp.classList.contains('hidden')) {
                 renderTickets(tickets);
                 // Tenta renderizar o detalhe se um ticket estiver selecionado
                 if(currentTicketId) {
                    selectTicketById(currentTicketId, 'X'); 
                 }
            } else if (!reportsDashboard.classList.contains('hidden')) {
                // Se estiver no dashboard, re-renderiza os relatórios para o tema
                renderReports(); // Chamará renderCharts() para atualizar as cores das legendas
            }
        }

        // Verifica a preferência do usuário ao carregar a página
        function checkThemePreference() {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const savedTheme = localStorage.getItem('theme');
            
            if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
                body.classList.add('dark');
                if (moonIcon) moonIcon.classList.add('hidden');
                if (sunIcon) sunIcon.classList.remove('hidden');
                if (loginMoonIcon) loginMoonIcon.classList.add('hidden');
                if (loginSunIcon) loginSunIcon.classList.remove('hidden');
            } else {
                if (moonIcon) moonIcon.classList.remove('hidden');
                if (sunIcon) sunIcon.classList.add('hidden');
                if (loginMoonIcon) loginMoonIcon.classList.remove('hidden');
                if (loginSunIcon) loginSunIcon.classList.add('hidden');
            }
        }

        // Atualizar métricas automaticamente a cada 30 segundos (30000ms)
        setInterval(fetchMetrics, 30000);
        
        window.onload = () => {
            // Inicializa o tema e mostra a tela de Login
            checkThemePreference(); 
            showApp(false);

            copyUserIdBtn.addEventListener('click', copyUserId);
            toggleFullscreenBtn.addEventListener('click', toggleHistoryFullscreen);
            
            // Adiciona listeners para os botões de tema (tanto no login quanto na app)
            if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleDarkMode);
            if (loginThemeToggleBtn) loginThemeToggleBtn.addEventListener('click', toggleDarkMode);

            // NOVOS LISTENERS PARA O DASHBOARD
            if (reportsBtn) reportsBtn.addEventListener('click', showReportsDashboard);
            if (closeReportsBtn) closeReportsBtn.addEventListener('click', hideReportsDashboard);

            // Lógica para os botões de filtro 
            filterButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    filterButtons.forEach(btn => {
                        btn.classList.remove('bg-blue-600', 'text-white');
                        btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
                    });
                    event.target.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
                    event.target.classList.add('bg-blue-600', 'text-white');
                    
                    currentFilter = event.target.textContent.trim();
                    fetchTickets(currentFilter === 'Todos' ? null : currentFilter);
                    fetchMetrics(); // Atualizar métricas após mudanças nos filtros
                });
            });

            // Lógica para a barra de pesquisa 
            ticketSearchInput.addEventListener('input', () => {
                const searchQuery = ticketSearchInput.value;
                fetchTickets(currentFilter === 'Todos' ? null : currentFilter, searchQuery);
            });
        };
