// ==============================
// AUTENTICAÇÃO E LOGIN
// ==============================

const telaLogin = document.getElementById("telaLogin");
const appContainer = document.querySelector(".app");
const btnLogin = document.getElementById("btnLogin");
const btnSair = document.getElementById("btnSair");
const erroLogin = document.getElementById("erroLogin");

function verificarAutenticacao() {
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    if (usuarioLogado === "true") {
        if (telaLogin) telaLogin.classList.add("hidden");
        if (appContainer) appContainer.style.display = "flex";
        
        // Garante que ao entrar vai para a tela principal (Dashboard)
        redirecionarParaDashboard();
    } else {
        if (telaLogin) telaLogin.classList.remove("hidden");
        if (appContainer) appContainer.style.display = "none";
    }
}

function redirecionarParaDashboard() {
    // Remove o destaque de todos os itens do menu e ativa o Dashboard
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(menu => menu.classList.remove("active"));
    
    const menuDash = document.querySelector('.menu-item[data-page="dashboard"]');
    if (menuDash) menuDash.classList.add("active");

    // Esconde todas as páginas e exibe a página do Dashboard
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => page.classList.add("hidden"));

    const pageDashboard = document.getElementById("page-dashboard");
    if (pageDashboard) pageDashboard.classList.remove("hidden");
}

function realizarLogin() {
    const inputUsuario = document.getElementById("loginUsuario");
    const inputSenha = document.getElementById("loginSenha");

    const usuario = inputUsuario ? inputUsuario.value.trim().toUpperCase() : "";
    const senha = inputSenha ? inputSenha.value.trim().toUpperCase() : "";

    if (usuario === "ADM" && senha === "ADM") {
        localStorage.setItem("usuarioLogado", "true");
        if (erroLogin) erroLogin.classList.add("hidden");
        
        // Limpa os campos de input do login
        if (inputUsuario) inputUsuario.value = "";
        if (inputSenha) inputSenha.value = "";

        verificarAutenticacao();
    } else {
        if (erroLogin) erroLogin.classList.remove("hidden");
    }
}

if (btnLogin) btnLogin.addEventListener("click", realizarLogin);

const formLoginOnSubmit = document.getElementById("formLoginOnSubmit");
if (formLoginOnSubmit) {
    formLoginOnSubmit.addEventListener("submit", function(event) {
        event.preventDefault();
        realizarLogin();
    });
}

if (btnSair) {
    btnSair.addEventListener("click", function(e) {
        e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        verificarAutenticacao();
    });
}

// ==============================
// FUNÇÕES AUXILIARES / UTILITÁRIAS
// ==============================

function converterMoedaParaNumero(valorTexto) {
    if (!valorTexto) return 0;
    if (typeof valorTexto === "number") return valorTexto;
    const limpo = valorTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return Number(limpo) || 0;
}

function aplicarMascaraMoeda(input) {
    if (!input) return;
    input.addEventListener("input", function(e) {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor === "") {
            e.target.value = "";
            return;
        }
        valor = (Number(valor) / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
        e.target.value = valor;
    });
}

// Aplicação automática de máscara em todos os inputs com a classe .input-moeda
document.querySelectorAll(".input-moeda").forEach(input => {
    aplicarMascaraMoeda(input);
});

function salvarDadosStorage() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("obras", JSON.stringify(obras));
    localStorage.setItem("contratos", JSON.stringify(contratos));
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}


// ==============================
// NAVEGAÇÃO
// ==============================

const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

menuItems.forEach(item => {
    item.addEventListener("click", function(event) {
        event.preventDefault();
        menuItems.forEach(menu => menu.classList.remove("active"));
        this.classList.add("active");

        pages.forEach(page => page.classList.add("hidden"));

        const pageName = this.dataset.page;
        const selectedPage = document.getElementById("page-" + pageName);

        if (selectedPage) {
            selectedPage.classList.remove("hidden");
        }
    });
});


// ==============================
// CLIENTES
// ==============================

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let clienteEmEdicaoId = null;

const btnNovoCliente = document.getElementById("btnNovoCliente");
const modalCliente = document.getElementById("modalCliente");
const fecharModal = document.getElementById("fecharModal");
const cancelarCliente = document.getElementById("cancelarCliente");
const salvarCliente = document.getElementById("salvarCliente");
const tituloModalCliente = document.getElementById("tituloModalCliente");

if (btnNovoCliente) {
    btnNovoCliente.addEventListener("click", function() {
        clienteEmEdicaoId = null;
        if (tituloModalCliente) tituloModalCliente.textContent = "Novo Cliente";
        limparFormularioCliente();
        if (modalCliente) modalCliente.classList.remove("hidden");
    });
}

if (fecharModal) fecharModal.addEventListener("click", () => modalCliente.classList.add("hidden"));
if (cancelarCliente) cancelarCliente.addEventListener("click", () => modalCliente.classList.add("hidden"));

