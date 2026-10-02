// ==============================
// CONFIGURAÇÃO DO FIREBASE
// ==============================
const firebaseConfig = {
    apiKey: "AIzaSyAUJ1NViUIgmGl8qKf8gsbtlw72R0okOrg",
    authDomain: "gestorobra-c4a92.firebaseapp.com",
    projectId: "gestorobra-c4a92",
    storageBucket: "gestorobra-c4a92.firebasestorage.app",
    messagingSenderId: "369876379222",
    appId: "1:369876379222:web:af5dcde7dc3be9e881fdf7",
    measurementId: "G-1F69BSSMF9"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
        redirecionarParaDashboard();
    } else {
        if (telaLogin) telaLogin.classList.remove("hidden");
        if (appContainer) appContainer.style.display = "none";
    }
}

function redirecionarParaDashboard() {
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(menu => menu.classList.remove("active"));
    
    const menuDash = document.querySelector('.menu-item[data-page="dashboard"]');
    if (menuDash) menuDash.classList.add("active");

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
// VARIÁVEIS GLOBAIS DE DADOS
// ==============================
let clientes = [];
let obras = [];
let contratos = [];
let lancamentos = [];

let clienteEmEdicaoId = null;
let obraEmEdicaoId = null;
let obraVisualizandoId = null;
let contratoEmEdicaoId = null;
let contratoVisualizandoId = null;

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

document.querySelectorAll(".input-moeda").forEach(input => {
    aplicarMascaraMoeda(input);
});

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
// CLIENTES (SINCRONIZAÇÃO EM TEMPO REAL)
// ==============================

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
    salvarCliente.addEventListener("click", async function() {
        const nome = document.getElementById("nomeCliente").value.trim();
        const telefone = document.getElementById("telefoneCliente").value.trim();
        const documento = document.getElementById("documentoCliente").value.trim();
        const endereco = document.getElementById("enderecoCliente").value.trim();
        const observacoes = document.getElementById("observacoesCliente").value.trim();

        if (nome === "") {
            alert("Digite o nome do cliente.");
            return;
        }

        try {
            if (clienteEmEdicaoId !== null) {
                await db.collection("clientes").doc(String(clienteEmEdicaoId)).update({
                    nome, telefone, documento, endereco, observacoes
                });
            } else {
                const novoId = String(Date.now());
                await db.collection("clientes").doc(novoId).set({
                    id: novoId,
                    nome, telefone, documento, endereco, observacoes
                });
            }

            if (modalCliente) modalCliente.classList.add("hidden");
            limparFormularioCliente();
        } catch (error) {
            console.error("Erro ao salvar cliente no Firebase:", error);
            alert("Erro ao salvar cliente.");
        }
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
            <td><button class="cliente-link" onclick="abrirCliente('${cliente.id}')" style="background:none; border:none; color:var(--primary-color, #2563eb); cursor:pointer; font-weight:600; padding:0;">${cliente.nome}</button></td>
            <td>${cliente.telefone || "-"}</td>
            <td>${cliente.documento || "-"}</td>
            <td>${cliente.endereco || "-"}</td>
            <td>
                <button class="secondary-button" onclick="editarCliente('${cliente.id}')" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirCliente('${cliente.id}')" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function editarCliente(id) {
    const cliente = clientes.find(c => String(c.id) === String(id));
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

async function excluirCliente(id) {
    if (!confirm("Deseja realmente excluir este cliente?")) return;
    try {
        await db.collection("clientes").doc(String(id)).delete();
    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
    }
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
        document.getElementById("page-ficha-cliente")?.classList.add("hidden");
        document.getElementById("page-clientes")?.classList.remove("hidden");
    });
}


// ==============================
// OBRAS
// ==============================

const btnNovaObra = document.getElementById("btnNovaObra");
const modalObra = document.getElementById("modalObra");
const fecharModalObra = document.getElementById("fecharModalObra");
const cancelarObra = document.getElementById("cancelarObra");
const salvarObra = document.getElementById("salvarObra");
const tituloModalObra = document.getElementById("tituloModalObra");

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

if (salvarObra) {
    salvarObra.addEventListener("click", function() {
        const nome = document.getElementById("nomeObra")?.value || "";
        const clienteId = document.getElementById("clienteObra")?.value || "";
        const endereco = document.getElementById("enderecoObra")?.value || "";
        const status = document.getElementById("statusObra")?.value || "Em andamento";
        const valor = converterMoedaParaNumero(document.getElementById("valorObra")?.value || 0);
        const inputAnexo = document.getElementById("anexoObra");

        if (!nome) {
            alert("Insira o nome da obra.");
            return;
        }

        const finalizarSalvamento = async (novosAnexos = []) => {
            try {
                if (obraEmEdicaoId !== null) {
                    const obraAntiga = obras.find(o => String(o.id) === String(obraEmEdicaoId));
                    const anexosFinais = [...(obraAntiga?.anexos || []), ...novosAnexos];
                    
                    await db.collection("obras").doc(String(obraEmEdicaoId)).update({
                        nome, clienteId, endereco, status, valor, anexos: anexosFinais
                    });
                } else {
                    const novoId = String(Date.now());
                    await db.collection("obras").doc(novoId).set({
                        id: novoId,
                        nome, clienteId, endereco, status, valor,
                        anexos: novosAnexos
                    });
                }

                if (modalObra) modalObra.classList.add("hidden");
                limparFormularioObra();
            } catch (err) {
                console.error("Erro ao salvar obra:", err);
            }
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
        const cliente = clientes.find(c => String(c.id) === String(obra.clienteId));
        const qtdAnexos = obra.anexos ? obra.anexos.length : 0;

        let botaoAnexo = qtdAnexos > 0 
            ? `<button class="secondary-button" onclick="abrirModalAnexosObra('${obra.id}')" style="margin-right: 4px; background-color: rgba(37, 99, 235, 0.1); color: #2563eb; border-color: rgba(37, 99, 235, 0.2);">Ver Anexos (${qtdAnexos})</button>` 
            : `<span style="color: #64748b; font-size: 12px; margin-right: 4px;">Sem anexos</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${obra.nome || "-"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra.status || "-"}</td>
            <td>
                ${botaoAnexo}
                <button class="secondary-button" onclick="editarObra('${obra.id}')" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirObra('${obra.id}')" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function abrirModalAnexosObra(id) {
    obraVisualizandoId = id;
    const obra = obras.find(o => String(o.id) === String(id));
    if (!obra || !obra.anexos || obra.anexos.length === 0) {
        alert("Esta obra não possui anexos.");
        return;
    }
    renderizarListaAnexosNoModalObra(obra.anexos);
    if (modalAnexosObra) modalAnexosObra.classList.remove("hidden");
}

function renderizarListaAnexosNoModalObra(anexos) {
    if (!listaAnexosObra) return;
    listaAnexosObra.innerHTML = "";
    anexos.forEach((anexo, index) => {
        listaAnexosObra.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                <a href="${anexo.url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-size: 14px;">📄 ${anexo.nome || 'Arquivo'}</a>
                <button onclick="removerAnexoIndividualObra(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Excluir</button>
            </div>
        `;
    });
}

async function removerAnexoIndividualObra(indexAnexo) {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;
    const obra = obras.find(o => String(o.id) === String(obraVisualizandoId));
    if (!obra || !obra.anexos) return;

    obra.anexos.splice(indexAnexo, 1);
    await db.collection("obras").doc(String(obra.id)).update({ anexos: obra.anexos });
    mostrarObras();
    if (obra.anexos.length === 0) modalAnexosObra.classList.add("hidden");
    else renderizarListaAnexosNoModalObra(obra.anexos);
}

function editarObra(id) {
    const obra = obras.find(o => String(o.id) === String(id));
    if (!obra) return;

    obraEmEdicaoId = obra.id;
    if (tituloModalObra) tituloModalObra.textContent = "Editar Obra";

    carregarClientesNoSelectObra();

    if (document.getElementById("nomeObra")) document.getElementById("nomeObra").value = obra.nome || "";
    if (document.getElementById("clienteObra")) document.getElementById("clienteObra").value = obra.clienteId || "";
    if (document.getElementById("enderecoObra")) document.getElementById("enderecoObra").value = obra.endereco || "";
    if (document.getElementById("statusObra")) document.getElementById("statusObra").value = obra.status || "";
    if (document.getElementById("valorObra")) document.getElementById("valorObra").value = obra.valor || "";

    if (modalObra) modalObra.classList.remove("hidden");
}

async function excluirObra(id) {
    if (!confirm("Deseja realmente excluir esta obra?")) return;
    await db.collection("obras").doc(String(id)).delete();
}

function limparFormularioObra() {
    if (document.getElementById("nomeObra")) document.getElementById("nomeObra").value = "";
    if (document.getElementById("clienteObra")) document.getElementById("clienteObra").value = "";
    if (document.getElementById("enderecoObra")) document.getElementById("enderecoObra").value = "";
    if (document.getElementById("valorObra")) document.getElementById("valorObra").value = "";
    obraEmEdicaoId = null;
}


// ==============================
// CONTRATOS
// ==============================

const btnNovoContrato = document.getElementById("btnNovoContrato");
const modalContrato = document.getElementById("modalContrato");
const fecharModalContrato = document.getElementById("fecharModalContrato");
const cancelarContrato = document.getElementById("cancelarContrato");
const salvarContrato = document.getElementById("salvarContrato");
const tituloModalContrato = document.getElementById("tituloModalContrato");

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

        const finalizarSalvamento = async (novosAnexos = []) => {
            try {
                if (contratoEmEdicaoId !== null) {
                    const contratoAntigo = contratos.find(c => String(c.id) === String(contratoEmEdicaoId));
                    const anexosFinais = [...(contratoAntigo?.anexos || []), ...novosAnexos];

                    await db.collection("contratos").doc(String(contratoEmEdicaoId)).update({
                        clienteId, obraId, valor, data, descricao, anexos: anexosFinais
                    });
                } else {
                    const novoId = String(Date.now());
                    await db.collection("contratos").doc(novoId).set({
                        id: novoId,
                        clienteId, obraId, valor, data, descricao,
                        anexos: novosAnexos
                    });
                }

                if (modalContrato) modalContrato.classList.add("hidden");
                limparFormularioContrato();
            } catch (err) {
                console.error("Erro ao salvar contrato:", err);
            }
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
        const obra = obras.find(o => String(o.id) === String(contrato.obraId));
        const cliente = clientes.find(c => String(c.id) === String(contrato.clienteId));
        const qtdAnexos = contrato.anexos ? contrato.anexos.length : 0;

        let botaoAnexo = qtdAnexos > 0 
            ? `<button class="secondary-button" onclick="abrirModalAnexos('${contrato.id}')" style="margin-right: 4px; background-color: rgba(37, 99, 235, 0.1); color: #2563eb; border-color: rgba(37, 99, 235, 0.2);">Ver Anexos (${qtdAnexos})</button>` 
            : `<span style="color: #64748b; font-size: 12px; margin-right: 4px;">Sem anexos</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>Contrato #${String(contrato.id).slice(-4)}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra ? obra.nome : "-"}</td>
            <td>${contrato.valor || "-"}</td>
            <td>
                ${botaoAnexo}
                <button class="secondary-button" onclick="editarContrato('${contrato.id}')" style="margin-right: 4px;">Editar</button>
                <button class="secondary-button" onclick="excluirContrato('${contrato.id}')" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function abrirModalAnexos(id) {
    contratoVisualizandoId = id;
    const contrato = contratos.find(c => String(c.id) === String(id));
    if (!contrato || !contrato.anexos || contrato.anexos.length === 0) {
        alert("Este contrato não possui anexos.");
        return;
    }
    renderizarListaAnexosNoModal(contrato.anexos);
    if (modalAnexos) modalAnexos.classList.remove("hidden");
}

function renderizarListaAnexosNoModal(anexos) {
    if (!listaAnexosContrato) return;
    listaAnexosContrato.innerHTML = "";
    anexos.forEach((anexo, index) => {
        listaAnexosContrato.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                <a href="${anexo.url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-size: 14px;">📄 ${anexo.nome || 'Arquivo'}</a>
                <button onclick="removerAnexoIndividual(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Excluir</button>
            </div>
        `;
    });
}

