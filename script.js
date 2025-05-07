document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const tabs = document.querySelectorAll('.tab-btn');
    const formSections = document.querySelectorAll('.form-section');
    const statusMessageDiv = document.getElementById('statusMessage');

    // Agência Form
    const agenciaForm = document.getElementById('cadastroAgenciaForm');
    const agenciaEditingKeyInput = document.getElementById('agenciaEditingKey');
    const agenciaNomeInput = document.getElementById('agenciaNome');
    const agenciaCidadeInput = document.getElementById('agenciaCidade');
    const agenciaAtivosInput = document.getElementById('agenciaAtivos');
    const agenciaListDiv = document.getElementById('agenciaList');
    const limparAgenciaFormBtn = document.getElementById('limparAgenciaForm');

    // Cliente Form
    const clienteForm = document.getElementById('cadastroClienteForm');
    const clienteEditingKeyInput = document.getElementById('clienteEditingKey');
    const clienteNomeInput = document.getElementById('clienteNome');
    const clienteEnderecoInput = document.getElementById('clienteEndereco');
    const clienteCidadeInput = document.getElementById('clienteCidade');
    const clienteListDiv = document.getElementById('clienteList');
    const limparClienteFormBtn = document.getElementById('limparClienteForm');

    // Conta Form
    const contaForm = document.getElementById('cadastroContaForm');
    const contaEditingKeyInput = document.getElementById('contaEditingKey');
    const contaAgenciaNomeSelect = document.getElementById('contaAgenciaNome');
    const contaClienteNomeSelect = document.getElementById('contaClienteNome');
    const contaNumeroInput = document.getElementById('contaNumero');
    const contaSaldoInput = document.getElementById('contaSaldo');
    const contaListDiv = document.getElementById('contaList');
    const limparContaFormBtn = document.getElementById('limparContaForm');

    // Footer year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- LocalStorage Keys ---
    const AGENCIA_KEY = 'banco_agencias_v2'; // Changed key to avoid conflicts with old data if any
    const CLIENTE_KEY = 'banco_clientes_v2';
    const CONTA_KEY = 'banco_contas_v2';

    // --- Utility Functions ---
    const getItems = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveItems = (key, items) => localStorage.setItem(key, JSON.stringify(items));

    let messageTimeout;
    const showStatusMessage = (message, type = 'info', duration = 3500) => {
        clearTimeout(messageTimeout);
        statusMessageDiv.className = `alert alert-${type}`;
        statusMessageDiv.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-triangle' : type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'} alert-icon"></i> ${message}`;
        statusMessageDiv.classList.add('show');
        messageTimeout = setTimeout(() => {
            statusMessageDiv.classList.remove('show');
        }, duration);
    };
    
    const toggleButtonLoading = (button, isLoading) => {
        if (!button) return;
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };

    // --- Tab Management ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActiveTabBtn = document.querySelector('.tab-btn.active');
            if (currentActiveTabBtn === tab) return; // Do nothing if already active

            tabs.forEach(t => t.classList.remove('active'));
            formSections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const targetFormId = `form${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`;
            document.getElementById(targetFormId).classList.add('active');
            
            clearAllFormsAndEditingKeys(); 
            
            if (tab.dataset.tab === 'conta') {
                populateAgenciaDropdown();
                populateClienteDropdown();
            }
            // Focus first input in new active tab
            const firstInput = document.getElementById(targetFormId).querySelector('input:not([type="hidden"]), select');
            if (firstInput) {
                firstInput.focus();
            }
        });
    });

    const clearAllFormsAndEditingKeys = () => {
        agenciaForm.reset();
        agenciaEditingKeyInput.value = '';
        agenciaNomeInput.disabled = false;

        clienteForm.reset();
        clienteEditingKeyInput.value = '';
        clienteNomeInput.disabled = false;

        contaForm.reset();
        contaEditingKeyInput.value = '';
        contaNumeroInput.disabled = false;
        
        contaAgenciaNomeSelect.value = '';
        contaClienteNomeSelect.value = '';
    };

    // --- Agência CRUD ---
    const renderAgencias = () => {
        const agencias = getItems(AGENCIA_KEY);
        agenciaListDiv.innerHTML = '';
        if (agencias.length === 0) {
            agenciaListDiv.innerHTML = '<p class="data-list-empty">Nenhuma agência cadastrada.</p>';
            return;
        }
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Cidade</th>
                    <th>Ativos (R$)</th>
                    <th class="actions-header">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${agencias.map(ag => `
                    <tr>
                        <td data-label="Nome">${ag.nome}</td>
                        <td data-label="Cidade">${ag.cidade || '-'}</td>
                        <td data-label="Ativos (R$)">${ag.ativos ? parseFloat(ag.ativos).toFixed(2) : '-'}</td>
                        <td class="actions">
                            <button class="btn btn-warning btn-sm btn-edit" data-key="${encodeURIComponent(ag.nome)}" data-entity="agencia" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm btn-delete" data-key="${encodeURIComponent(ag.nome)}" data-entity="agencia" title="Excluir"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        agenciaListDiv.appendChild(table);
    };

    agenciaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = agenciaNomeInput.value.trim();
        const cidade = agenciaCidadeInput.value.trim();
        const ativos = agenciaAtivosInput.value;
        const editingKey = decodeURIComponent(agenciaEditingKeyInput.value || '');

        if (!nome) {
            showStatusMessage('Nome da agência é obrigatório.', 'danger');
            return;
        }

        const button = e.submitter;
        toggleButtonLoading(button, true);

        setTimeout(() => { // Simulate async
            let agencias = getItems(AGENCIA_KEY);
            if (editingKey) { 
                const index = agencias.findIndex(ag => ag.nome === editingKey);
                if (index !== -1) {
                    if (nome !== editingKey && agencias.some(ag => ag.nome === nome)) {
                         showStatusMessage('Já existe uma agência com este novo nome.', 'danger');
                         toggleButtonLoading(button, false);
                         return;
                    }
                    if (nome !== editingKey) {
                        let contas = getItems(CONTA_KEY);
                        contas.forEach(c => {
                            if (c.agenciaNome === editingKey) c.agenciaNome = nome;
                        });
                        saveItems(CONTA_KEY, contas);
                        if (document.querySelector('.tab-btn[data-tab="conta"].active')) renderContas(); // Refresh if visible
                    }
                    agencias[index] = { nome, cidade, ativos: ativos || "0" };
                    saveItems(AGENCIA_KEY, agencias);
                    showStatusMessage('Agência alterada com sucesso!', 'success');
                } else {
                     showStatusMessage('Erro: Agência original não encontrada para alteração.', 'danger');
                }
            } else { 
                if (agencias.some(ag => ag.nome === nome)) {
                    showStatusMessage('Já existe uma agência com este nome.', 'danger');
                    toggleButtonLoading(button, false);
                    return;
                }
                agencias.push({ nome, cidade, ativos: ativos || "0" });
                saveItems(AGENCIA_KEY, agencias);
                showStatusMessage('Agência cadastrada com sucesso!', 'success');
            }
            agenciaForm.reset();
            agenciaEditingKeyInput.value = '';
            agenciaNomeInput.disabled = false;
            renderAgencias();
            populateAgenciaDropdown(); 
            toggleButtonLoading(button, false);
        }, 300); // simulate delay
    });
    
    limparAgenciaFormBtn.addEventListener('click', () => {
        agenciaForm.reset();
        agenciaEditingKeyInput.value = '';
        agenciaNomeInput.disabled = false;
        showStatusMessage('Formulário da agência limpo.', 'info');
        agenciaNomeInput.focus();
    });

    window.editAgencia = (encodedKey) => {
        const nomeKey = decodeURIComponent(encodedKey);
        const agencias = getItems(AGENCIA_KEY);
        const agencia = agencias.find(ag => ag.nome === nomeKey);
        if (agencia) {
            const targetTabButton = document.querySelector('.tab-btn[data-tab="agencia"]');
            if (!targetTabButton.classList.contains('active')) {
                targetTabButton.click(); 
            } else {
                 // If already on the tab, manually clear form before populating for edit
                agenciaForm.reset();
                agenciaEditingKeyInput.value = '';
            }
            
            agenciaNomeInput.value = agencia.nome;
            agenciaCidadeInput.value = agencia.cidade || '';
            agenciaAtivosInput.value = agencia.ativos || '';
            agenciaEditingKeyInput.value = encodeURIComponent(agencia.nome);
            // agenciaNomeInput.disabled = true; // Optionally disable editing primary key
            showStatusMessage(`Editando agência: ${agencia.nome}.`, 'info');
            agenciaNomeInput.focus();
        }
    };

    window.deleteAgencia = (encodedKey) => {
        const nomeKey = decodeURIComponent(encodedKey);
        if (confirm(`Tem certeza que deseja excluir a agência "${nomeKey}"?`)) {
            const contas = getItems(CONTA_KEY);
            if (contas.some(c => c.agenciaNome === nomeKey)) {
                showStatusMessage(`Não é possível excluir a agência "${nomeKey}", pois ela está associada a uma ou mais contas.`, 'danger');
                return;
            }
            let agencias = getItems(AGENCIA_KEY);
            agencias = agencias.filter(ag => ag.nome !== nomeKey);
            saveItems(AGENCIA_KEY, agencias);
            renderAgencias();
            populateAgenciaDropdown();
            showStatusMessage('Agência excluída com sucesso!', 'success');
            if (decodeURIComponent(agenciaEditingKeyInput.value || '') === nomeKey) {
                agenciaForm.reset();
                agenciaEditingKeyInput.value = '';
                agenciaNomeInput.disabled = false;
            }
        }
    };

    // --- Cliente CRUD (similar structure to Agência) ---
    const renderClientes = () => {
        const clientes = getItems(CLIENTE_KEY);
        clienteListDiv.innerHTML = '';
         if (clientes.length === 0) {
            clienteListDiv.innerHTML = '<p class="data-list-empty">Nenhum cliente cadastrado.</p>';
            return;
        }
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Endereço</th>
                    <th>Cidade</th>
                    <th class="actions-header">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(cl => `
                    <tr>
                        <td data-label="Nome">${cl.nome}</td>
                        <td data-label="Endereço">${cl.endereco || '-'}</td>
                        <td data-label="Cidade">${cl.cidade || '-'}</td>
                        <td class="actions">
                            <button class="btn btn-warning btn-sm btn-edit" data-key="${encodeURIComponent(cl.nome)}" data-entity="cliente" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm btn-delete" data-key="${encodeURIComponent(cl.nome)}" data-entity="cliente" title="Excluir"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        clienteListDiv.appendChild(table);
    };

    clienteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = clienteNomeInput.value.trim();
        const endereco = clienteEnderecoInput.value.trim();
        const cidade = clienteCidadeInput.value.trim();
        const editingKey = decodeURIComponent(clienteEditingKeyInput.value || '');

        if (!nome) {
            showStatusMessage('Nome do cliente é obrigatório.', 'danger');
            return;
        }
        
        const button = e.submitter;
        toggleButtonLoading(button, true);

        setTimeout(() => { // Simulate async
            let clientes = getItems(CLIENTE_KEY);
            if (editingKey) { 
                const index = clientes.findIndex(cl => cl.nome === editingKey);
                if (index !== -1) {
                    if (nome !== editingKey && clientes.some(cl => cl.nome === nome)) {
                         showStatusMessage('Já existe um cliente com este novo nome.', 'danger');
                         toggleButtonLoading(button, false);
                         return;
                    }
                    if (nome !== editingKey) {
                        let contas = getItems(CONTA_KEY);
                        contas.forEach(c => {
                            if (c.clienteNome === editingKey) c.clienteNome = nome;
                        });
                        saveItems(CONTA_KEY, contas);
                         if (document.querySelector('.tab-btn[data-tab="conta"].active')) renderContas();
                    }
                    clientes[index] = { nome, endereco, cidade };
                    saveItems(CLIENTE_KEY, clientes);
                    showStatusMessage('Cliente alterado com sucesso!', 'success');
                } else {
                     showStatusMessage('Erro: Cliente original não encontrado para alteração.', 'danger');
                }
            } else { 
                if (clientes.some(cl => cl.nome === nome)) {
                    showStatusMessage('Já existe um cliente com este nome.', 'danger');
                    toggleButtonLoading(button, false);
                    return;
                }
                clientes.push({ nome, endereco, cidade });
                saveItems(CLIENTE_KEY, clientes);
                showStatusMessage('Cliente cadastrado com sucesso!', 'success');
            }
            clienteForm.reset();
            clienteEditingKeyInput.value = '';
            clienteNomeInput.disabled = false;
            renderClientes();
            populateClienteDropdown(); 
            toggleButtonLoading(button, false);
        }, 300);
    });

    limparClienteFormBtn.addEventListener('click', () => {
        clienteForm.reset();
        clienteEditingKeyInput.value = '';
        clienteNomeInput.disabled = false;
        showStatusMessage('Formulário do cliente limpo.', 'info');
        clienteNomeInput.focus();
    });

    window.editCliente = (encodedKey) => {
        const nomeKey = decodeURIComponent(encodedKey);
        const clientes = getItems(CLIENTE_KEY);
        const cliente = clientes.find(cl => cl.nome === nomeKey);
        if (cliente) {
            const targetTabButton = document.querySelector('.tab-btn[data-tab="cliente"]');
            if (!targetTabButton.classList.contains('active')) {
                targetTabButton.click();
            } else {
                clienteForm.reset();
                clienteEditingKeyInput.value = '';
            }
            
            clienteNomeInput.value = cliente.nome;
            clienteEnderecoInput.value = cliente.endereco || '';
            clienteCidadeInput.value = cliente.cidade || '';
            clienteEditingKeyInput.value = encodeURIComponent(cliente.nome);
            showStatusMessage(`Editando cliente: ${cliente.nome}.`, 'info');
            clienteNomeInput.focus();
        }
    };

    window.deleteCliente = (encodedKey) => {
        const nomeKey = decodeURIComponent(encodedKey);
        if (confirm(`Tem certeza que deseja excluir o cliente "${nomeKey}"?`)) {
            const contas = getItems(CONTA_KEY);
            if (contas.some(c => c.clienteNome === nomeKey)) {
                showStatusMessage(`Não é possível excluir o cliente "${nomeKey}", pois ele está associado a uma ou mais contas.`, 'danger');
                return;
            }
            let clientes = getItems(CLIENTE_KEY);
            clientes = clientes.filter(cl => cl.nome !== nomeKey);
            saveItems(CLIENTE_KEY, clientes);
            renderClientes();
            populateClienteDropdown(); 
            showStatusMessage('Cliente excluído com sucesso!', 'success');
            if (decodeURIComponent(clienteEditingKeyInput.value || '') === nomeKey) {
                clienteForm.reset();
                clienteEditingKeyInput.value = '';
                clienteNomeInput.disabled = false;
            }
        }
    };

    // --- Conta CRUD ---
    const populateAgenciaDropdown = () => {
        const agencias = getItems(AGENCIA_KEY);
        const currentVal = contaAgenciaNomeSelect.value;
        contaAgenciaNomeSelect.innerHTML = '<option value="">Selecione uma agência</option>';
        agencias.forEach(ag => {
            const option = document.createElement('option');
            option.value = ag.nome;
            option.textContent = ag.nome;
            contaAgenciaNomeSelect.appendChild(option);
        });
        if (agencias.some(ag => ag.nome === currentVal)) { // Preserve selection if possible
            contaAgenciaNomeSelect.value = currentVal;
        }
    };

    const populateClienteDropdown = () => {
        const clientes = getItems(CLIENTE_KEY);
        const currentVal = contaClienteNomeSelect.value;
        contaClienteNomeSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        clientes.forEach(cl => {
            const option = document.createElement('option');
            option.value = cl.nome;
            option.textContent = cl.nome;
            contaClienteNomeSelect.appendChild(option);
        });
         if (clientes.some(cl => cl.nome === currentVal)) { // Preserve selection
            contaClienteNomeSelect.value = currentVal;
        }
    };

    const renderContas = () => {
        const contas = getItems(CONTA_KEY);
        contaListDiv.innerHTML = '';
        if (contas.length === 0) {
            contaListDiv.innerHTML = '<p class="data-list-empty">Nenhuma conta cadastrada.</p>';
            return;
        }
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nº Conta</th>
                    <th>Agência</th>
                    <th>Cliente</th>
                    <th>Saldo (R$)</th>
                    <th class="actions-header">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${contas.map(c => `
                    <tr>
                        <td data-label="Nº Conta">${c.numero}</td>
                        <td data-label="Agência">${c.agenciaNome}</td>
                        <td data-label="Cliente">${c.clienteNome}</td>
                        <td data-label="Saldo (R$)">${parseFloat(c.saldo).toFixed(2)}</td>
                        <td class="actions">
                            <button class="btn btn-warning btn-sm btn-edit" data-key="${encodeURIComponent(c.numero)}" data-entity="conta" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm btn-delete" data-key="${encodeURIComponent(c.numero)}" data-entity="conta" title="Excluir"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        contaListDiv.appendChild(table);
    };

    contaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const agenciaNome = contaAgenciaNomeSelect.value;
        const clienteNome = contaClienteNomeSelect.value;
        const numero = contaNumeroInput.value.trim();
        const saldo = contaSaldoInput.value || "0";
        const editingKey = decodeURIComponent(contaEditingKeyInput.value || '');

        if (!agenciaNome || !clienteNome || !numero) {
            showStatusMessage('Agência, Cliente e Número da Conta são obrigatórios.', 'danger');
            return;
        }

        const button = e.submitter;
        toggleButtonLoading(button, true);

        setTimeout(() => { // Simulate async
            let contas = getItems(CONTA_KEY);
            if (editingKey) { 
                const index = contas.findIndex(c => c.numero === editingKey);
                if (index !== -1) {
                     if (numero !== editingKey && contas.some(c => c.numero === numero)) {
                         showStatusMessage('Já existe uma conta com este novo número.', 'danger');
                         toggleButtonLoading(button, false);
                         return;
                    }
                    contas[index] = { numero, agenciaNome, clienteNome, saldo };
                    saveItems(CONTA_KEY, contas);
                    showStatusMessage('Conta alterada com sucesso!', 'success');
                } else {
                    showStatusMessage('Erro: Conta original não encontrada para alteração.', 'danger');
                }
            } else { 
                if (contas.some(c => c.numero === numero)) {
                    showStatusMessage('Já existe uma conta com este número.', 'danger');
                    toggleButtonLoading(button, false);
                    return;
                }
                contas.push({ numero, agenciaNome, clienteNome, saldo });
                saveItems(CONTA_KEY, contas);
                showStatusMessage('Conta cadastrada com sucesso!', 'success');
            }
            contaForm.reset();
            contaEditingKeyInput.value = '';
            contaNumeroInput.disabled = false;
            contaAgenciaNomeSelect.value = ''; 
            contaClienteNomeSelect.value = ''; 
            renderContas();
            toggleButtonLoading(button, false);
        }, 300);
    });
    
    limparContaFormBtn.addEventListener('click', () => {
        contaForm.reset();
        contaEditingKeyInput.value = '';
        contaNumeroInput.disabled = false;
        contaAgenciaNomeSelect.value = '';
        contaClienteNomeSelect.value = '';
        showStatusMessage('Formulário da conta limpo.', 'info');
        contaAgenciaNomeSelect.focus();
    });

    window.editConta = (encodedKey) => {
        const numeroKey = decodeURIComponent(encodedKey);
        const contas = getItems(CONTA_KEY);
        const conta = contas.find(c => c.numero === numeroKey);
        if (conta) {
            const targetTabButton = document.querySelector('.tab-btn[data-tab="conta"]');
            if (!targetTabButton.classList.contains('active')) {
                targetTabButton.click();
            } else {
                 contaForm.reset(); // Clear form if already on tab
                 contaEditingKeyInput.value = '';
            }
            
            // Ensure dropdowns are populated before setting values
            populateAgenciaDropdown(); 
            populateClienteDropdown();

            contaAgenciaNomeSelect.value = conta.agenciaNome;
            contaClienteNomeSelect.value = conta.clienteNome;
            contaNumeroInput.value = conta.numero;
            contaSaldoInput.value = conta.saldo;
            contaEditingKeyInput.value = encodeURIComponent(conta.numero);
            showStatusMessage(`Editando conta: ${conta.numero}.`, 'info');
            contaNumeroInput.focus();
        }
    };

    window.deleteConta = (encodedKey) => {
        const numeroKey = decodeURIComponent(encodedKey);
        if (confirm(`Tem certeza que deseja excluir a conta "${numeroKey}"?`)) {
            let contas = getItems(CONTA_KEY);
            contas = contas.filter(c => c.numero !== numeroKey);
            saveItems(CONTA_KEY, contas);
            renderContas();
            showStatusMessage('Conta excluída com sucesso!', 'success');
             if (decodeURIComponent(contaEditingKeyInput.value || '') === numeroKey) {
                contaForm.reset();
                contaEditingKeyInput.value = '';
                contaNumeroInput.disabled = false;
            }
        }
    };

    // --- Event Delegation for Edit/Delete Buttons ---
    function setupActionListeners() {
        const allListDivs = [agenciaListDiv, clienteListDiv, contaListDiv];
        allListDivs.forEach(listDiv => {
            listDiv.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-key]');
                if (!button) return;

                const key = button.dataset.key; // Already URI encoded from render function
                const entity = button.dataset.entity;

                if (button.classList.contains('btn-edit')) {
                    if (entity === 'agencia') window.editAgencia(key);
                    else if (entity === 'cliente') window.editCliente(key);
                    else if (entity === 'conta') window.editConta(key);
                } else if (button.classList.contains('btn-delete')) {
                    if (entity === 'agencia') window.deleteAgencia(key);
                    else if (entity === 'cliente') window.deleteCliente(key);
                    else if (entity === 'conta') window.deleteConta(key);
                }
            });
        });
    }

    // --- Initial Load ---
    const init = () => {
        renderAgencias();
        renderClientes();
        renderContas();
        
        populateAgenciaDropdown(); // Initial population for conta form
        populateClienteDropdown();
        
        setupActionListeners(); // Setup delegated event listeners for actions

        // Activate the first tab by default if none is active (e.g. on first load)
        const activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab) {
             document.querySelector('.tab-btn[data-tab="agencia"]').click();
        } else {
            // If a tab is already active (e.g. from browser cache), ensure its content is focused
            const targetFormId = `form${activeTab.dataset.tab.charAt(0).toUpperCase() + activeTab.dataset.tab.slice(1)}`;
            const firstInput = document.getElementById(targetFormId).querySelector('input:not([type="hidden"]), select');
            if (firstInput) {
                firstInput.focus();
            }
            if (activeTab.dataset.tab === 'conta') { // Ensure dropdowns are fresh if conta is active
                populateAgenciaDropdown();
                populateClienteDropdown();
            }
        }

    };

    init();
});