if (salvarCliente) {
    salvarCliente.addEventListener("click", function() {
        const nome = document.getElementById("nomeCliente").value.trim();
        const telefone = document.getElementById("telefoneCliente").value.trim();
        const documento = document.getElementById("documentoCliente").value.trim();
        const endereco = document.getElementById("enderecoCliente").value.trim();
        const observacoes = document.getElementById("observacoesCliente").value.trim();

        if (nome === "") {
            alert("Digite o nome do cliente.");
            return;
        }

        if (clienteEmEdicaoId !== null) {
            clientes = clientes.map(c => {
                if (c.id === clienteEmEdicaoId) {
                    return { ...c, nome, telefone, documento, endereco, observacoes };
                }
                return c;
            });
        } else {
            const novoCliente = { id: Date.now(), nome, telefone, documento, endereco, observacoes };
            clientes.push(novoCliente);
        }

        salvarDadosStorage();
        mostrarClientes();
        atualizarDashboard();
        if (modalCliente) modalCliente.classList.add("hidden");
        limparFormularioCliente();
    });
}

function mostrarClientes() {
    const tabela = document.getElementById("listaClientes");
    const totalContador = document.getElementById("totalClientes");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    clientes.forEach(cliente => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td><button class="cliente-link" onclick="abrirCliente(${cliente.id})" style="background:none; border:none; color:var(--primary-color, #2563eb); cursor:pointer; font-weight:600; padding:0;">${cliente.nome}</button></td>
            <td>${cliente.telefone || "-"}</td>
            <td>${cliente.documento || "-"}</td>
            <td>${cliente.endereco || "-"}</td>
            <td>
                <button class="secondary-button" onclick="editarCliente(${cliente.id})" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirCliente(${cliente.id})" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    clienteEmEdicaoId = cliente.id;
    if (tituloModalCliente) tituloModalCliente.textContent = "Editar Cliente";

    document.getElementById("nomeCliente").value = cliente.nome || "";
    document.getElementById("telefoneCliente").value = cliente.telefone || "";
    document.getElementById("documentoCliente").value = cliente.documento || "";
    document.getElementById("enderecoCliente").value = cliente.endereco || "";
    document.getElementById("observacoesCliente").value = cliente.observacoes || "";

    if (modalCliente) modalCliente.classList.remove("hidden");
}

function excluirCliente(id) {
    if (!confirm("Deseja realmente excluir este cliente?")) return;
    clientes = clientes.filter(c => c.id !== id);
    salvarDadosStorage();
    mostrarClientes();
    atualizarDashboard();
}

function limparFormularioCliente() {
    document.getElementById("nomeCliente").value = "";
    document.getElementById("telefoneCliente").value = "";
    document.getElementById("documentoCliente").value = "";
    document.getElementById("enderecoCliente").value = "";
    document.getElementById("observacoesCliente").value = "";
    clienteEmEdicaoId = null;
}

const voltarClientes = document.getElementById("voltarClientes");
if (voltarClientes) {
    voltarClientes.addEventListener("click", () => {
        document.getElementById("page-ficha-client")?.classList.add("hidden");
        document.getElementById("page-clientes")?.classList.remove("hidden");
    });
}


// ==============================
// GESTÃO DE OBRAS (MÚLTIPLOS ANEXOS E MODAL INTERNO)
// ==============================

let obras = JSON.parse(localStorage.getItem("obras")) || [];
let obraEmEdicaoId = null;
let obraVisualizandoId = null;

const btnNovaObra = document.getElementById("btnNovaObra");
const modalObra = document.getElementById("modalObra");
const fecharModalObra = document.getElementById("fecharModalObra");
const cancelarObra = document.getElementById("cancelarObra");
const salvarObra = document.getElementById("salvarObra");
const tituloModalObra = document.getElementById("tituloModalObra");

// Elementos do Modal de Anexos de Obras
const modalAnexosObra = document.getElementById("modalAnexosObra");
const fecharModalAnexosObra = document.getElementById("fecharModalAnexosObra");
const fecharAnexosObraBtn = document.getElementById("fecharAnexosObraBtn");
const inputArquivoAnexoObra = document.getElementById("inputArquivoAnexoObra");
const listaAnexosObra = document.getElementById("listaAnexosObra");

if (btnNovaObra) {
    btnNovaObra.addEventListener("click", function() {
        obraEmEdicaoId = null;
        if (tituloModalObra) tituloModalObra.textContent = "Nova Obra";
        carregarClientesNoSelectObra();
        limparFormularioObra();
        if (modalObra) modalObra.classList.remove("hidden");
    });
}

if (fecharModalObra) fecharModalObra.addEventListener("click", () => modalObra.classList.add("hidden"));
if (cancelarObra) cancelarObra.addEventListener("click", () => modalObra.classList.add("hidden"));

if (fecharModalAnexosObra) fecharModalAnexosObra.addEventListener("click", () => modalAnexosObra.classList.add("hidden"));
if (fecharAnexosObraBtn) fecharAnexosObraBtn.addEventListener("click", () => modalAnexosObra.classList.add("hidden"));

function carregarClientesNoSelectObra() {
    const select = document.getElementById("clienteObra");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });
}