async function removerAnexoIndividual(indexAnexo) {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;
    const contrato = contratos.find(c => String(c.id) === String(contratoVisualizandoId));
    if (!contrato || !contrato.anexos) return;

    contrato.anexos.splice(indexAnexo, 1);
    await db.collection("contratos").doc(String(contrato.id)).update({ anexos: contrato.anexos });
    mostrarContratos();
    if (contrato.anexos.length === 0) modalAnexos.classList.add("hidden");
    else renderizarListaAnexosNoModal(contrato.anexos);
}

function editarContrato(id) {
    const contrato = contratos.find(c => String(c.id) === String(id));
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

    if (modalContrato) modalContrato.classList.remove("hidden");
}

async function excluirContrato(id) {
    if (!confirm("Deseja realmente excluir este contrato?")) return;
    await db.collection("contratos").doc(String(id)).delete();
}

function limparFormularioContrato() {
    if (document.getElementById("clienteContrato")) document.getElementById("clienteContrato").value = "";
    if (document.getElementById("obraContrato")) document.getElementById("obraContrato").value = "";
    if (document.getElementById("valorContrato")) document.getElementById("valorContrato").value = "";
    if (document.getElementById("dataContrato")) document.getElementById("dataContrato").value = "";
    if (document.getElementById("descricaoContrato")) document.getElementById("descricaoContrato").value = "";
    contratoEmEdicaoId = null;
}


// ==============================
// FINANCEIRO
// ==============================

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
    salvarLancamento.addEventListener("click", async function() {
        const descricao = document.getElementById("descricaoLancamento").value.trim();
        const tipo = document.getElementById("tipoLancamento").value;
        const data = document.getElementById("dataLancamento").value;
        const obraId = document.getElementById("obraLancamento").value;
        const valorTexto = document.getElementById("valorLancamento").value;

        if (!descricao) { alert("Digite a descrição do lançamento."); return; }

        try {
            const novoId = String(Date.now());
            await db.collection("lancamentos").doc(novoId).set({
                id: novoId,
                descricao,
                tipo,
                data,
                obraId,
                valor: converterMoedaParaNumero(valorTexto)
            });

            modalLancamento.classList.add("hidden");
            limparFormularioLancamento();
        } catch (err) {
            console.error("Erro ao salvar lançamento:", err);
        }
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

        const obra = obras.find(o => String(o.id) === String(l.obraId));
        const cliente = obra ? clientes.find(c => String(c.id) === String(obra.clienteId)) : null;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${l.descricao}</td>
            <td>${l.tipo === "receita" ? "🟢 Receita" : "🔴 Despesa"}</td>
            <td>${obra ? obra.nome : "Geral"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${l.data || "-"}</td>
            <td><button class="secondary-button" onclick="excluirLancamento('${l.id}')">Excluir</button></td>
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

async function excluirLancamento(id) {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    await db.collection("lancamentos").doc(String(id)).delete();
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
                const cliente = clientes.find(c => String(c.id) === String(obra.clienteId));
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
// OUVINTES EM TEMPO REAL (FIREBASE ON-SNAPSHOT)
// ==============================

function iniciarSincronizacaoEmTempoReal() {
    verificarAutenticacao();

    // Clientes em tempo real
    db.collection("clientes").onSnapshot((snapshot) => {
        clientes = [];
        snapshot.forEach(doc => clientes.push(doc.data()));
        mostrarClientes();
        atualizarDashboard();
    });

    // Obras em tempo real
    db.collection("obras").onSnapshot((snapshot) => {
        obras = [];
        snapshot.forEach(doc => obras.push(doc.data()));
        mostrarObras();
        atualizarDashboard();
    });

    // Contratos em tempo real
    db.collection("contratos").onSnapshot((snapshot) => {
        contratos = [];
        snapshot.forEach(doc => contratos.push(doc.data()));
        mostrarContratos();
    });

    // Lançamentos em tempo real
    db.collection("lancamentos").onSnapshot((snapshot) => {
        lancamentos = [];
        snapshot.forEach(doc => lancamentos.push(doc.data()));
        mostrarLancamentos();
        atualizarDashboard();
    });
}

// Iniciar aplicação conectada à nuvem
iniciarSincronizacaoEmTempoReal();


// ==============================
// FICHA DO CLIENTE
// ==============================
function abrirCliente(id) {
    const cliente = clientes.find(c => String(c.id) === String(id));
    if (!cliente) return;

    pages.forEach(p => p.classList.add("hidden"));
    document.getElementById("page-ficha-cliente").classList.remove("hidden");

    document.getElementById("fichaNomeCliente").textContent = cliente.nome;
    document.getElementById("fichaTelefone").textContent = cliente.telefone || "-";
    document.getElementById("fichaDocumento").textContent = cliente.documento || "-";
    document.getElementById("fichaEndereco").textContent = cliente.endereco || "-";
    document.getElementById("fichaObservacoes").textContent = cliente.observacoes || "Nenhuma observação.";

    const divObrasCliente = document.getElementById("obrasDoCliente");
    const obrasDoCli = obras.filter(o => String(o.clienteId) === String(id));
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
    const contratosDoCli = contratos.filter(c => String(c.clienteId) === String(id));
    
    if (divContratosCliente) {
        if (contratosDoCli.length === 0) {
            divContratosCliente.innerHTML = `<p>Nenhum contrato cadastrado para este cliente.</p>`;
        } else {
            divContratosCliente.innerHTML = contratosDoCli.map(c => {
                const obraContrato = obras.find(o => String(o.id) === String(c.obraId));
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
// MÁSCARAS AUTOMÁTICAS (CPF/CNPJ E TELEFONE)
// ==============================

function aplicarMascaraCpfCnpj(e) {
    let valor = e.target.value.replace(/\D/g, "");
    
    if (valor.length <= 11) {
        // Formato CPF: 000.000.000-00
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        // Formato CNPJ: 00.000.000/0000-00
        valor = valor.substring(0, 14);
        valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
        valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    }
    
    e.target.value = valor;
}

function aplicarMascaraTelefone(e) {
    let valor = e.target.value.replace(/\D/g, "").substring(0, 11);
    
    if (valor.length > 10) {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 6) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (valor.length > 0) {
        valor = valor.replace(/^(\d*)/, "($1");
    }
    
    e.target.value = valor;
}

const inputDocCliente = document.getElementById("documentoCliente");
if (inputDocCliente) {
    inputDocCliente.addEventListener("input", aplicarMascaraCpfCnpj);
}

const inputTelCliente = document.getElementById("telefoneCliente");
if (inputTelCliente) {
    inputTelCliente.addEventListener("input", aplicarMascaraTelefone);
}