// Salvar Obra com múltiplos ficheiros
if (salvarObra) {
    salvarObra.addEventListener("click", function() {
        const nome = document.getElementById("nomeObra")?.value || "";
        const clienteId = document.getElementById("clienteObra")?.value || "";
        const endereco = document.getElementById("enderecoObra")?.value || "";
        const status = document.getElementById("statusObra")?.value || "Em andamento";
        const inputAnexo = document.getElementById("anexoObra");

        if (!nome) {
            alert("Insira o nome da obra.");
            return;
        }

        const finalizarSalvamento = (novosAnexos = []) => {
            if (obraEmEdicaoId !== null) {
                obras = obras.map(o => {
                    if (o.id === obraEmEdicaoId) {
                        return { 
                            ...o, 
                            nome, 
                            clienteId, 
                            endereco, 
                            status, 
                            anexos: [...(o.anexos || []), ...novosAnexos] 
                        };
                    }
                    return o;
                });
            } else {
                const novaObra = {
                    id: Date.now(),
                    nome,
                    clienteId,
                    endereco,
                    status,
                    anexos: novosAnexos
                };
                obras.push(novaObra);
            }

            salvarDadosStorage();
            mostrarObras();
            atualizarDashboard();
            if (modalObra) modalObra.classList.add("hidden");
            limparFormularioObra();
        };

        if (inputAnexo && inputAnexo.files && inputAnexo.files.length > 0) {
            let filesProcessados = 0;
            let listaAnexosLidos = [];
            const totalFiles = inputAnexo.files.length;

            Array.from(inputAnexo.files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    listaAnexosLidos[index] = {
                        nome: file.name,
                        url: e.target.result,
                        data: new Date().toLocaleDateString()
                    };
                    filesProcessados++;
                    if (filesProcessados === totalFiles) {
                        finalizarSalvamento(listaAnexosLidos);
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            finalizarSalvamento([]);
        }
    });
}

function mostrarObras() {
    const tabela = document.getElementById("listaObras");
    const totalContador = document.getElementById("totalObras");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${obras.length} obra${obras.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    obras.forEach(obra => {
        const cliente = clientes.find(c => c.id == obra.clienteId);
        
        // Compatibilidade com registos antigos que tinham apenas um anexo (`anexo`)
        if (obra.anexo && (!obra.anexos || obra.anexos.length === 0)) {
            obra.anexos = [{ nome: "Documento Anexado", url: obra.anexo, data: "-" }];
        }
        const qtdAnexos = obra.anexos ? obra.anexos.length : 0;

        let botaoAnexo = qtdAnexos > 0 
            ? `<button class="secondary-button" onclick="abrirModalAnexosObra(${obra.id})" style="margin-right: 4px; background-color: rgba(37, 99, 235, 0.1); color: #2563eb; border-color: rgba(37, 99, 235, 0.2);">Ver Anexos (${qtdAnexos})</button>` 
            : `<span style="color: #64748b; font-size: 12px; margin-right: 4px;">Sem anexos</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${obra.nome || "-"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra.status || "-"}</td>
            <td>
                ${botaoAnexo}
                <button class="secondary-button" onclick="editarObra(${obra.id})" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirObra(${obra.id})" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// Abre o modal de anexos da obra
function abrirModalAnexosObra(id) {
    obraVisualizandoId = id;
    const obra = obras.find(o => o.id === id);
    if (!obra || !obra.anexos || obra.anexos.length === 0) {
        alert("Esta obra não possui anexos.");
        return;
    }

    renderizarListaAnexosNoModalObra(obra.anexos);
    if (inputArquivoAnexoObra) inputArquivoAnexoObra.value = "";
    if (modalAnexosObra) modalAnexosObra.classList.remove("hidden");
}

// Renderiza a lista convertendo para Blob URL para carregar sem falhas
function renderizarListaAnexosNoModalObra(anexos) {
    if (!listaAnexosObra) return;

    listaAnexosObra.innerHTML = "";
    anexos.forEach((anexo, index) => {
        let urlParaAbrir = anexo.url;
        
        if (anexo.url && anexo.url.startsWith('data:')) {
            try {
                const arr = anexo.url.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                urlParaAbrir = URL.createObjectURL(blob);
            } catch (e) {
                console.error("Erro ao converter anexo da obra para Blob:", e);
            }
        }

        listaAnexosObra.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                <a href="${urlParaAbrir}" target="_blank" style="color: #2563eb; text-decoration: underline; font-size: 14px;">📄 ${anexo.nome || 'Arquivo ' + (index + 1)}</a>
                <button onclick="removerAnexoIndividualObra(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Excluir</button>
            </div>
        `;
    });
}

// Adicionar mais arquivos diretamente pelo modal de anexos da obra
if (inputArquivoAnexoObra) {
    inputArquivoAnexoObra.addEventListener("change", function() {
        if (!inputArquivoAnexoObra.files || inputArquivoAnexoObra.files.length === 0) return;

        const obra = obras.find(o => o.id === obraVisualizandoId);
        if (!obra) return;

        let filesProcessados = 0;
        let novosLidos = [];
        const total = inputArquivoAnexoObra.files.length;

        Array.from(inputArquivoAnexoObra.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                novosLidos[index] = {
                    nome: file.name,
                    url: e.target.result,
                    data: new Date().toLocaleDateString()
                };
                filesProcessados++;
                if (filesProcessados === total) {
                    if (!obra.anexos) obra.anexos = [];
                    obra.anexos.push(...novosLidos);
                    salvarDadosStorage();
                    mostrarObras();
                    renderizarListaAnexosNoModalObra(obra.anexos);
                    inputArquivoAnexoObra.value = "";
                }
            };
            reader.readAsDataURL(file);
        });
    });
}

function removerAnexoIndividualObra(indexAnexo) {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;
    
    const obra = obras.find(o => o.id === obraVisualizandoId);
    if (!obra || !obra.anexos) return;

    obra.anexos.splice(indexAnexo, 1);
    salvarDadosStorage();
    mostrarObras();

    if (obra.anexos.length === 0) {
        if (modalAnexosObra) modalAnexosObra.classList.add("hidden");
    } else {
        renderizarListaAnexosNoModalObra(obra.anexos);
    }
}

function editarObra(id) {
    const obra = obras.find(o => o.id === id);
    if (!obra) return;

    obraEmEdicaoId = obra.id;
    if (tituloModalObra) tituloModalObra.textContent = "Editar Obra";

    carregarClientesNoSelectObra();

    if (document.getElementById("nomeObra")) document.getElementById("nomeObra").value = obra.nome || "";
    if (document.getElementById("clienteObra")) document.getElementById("clienteObra").value = obra.clienteId || "";
    if (document.getElementById("enderecoObra")) document.getElementById("enderecoObra").value = obra.endereco || "";
    if (document.getElementById("statusObra")) document.getElementById("statusObra").value = obra.status || "";
    
    const inputAnexo = document.getElementById("anexoObra");
    if (inputAnexo) inputAnexo.value = "";

    if (modalObra) modalObra.classList.remove("hidden");
}

function excluirObra(id) {
    if (!confirm("Deseja realmente excluir esta obra?")) return;
    obras = obras.filter(o => o.id !== id);
    salvarDadosStorage();
    mostrarObras();
    atualizarDashboard();
}

function limparFormularioObra() {
    if (document.getElementById("nomeObra")) document.getElementById("nomeObra").value = "";
    if (document.getElementById("clienteObra")) document.getElementById("clienteObra").value = "";
    if (document.getElementById("enderecoObra")) document.getElementById("enderecoObra").value = "";
    if (document.getElementById("statusObra")) document.getElementById("statusObra").value = "Em andamento";
    const inputAnexo = document.getElementById("anexoObra");
    if (inputAnexo) inputAnexo.value = "";
    obraEmEdicaoId = null;
}


// ==============================
// GESTÃO DE CONTRATOS (COM O SEU MODAL DE ANEXOS)
// ==============================

let contratos = JSON.parse(localStorage.getItem("contratos")) || [];
let contratoEmEdicaoId = null;
let contratoVisualizandoId = null;

const btnNovoContrato = document.getElementById("btnNovoContrato");
const modalContrato = document.getElementById("modalContrato");
const fecharModalContrato = document.getElementById("fecharModalContrato");
const cancelarContrato = document.getElementById("cancelarContrato");
const salvarContrato = document.getElementById("salvarContrato");
const tituloModalContrato = document.getElementById("tituloModalContrato");

// Elementos ligados diretamente ao seu HTML de Anexos
const modalAnexos = document.getElementById("modalAnexos");
const fecharModalAnexos = document.getElementById("fecharModalAnexos");
const fecharAnexosBtn = document.getElementById("fecharAnexosBtn");
const inputArquivoAnexo = document.getElementById("inputArquivoAnexo");
const listaAnexosContrato = document.getElementById("listaAnexosContrato");

if (btnNovoContrato) {
    btnNovoContrato.addEventListener("click", function() {
        contratoEmEdicaoId = null;
        if (tituloModalContrato) tituloModalContrato.textContent = "Novo Contrato";
        carregarClientesNoSelectContrato();
        carregarObrasNoSelectContrato();
        limparFormularioContrato();
        if (modalContrato) modalContrato.classList.remove("hidden");
    });
}

if (fecharModalContrato) fecharModalContrato.addEventListener("click", () => modalContrato.classList.add("hidden"));
if (cancelarContrato) cancelarContrato.addEventListener("click", () => modalContrato.classList.add("hidden"));

// Fechar o modal de anexos usando os botões do seu HTML
if (fecharModalAnexos) fecharModalAnexos.addEventListener("click", () => modalAnexos.classList.add("hidden"));
if (fecharAnexosBtn) fecharAnexosBtn.addEventListener("click", () => modalAnexos.classList.add("hidden"));

function carregarClientesNoSelectContrato() {
    const select = document.getElementById("clienteContrato");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });
}

function carregarObrasNoSelectContrato() {
    const select = document.getElementById("obraContrato");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione a obra</option>';
    obras.forEach(o => {
        select.innerHTML += `<option value="${o.id}">${o.nome}</option>`;
    });
}

// Salvar Contrato recolhendo múltiplos ficheiros
if (salvarContrato) {
    salvarContrato.addEventListener("click", function() {
        const clienteId = document.getElementById("clienteContrato")?.value || "";
        const obraId = document.getElementById("obraContrato")?.value || "";
        const valor = document.getElementById("valorContrato")?.value || "";
        const data = document.getElementById("dataContrato")?.value || "";
        const descricao = document.getElementById("descricaoContrato")?.value || "";
        const inputAnexo = document.getElementById("anexoContrato");

        if (!valor) {
            alert("Insira o valor do contrato.");
            return;
        }

        const finalizarSalvamento = (novosAnexos = []) => {
            if (contratoEmEdicaoId !== null) {
                contratos = contratos.map(c => {
                    if (c.id === contratoEmEdicaoId) {
                        return { 
                            ...c, 
                            clienteId, 
                            obraId, 
                            valor, 
                            data, 
                            descricao, 
                            anexos: [...(c.anexos || []), ...novosAnexos] 
                        };
                    }
                    return c;
                });
            } else {
                const novoContrato = {
                    id: Date.now(),
                    clienteId,
                    obraId,
                    valor,
                    data,
                    descricao,
                    anexos: novosAnexos
                };
                contratos.push(novoContrato);
            }

            salvarDadosStorage();
            mostrarContratos();
            atualizarDashboard();
            if (modalContrato) modalContrato.classList.add("hidden");
            limparFormularioContrato();
        };

        if (inputAnexo && inputAnexo.files && inputAnexo.files.length > 0) {
            let filesProcessados = 0;
            let listaAnexosLidos = [];
            const totalFiles = inputAnexo.files.length;

            Array.from(inputAnexo.files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    listaAnexosLidos[index] = {
                        nome: file.name,
                        url: e.target.result,
                        data: new Date().toLocaleDateString()
                    };
                    filesProcessados++;
                    if (filesProcessados === totalFiles) {
                        finalizarSalvamento(listaAnexosLidos);
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            finalizarSalvamento([]);
        }
    });
}

function mostrarContratos() {
    const tabela = document.getElementById("listaContratos");
    const totalContador = document.getElementById("totalContratos");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${contratos.length} contrato${contratos.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    contratos.forEach(contrato => {
        const obra = obras.find(o => o.id == contrato.obraId);
        const cliente = clientes.find(c => c.id == contrato.clienteId);
        
        if (contrato.anexo && (!contrato.anexos || contrato.anexos.length === 0)) {
            contrato.anexos = [{ nome: "Documento Anexado", url: contrato.anexo, data: "-" }];
        }
        const qtdAnexos = contrato.anexos ? contrato.anexos.length : 0;

        let botaoAnexo = qtdAnexos > 0 
            ? `<button class="secondary-button" onclick="abrirModalAnexos(${contrato.id})" style="margin-right: 4px; background-color: rgba(37, 99, 235, 0.1); color: #2563eb; border-color: rgba(37, 99, 235, 0.2);">Ver Anexos (${qtdAnexos})</button>` 
            : `<span style="color: #64748b; font-size: 12px; margin-right: 4px;">Sem anexos</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>Contrato #${contrato.id.toString().slice(-4)}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra ? obra.nome : "-"}</td>
            <td>${contrato.valor || "-"}</td>
            <td>${contrato.data || "-"}</td>
            <td>
                ${botaoAnexo}
                <button class="secondary-button" onclick="editarContrato(${contrato.id})" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirContrato(${contrato.id})" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// Abre o seu modal existente e preenche a lista
function abrirModalAnexos(id) {
    contratoVisualizandoId = id;
    const contrato = contratos.find(c => c.id === id);
    if (!contrato || !contrato.anexos || contrato.anexos.length === 0) {
        alert("Este contrato não possui anexos.");
        return;
    }

    renderizarListaAnexosNoModal(contrato.anexos);
    if (inputArquivoAnexo) inputArquivoAnexo.value = "";
    if (modalAnexos) modalAnexos.classList.remove("hidden");
}

function renderizarListaAnexosNoModal(anexos) {
    if (!listaAnexosContrato) return;

    listaAnexosContrato.innerHTML = "";
    anexos.forEach((anexo, index) => {
        // Cria um Blob URL seguro para o navegador conseguir abrir imagens e PDFs sem bloqueios
        let urlParaAbrir = anexo.url;
        
        if (anexo.url && anexo.url.startsWith('data:')) {
            try {
                const arr = anexo.url.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                urlParaAbrir = URL.createObjectURL(blob);
            } catch (e) {
                console.error("Erro ao converter anexo para Blob:", e);
            }
        }

        listaAnexosContrato.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                <a href="${urlParaAbrir}" target="_blank" style="color: #2563eb; text-decoration: underline; font-size: 14px;">📄 ${anexo.nome || 'Arquivo ' + (index + 1)}</a>
                <button onclick="removerAnexoIndividual(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Excluir</button>
            </div>
        `;
    });
}

// Se adicionar arquivos direto pelo input do modal de anexos
if (inputArquivoAnexo) {
    inputArquivoAnexo.addEventListener("change", function() {
        if (!inputArquivoAnexo.files || inputArquivoAnexo.files.length === 0) return;

        const contrato = contratos.find(c => c.id === contratoVisualizandoId);
        if (!contrato) return;

        let filesProcessados = 0;
        let novosLidos = [];
        const total = inputArquivoAnexo.files.length;

        Array.from(inputArquivoAnexo.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                novosLidos[index] = {
                    nome: file.name,
                    url: e.target.result,
                    data: new Date().toLocaleDateString()
                };
                filesProcessados++;
                if (filesProcessados === total) {
                    if (!contrato.anexos) contrato.anexos = [];
                    contrato.anexos.push(...novosLidos);
                    salvarDadosStorage();
                    mostrarContratos();
                    renderizarListaAnexosNoModal(contrato.anexos);
                    inputArquivoAnexo.value = "";
                }
            };
            reader.readAsDataURL(file);
        });
    });
}

function removerAnexoIndividual(indexAnexo) {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;
    
    const contrato = contratos.find(c => c.id === contratoVisualizandoId);
    if (!contrato || !contrato.anexos) return;

    contrato.anexos.splice(indexAnexo, 1);
    salvarDadosStorage();
    mostrarContratos();

    if (contrato.anexos.length === 0) {
        if (modalAnexos) modalAnexos.classList.add("hidden");
    } else {
        renderizarListaAnexosNoModal(contrato.anexos);
    }
}

function editarContrato(id) {
    const contrato = contratos.find(c => c.id === id);
    if (!contrato) return;

    contratoEmEdicaoId = contrato.id;
    if (tituloModalContrato) tituloModalContrato.textContent = "Editar Contrato";

    carregarClientesNoSelectContrato();
    carregarObrasNoSelectContrato();

    if (document.getElementById("clienteContrato")) document.getElementById("clienteContrato").value = contrato.clienteId || "";
    if (document.getElementById("obraContrato")) document.getElementById("obraContrato").value = contrato.obraId || "";
    if (document.getElementById("valorContrato")) document.getElementById("valorContrato").value = contrato.valor || "";
    if (document.getElementById("dataContrato")) document.getElementById("dataContrato").value = contrato.data || "";
    if (document.getElementById("descricaoContrato")) document.getElementById("descricaoContrato").value = contrato.descricao || "";
    
    const inputAnexo = document.getElementById("anexoContrato");
    if (inputAnexo) inputAnexo.value = "";

    if (modalContrato) modalContrato.classList.remove("hidden");
}

function excluirContrato(id) {
    if (!confirm("Deseja realmente excluir este contrato?")) return;
    contratos = contratos.filter(c => c.id !== id);
    salvarDadosStorage();
    mostrarContratos();
    atualizarDashboard();
}

function limparFormularioContrato() {
    if (document.getElementById("clienteContrato")) document.getElementById("clienteContrato").value = "";
    if (document.getElementById("obraContrato")) document.getElementById("obraContrato").value = "";
    if (document.getElementById("valorContrato")) document.getElementById("valorContrato").value = "";
    if (document.getElementById("dataContrato")) document.getElementById("dataContrato").value = "";
    if (document.getElementById("descricaoContrato")) document.getElementById("descricaoContrato").value = "";
    const inputAnexo = document.getElementById("anexoContrato");
    if (inputAnexo) inputAnexo.value = "";
    contratoEmEdicaoId = null;
}


// ==============================
// FINANCEIRO
// ==============================

let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

const btnNovoLancamento = document.getElementById("btnNovoLancamento");
const modalLancamento = document.getElementById("modalLancamento");
const fecharModalLancamento = document.getElementById("fecharModalLancamento");
const cancelarLancamento = document.getElementById("cancelarLancamento");
const salvarLancamento = document.getElementById("salvarLancamento");

if (btnNovoLancamento) {
    btnNovoLancamento.addEventListener("click", function() {
        carregarObrasNoFinanceiro();
        limparFormularioLancamento();
        modalLancamento.classList.remove("hidden");
    });
}

if (fecharModalLancamento) fecharModalLancamento.addEventListener("click", () => modalLancamento.classList.add("hidden"));
if (cancelarLancamento) cancelarLancamento.addEventListener("click", () => modalLancamento.classList.add("hidden"));

function carregarObrasNoFinanceiro() {
    const select = document.getElementById("obraLancamento");
    if (!select) return;
    select.innerHTML = '<option value="geral">🏢 Geral / Caixa</option>';
    obras.forEach(o => {
        select.innerHTML += `<option value="${o.id}">🏗️ ${o.nome}</option>`;
    });
}

if (salvarLancamento) {
    salvarLancamento.addEventListener("click", function() {
        const descricao = document.getElementById("descricaoLancamento").value.trim();
        const tipo = document.getElementById("tipoLancamento").value;
        const data = document.getElementById("dataLancamento").value;
        const obraId = document.getElementById("obraLancamento").value;
        const valorTexto = document.getElementById("valorLancamento").value;

        if (!descricao) { alert("Digite a descrição do lançamento."); return; }

        const lancamento = {
            id: Date.now(),
            descricao: descricao,
            tipo: tipo,
            data: data,
            obraId: obraId,
            valor: converterMoedaParaNumero(valorTexto)
        };

        lancamentos.push(lancamento);
        salvarDadosStorage();
        modalLancamento.classList.add("hidden");
        limparFormularioLancamento();
        mostrarLancamentos();
        atualizarDashboard();
    });
}

function limparFormularioLancamento() {
    document.getElementById("descricaoLancamento").value = "";
    document.getElementById("dataLancamento").value = "";
    document.getElementById("valorLancamento").value = "";
}

function mostrarLancamentos() {
    const tabela = document.getElementById("listaLancamentos");
    const totalContador = document.getElementById("totalLancamentos");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${lancamentos.length} lançamento${lancamentos.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    
    let totalRec = 0;
    let totalDesp = 0;

    lancamentos.forEach(l => {
        const val = Number(l.valor || 0);
        if (l.tipo === "receita") totalRec += val;
        else totalDesp += val;

        const obra = obras.find(o => o.id == l.obraId);
        const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${l.descricao}</td>
            <td>${l.tipo === "receita" ? "🟢 Receita" : "🔴 Despesa"}</td>
            <td>${obra ? obra.nome : "Geral"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${l.data || "-"}</td>
            <td><button class="secondary-button" onclick="excluirLancamento(${l.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });

    const elTotRec = document.getElementById("totalReceitas");
    const elTotDesp = document.getElementById("totalDespesas");
    const elSaldoFin = document.getElementById("saldoFinanceiro");

    if (elTotRec) elTotRec.textContent = totalRec.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elTotDesp) elTotDesp.textContent = totalDesp.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elSaldoFin) elSaldoFin.textContent = (totalRec - totalDesp).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function excluirLancamento(id) {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    lancamentos = lancamentos.filter(l => l.id !== id);
    salvarDadosStorage();
    mostrarLancamentos();
    atualizarDashboard();
}


// ==============================
// DASHBOARD
// ==============================

function atualizarDashboard() {
    const elTotalClientes = document.getElementById("dashTotalClientes");
    if (elTotalClientes) elTotalClientes.textContent = clientes.length;

    const elObrasAtivas = document.getElementById("dashObrasAtivas");
    if (elObrasAtivas) elObrasAtivas.textContent = obras.length;

    let totalReceitas = 0;
    let totalDespesas = 0;

    lancamentos.forEach(l => {
        const valor = Number(l.valor || 0);
        if (l.tipo === "receita") totalReceitas += valor;
        if (l.tipo === "despesa") totalDespesas += valor;
    });

    const elReceitas = document.getElementById("dashTotalReceitas");
    const elDespesas = document.getElementById("dashTotalDespesas");
    const elSaldoGeral = document.getElementById("dashSaldoGeral");

    if (elReceitas) elReceitas.textContent = totalReceitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elDespesas) elDespesas.textContent = totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elSaldoGeral) elSaldoGeral.textContent = (totalReceitas - totalDespesas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const listaObrasRecentes = document.getElementById("dashListaObrasRecentes");
    if (listaObrasRecentes) {
        if (obras.length === 0) {
            listaObrasRecentes.innerHTML = `<p style="color: #94a3b8;">Nenhuma obra cadastrada até o momento.</p>`;
        } else {
            listaObrasRecentes.innerHTML = obras.slice(-5).reverse().map(obra => {
                const cliente = clientes.find(c => c.id === obra.clienteId);
                return `
                    <div style="background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                        <div>
                            <strong>${obra.nome}</strong>
                            <div style="font-size: 13px; color: #94a3b8;">Cliente: ${cliente ? cliente.nome : 'Não vinculado'}</div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-weight: 600; color: #34d399;">${Number(obra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}


// ==============================
// INICIALIZAÇÃO GERAL
// ==============================

verificarAutenticacao();
mostrarClientes();
mostrarObras();
mostrarContratos();
mostrarLancamentos();
atualizarDashboard();


// ==============================
// FILTROS DE PESQUISA
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    const pesquisaCliente = document.getElementById("pesquisaCliente");
    if (pesquisaCliente) {
        pesquisaCliente.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = clientes.filter(c => 
                c.nome.toLowerCase().includes(termo) || 
                (c.telefone && c.telefone.toLowerCase().includes(termo)) || 
                (c.documento && c.documento.toLowerCase().includes(termo))
            );
            renderizarTabelaClientesFiltrados(filtrados);
        });
    }

    const pesquisaObra = document.getElementById("pesquisaObra");
    if (pesquisaObra) {
        pesquisaObra.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = obras.filter(o => 
                o.nome.toLowerCase().includes(termo) || 
                (o.endereco && o.endereco.toLowerCase().includes(termo))
            );
            renderizarTabelaObrasFiltradas(filtrados);
        });
    }

    const pesquisaContrato = document.getElementById("pesquisaContrato");
    if (pesquisaContrato) {
        pesquisaContrato.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = contratos.filter(c => {
                const cli = clientes.find(cl => cl.id == c.clienteId);
                return cli && cli.nome.toLowerCase().includes(termo);
            });
            renderizarTabelaContratosFiltrados(filtrados);
        });
    }

    const pesquisaLancamento = document.getElementById("pesquisaLancamento");
    if (pesquisaLancamento) {
        pesquisaLancamento.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = lancamentos.filter(l => 
                l.descricao.toLowerCase().includes(termo) || l.tipo.toLowerCase().includes(termo)
            );
            renderizarTabelaLancamentosFiltrados(filtrados);
        });
    }
});

function renderizarTabelaClientesFiltrados(lista) {
    const tabela = document.getElementById("listaClientes");
    if (!tabela) return;
    tabela.innerHTML = "";
    lista.forEach(cliente => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td><button class="cliente-link" onclick="abrirCliente(${cliente.id})" style="background:none; border:none; color:#2563eb; cursor:pointer; font-weight:600; padding:0;">${cliente.nome}</button></td>
            <td>${cliente.telefone || "-"}</td>
            <td>${cliente.documento || "-"}</td>
            <td>${cliente.endereco || "-"}</td>
            <td><button class="secondary-button" onclick="excluirCliente(${cliente.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function renderizarTabelaObrasFiltradas(lista) {
    const tabela = document.getElementById("listaObras");
    if (!tabela) return;
    tabela.innerHTML = "";
    lista.forEach(obra => {
        const cliente = clientes.find(c => c.id == obra.clienteId);
        
        if (obra.anexo && (!obra.anexos || obra.anexos.length === 0)) {
            obra.anexos = [{ nome: "Documento Anexado", url: obra.anexo, data: "-" }];
        }
        const qtdAnexos = obra.anexos ? obra.anexos.length : 0;

        let botaoAnexo = qtdAnexos > 0 
            ? `<button class="secondary-button" onclick="abrirModalAnexosObra(${obra.id})" style="margin-right: 4px; background-color: rgba(37, 99, 235, 0.1); color: #2563eb; border-color: rgba(37, 99, 235, 0.2);">Ver Anexos (${qtdAnexos})</button>` 
            : `<span style="color: #64748b; font-size: 12px; margin-right: 4px;">Sem anexos</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${obra.nome || "-"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra.status || "-"}</td>
            <td>
                ${botaoAnexo}
                <button class="secondary-button" onclick="editarObra(${obra.id})" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirObra(${obra.id})" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function renderizarTabelaContratosFiltrados(lista) {
    const tabela = document.getElementById("listaContratos");
    if (!tabela) return;
    tabela.innerHTML = "";
    lista.forEach(contrato => {
        const obra = obras.find(o => o.id == contrato.obraId);
        const cliente = clientes.find(c => c.id == contrato.clienteId);
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>Contrato #${contrato.id.toString().slice(-4)}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra ? obra.nome : "-"}</td>
            <td>${contrato.valor || "-"}</td>
            <td>${contrato.data || "-"}</td>
            <td><button class="secondary-button" onclick="excluirContrato(${contrato.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function renderizarTabelaLancamentosFiltrados(lista) {
    const tabela = document.getElementById("listaLancamentos");
    if (!tabela) return;
    tabela.innerHTML = "";
    lista.forEach(l => {
        const val = Number(l.valor || 0);
        const obra = obras.find(o => o.id == l.obraId);
        const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${l.descricao}</td>
            <td>${l.tipo === "receita" ? "🟢 Receita" : "🔴 Despesa"}</td>
            <td>${obra ? obra.nome : "Geral"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${l.data || "-"}</td>
            <td><button class="secondary-button" onclick="excluirLancamento(${l.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

// ==========================================
// FICHA DO CLIENTE
// ==========================================
function abrirCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    pages.forEach(p => p.classList.add("hidden"));
    document.getElementById("page-ficha-cliente").classList.remove("hidden");

    document.getElementById("fichaNomeCliente").textContent = cliente.nome;
    document.getElementById("fichaTelefone").textContent = cliente.telefone || "-";
    document.getElementById("fichaDocumento").textContent = cliente.documento || "-";
    document.getElementById("fichaEndereco").textContent = cliente.endereco || "-";
    document.getElementById("fichaObservacoes").textContent = cliente.observacoes || "Nenhuma observação.";

    const divObrasCliente = document.getElementById("obrasDoCliente");
    const obrasDoCli = obras.filter(o => Number(o.clienteId) === Number(id));
    if (divObrasCliente) {
        if (obrasDoCli.length === 0) {
            divObrasCliente.innerHTML = `<p>Nenhuma obra cadastrada para este cliente.</p>`;
        } else {
            divObrasCliente.innerHTML = obrasDoCli.map(o => `
                <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    🏗️ <strong>${o.nome}</strong> - Status: ${o.status} <br>
                    <small style="color: #94a3b8;">Valor: ${Number(o.valor || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</small>
                </div>
            `).join('');
        }
    }

    const divContratosCliente = document.getElementById("contratosDoCliente");
    const contratosDoCli = contratos.filter(c => Number(c.clienteId) === Number(id));
    
    if (divContratosCliente) {
        if (contratosDoCli.length === 0) {
            divContratosCliente.innerHTML = `<p>Nenhum contrato cadastrado para este cliente.</p>`;
        } else {
            divContratosCliente.innerHTML = contratosDoCli.map(c => {
                const obraContrato = obras.find(o => o.id == c.obraId);
                return `
                    <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                        📄 Contrato (${obraContrato ? obraContrato.nome : 'Obra Geral'})<br>
                        <small style="color: #94a3b8;">Valor: ${c.valor || "R$ 0,00"}</small>
                    </div>
                `;
            }).join('');
        }
    }
}

// ==============================
// MÁSCARAS DE INPUT
// ==============================

function aplicarMascarasCliente() {
    const inputTelefone = document.getElementById("telefoneCliente");
    const inputDocumento = document.getElementById("documentoCliente");

    if (inputTelefone) {
        inputTelefone.addEventListener("input", function (e) {
            let valor = e.target.value.replace(/\D/g, "");
            if (valor.length > 11) valor = valor.slice(0, 11);

            if (valor.length > 6) {
                valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
            } else if (valor.length > 2) {
                valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
            } else if (valor.length > 0) {
                valor = valor.replace(/^(\d{0,2})/, "($1");
            }
            e.target.value = valor;
        });
    }

    if (inputDocumento) {
        inputDocumento.addEventListener("input", function (e) {
            let valor = e.target.value.replace(/\D/g, "");

            if (valor.length <= 11) {
                if (valor.length > 9) {
                    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
                } else if (valor.length > 6) {
                    valor = valor.replace(/^(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
                } else if (valor.length > 3) {
                    valor = valor.replace(/^(\d{3})(\d{0,3})/, "$1.$2");
                }
            } else {
                if (valor.length > 14) valor = valor.slice(0, 14);
                valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
            }

            e.target.value = valor;
        });
    }
}

aplicarMascarasCliente();
