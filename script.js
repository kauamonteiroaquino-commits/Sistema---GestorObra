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
    localStorage.setItem("materiais", JSON.stringify(materiais));
    localStorage.setItem("compras", JSON.stringify(compras));
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

const btnNovoCliente = document.getElementById("btnNovoCliente");
const modalCliente = document.getElementById("modalCliente");
const fecharModal = document.getElementById("fecharModal");
const cancelarCliente = document.getElementById("cancelarCliente");
const salvarCliente = document.getElementById("salvarCliente");

if (btnNovoCliente) {
    btnNovoCliente.addEventListener("click", function() {
        limparFormularioCliente();
        modalCliente.classList.remove("hidden");
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

        const cliente = {
            id: Date.now(),
            nome: nome,
            telefone: telefone,
            documento: documento,
            endereco: endereco,
            observacoes: observacoes
        };

        clientes.push(cliente);
        salvarDadosStorage();
        mostrarClientes();
        atualizarDashboard();
        modalCliente.classList.add("hidden");
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
            <td><button class="secondary-button" onclick="excluirCliente(${cliente.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
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
}

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

    // Renderizar Obras do Cliente
    const divObrasCliente = document.getElementById("obrasDoCliente");
    const obrasDoCli = obras.filter(o => o.clienteId === id);
    if (divObrasCliente) {
        if (obrasDoCli.length === 0) {
            divObrasCliente.innerHTML = `<p>Nenhuma obra cadastrada para este cliente.</p>`;
        } else {
            divObrasCliente.innerHTML = obrasDoCli.map(o => `<p>🏗️ <strong>${o.nome}</strong> - R$ ${Number(o.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>`).join('');
        }
    }
}

const voltarClientes = document.getElementById("voltarClientes");
if (voltarClientes) {
    voltarClientes.addEventListener("click", () => {
        document.getElementById("page-ficha-cliente").classList.add("hidden");
        document.getElementById("page-clientes").classList.remove("hidden");
    });
}


// ==============================
// GESTÃO DE OBRAS
// ==============================

let obras = JSON.parse(localStorage.getItem("obras")) || [];

const btnNovaObra = document.getElementById("btnNovaObra");
const modalObra = document.getElementById("modalObra");
const fecharModalObra = document.getElementById("fecharModalObra");
const cancelarObra = document.getElementById("cancelarObra");
const salverObraBtn = document.getElementById("salvarObra");

if (btnNovaObra) {
    btnNovaObra.addEventListener("click", function() {
        carregarClientesNaObra();
        limparFormularioObra();
        modalObra.classList.remove("hidden");
    });
}

if (fecharModalObra) fecharModalObra.addEventListener("click", () => modalObra.classList.add("hidden"));
if (cancelarObra) cancelarObra.addEventListener("click", () => modalObra.classList.add("hidden"));

function carregarClientesNaObra() {
    const select = document.getElementById("clienteObra");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });
}

if (salverObraBtn) {
    salverObraBtn.addEventListener("click", function() {
        const nome = document.getElementById("nomeObra").value.trim();
        const clienteId = document.getElementById("clienteObra").value;
        const endereco = document.getElementById("enderecoObra").value.trim();
        const dataInicio = document.getElementById("dataInicioObra").value;
        const dataFim = document.getElementById("dataFimObra").value;
        const status = document.getElementById("statusObra").value;
        const valorTexto = document.getElementById("valorObra").value;
        const observacoes = document.getElementById("observacoesObra").value;

        if (!nome) { alert("Digite o nome da obra."); return; }

        const obra = {
            id: Date.now(),
            nome: nome,
            clienteId: Number(clienteId),
            endereco: endereco,
            dataInicio: dataInicio,
            dataFim: dataFim,
            status: status,
            valor: converterMoedaParaNumero(valorTexto),
            observacoes: observacoes
        };

        obras.push(obra);
        salvarDadosStorage();
        modalObra.classList.add("hidden");
        mostrarObras();
        atualizarDashboard();
    });
}

function limparFormularioObra() {
    document.getElementById("nomeObra").value = "";
    document.getElementById("enderecoObra").value = "";
    document.getElementById("dataInicioObra").value = "";
    document.getElementById("dataFimObra").value = "";
    document.getElementById("valorObra").value = "";
    document.getElementById("observacoesObra").value = "";
}

function mostrarObras() {
    const tabela = document.getElementById("listaObras");
    const totalContador = document.getElementById("totalObras");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${obras.length} obra${obras.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    obras.forEach(obra => {
        const cliente = clientes.find(c => c.id === obra.clienteId);
        const linha = document.createElement("tr");
        
        let statusTexto = "Em Andamento";
        if (obra.status === "planejamento") statusTexto = "Em Planejamento";
        if (obra.status === "pausada") statusTexto = "Pausada";
        if (obra.status === "concluida") statusTexto = "Concluída";

        linha.innerHTML = `
            <td>${obra.nome}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${statusTexto}</td>
            <td>${Number(obra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><button class="secondary-button" onclick="excluirObra(${obra.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function excluirObra(id) {
    if (!confirm("Deseja realmente excluir esta obra?")) return;
    obras = obras.filter(o => o.id !== id);
    salvarDadosStorage();
    mostrarObras();
    atualizarDashboard();
}


// ==============================
// CONTRATOS
// ==============================

let contratos = JSON.parse(localStorage.getItem("contratos")) || [];

const btnNovoContrato = document.getElementById("btnNovoContrato");
const modalContrato = document.getElementById("modalContrato");
const fecharModalContrato = document.getElementById("fecharModalContrato");
const cancelarContrato = document.getElementById("cancelarContrato");
const salvarContrato = document.getElementById("salvarContrato");

if (btnNovoContrato) {
    btnNovoContrato.addEventListener("click", function() {
        carregarObrasNoContrato();
        limparFormularioContrato();
        modalContrato.classList.remove("hidden");
    });
}

if (fecharModalContrato) fecharModalContrato.addEventListener("click", () => modalContrato.classList.add("hidden"));
if (cancelarContrato) cancelarContrato.addEventListener("click", () => modalContrato.classList.add("hidden"));

function carregarObrasNoContrato() {
    const select = document.getElementById("obraContrato");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione a obra</option>';
    obras.forEach(o => {
        select.innerHTML += `<option value="${o.id}">${o.nome}</option>`;
    });
}

if (salvarContrato) {
    salvarContrato.addEventListener("click", function() {
        const nome = document.getElementById("nomeContrato").value.trim();
        const obraId = document.getElementById("obraContrato").value;
        const data = document.getElementById("dataContrato").value;
        const valorTexto = document.getElementById("valorContrato").value;
        const observacoes = document.getElementById("observacoesContrato").value;

        if (!nome) { alert("Digite o nome do contrato."); return; }

        const contrato = {
            id: Date.now(),
            nome: nome,
            obraId: Number(obraId),
            data: data,
            valor: converterMoedaParaNumero(valorTexto),
            observacoes: observacoes
        };

        contratos.push(contrato);
        salvarDadosStorage();
        modalContrato.classList.add("hidden");
        mostrarContratos();
    });
}

function limparFormularioContrato() {
    document.getElementById("nomeContrato").value = "";
    document.getElementById("dataContrato").value = "";
    document.getElementById("valorContrato").value = "";
    document.getElementById("observacoesContrato").value = "";
}

function mostrarContratos() {
    const tabela = document.getElementById("listaContratos");
    const totalContador = document.getElementById("totalContratos");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${contratos.length} contrato${contratos.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    contratos.forEach(contrato => {
        const obra = obras.find(o => o.id === contrato.obraId);
        const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;
        
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${contrato.nome}</td>
            <td>${obra ? obra.nome : "-"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${Number(contrato.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><button class="secondary-button" onclick="excluirContrato(${contrato.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function excluirContrato(id) {
    if (!confirm("Deseja realmente excluir este contrato?")) return;
    contratos = contratos.filter(c => c.id !== id);
    salvarDadosStorage();
    mostrarContratos();
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
// ESTOQUE
// ==============================

let materiais = JSON.parse(localStorage.getItem("materiais")) || [];

const btnNovoMaterial = document.getElementById("btnNovoMaterial");
const modalMaterial = document.getElementById("modalMaterial");
const fecharModalMaterial = document.getElementById("fecharModalMaterial");
const cancelarMaterial = document.getElementById("cancelarMaterial");
const salvarMaterial = document.getElementById("salvarMaterial");

if (btnNovoMaterial) {
    btnNovoMaterial.addEventListener("click", function() {
        limparFormularioMaterial();
        modalMaterial.classList.remove("hidden");
    });
}

if (fecharModalMaterial) fecharModalMaterial.addEventListener("click", () => modalMaterial.classList.add("hidden"));
if (cancelarMaterial) cancelarMaterial.addEventListener("click", () => modalMaterial.classList.add("hidden"));

if (salvarMaterial) {
    salvarMaterial.addEventListener("click", function() {
        const nome = document.getElementById("nomeMaterial").value.trim();
        const categoria = document.getElementById("categoriaMaterial").value.trim();
        const unidade = document.getElementById("unidadeMaterial").value;
        const quantidade = document.getElementById("quantidadeMaterial").value;
        const precoTexto = document.getElementById("precoMaterial").value;

        if (!nome) { alert("Digite o nome do material."); return; }

        const material = {
            id: Date.now(),
            nome: nome,
            categoria: categoria,
            unidade: unidade,
            quantidade: Number(quantidade) || 0,
            preco: converterMoedaParaNumero(precoTexto)
        };

        materiais.push(material);
        salvarDadosStorage();
        modalMaterial.classList.add("hidden");
        limparFormularioMaterial();
        mostrarMateriais();
    });
}

function limparFormularioMaterial() {
    document.getElementById("nomeMaterial").value = "";
    document.getElementById("categoriaMaterial").value = "";
    document.getElementById("quantidadeMaterial").value = "";
    document.getElementById("precoMaterial").value = "";
}

function mostrarMateriais() {
    const tabela = document.getElementById("listaMateriais");
    const totalContador = document.getElementById("totalMateriais");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${materiais.length} material${materiais.length !== 1 ? 'is' : ''}`;

    tabela.innerHTML = "";
    materiais.forEach(m => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${m.nome}</td>
            <td>${m.categoria || "-"}</td>
            <td>${m.quantidade}</td>
            <td>${m.unidade || "un"}</td>
            <td>${Number(m.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><button class="secondary-button" onclick="excluirMaterial(${m.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function excluirMaterial(id) {
    if (!confirm("Deseja realmente excluir este material?")) return;
    materiais = materiais.filter(m => m.id !== id);
    salvarDadosStorage();
    mostrarMateriais();
}


// ==============================
// COMPRAS
// ==============================

let compras = JSON.parse(localStorage.getItem("compras")) || [];

const btnNovaCompra = document.getElementById("btnNovaCompra");
const modalCompra = document.getElementById("modalCompra");
const fecharModalCompra = document.getElementById("fecharModalCompra");
const cancelarCompra = document.getElementById("cancelarCompra");
const salvarCompra = document.getElementById("salvarCompra");

if (btnNovaCompra) {
    btnNovaCompra.addEventListener("click", function() {
        carregarMateriaisNaCompra();
        limparFormularioCompra();
        modalCompra.classList.remove("hidden");
    });
}

if (fecharModalCompra) fecharModalCompra.addEventListener("click", () => modalCompra.classList.add("hidden"));
if (cancelarCompra) cancelarCompra.addEventListener("click", () => modalCompra.classList.add("hidden"));

function carregarMateriaisNaCompra() {
    const select = document.getElementById("materialCompra");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o material</option><option value="outros">Outros</option>';
    materiais.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
}

if (salvarCompra) {
    salvarCompra.addEventListener("click", function() {
        const nome = document.getElementById("nomeCompra").value.trim();
        const fornecedor = document.getElementById("fornecedorCompra").value.trim();
        const materialId = document.getElementById("materialCompra").value;
        const quantidade = document.getElementById("quantidadeCompra").value;
        const valorTexto = document.getElementById("valorCompra").value;
        const data = document.getElementById("dataCompra").value;

        if (!nome) { alert("Digite o nome da compra."); return; }

        const compra = {
            id: Date.now(),
            nome: nome,
            fornecedor: fornecedor,
            materialId: materialId,
            quantidade: Number(quantidade) || 0,
            valor: converterMoedaParaNumero(valorTexto),
            data: data
        };

        compras.push(compra);
        salvarDadosStorage();
        modalCompra.classList.add("hidden");
        limparFormularioCompra();
        mostrarCompras();
    });
}

function limparFormularioCompra() {
    document.getElementById("nomeCompra").value = "";
    document.getElementById("fornecedorCompra").value = "";
    document.getElementById("quantidadeCompra").value = "";
    document.getElementById("valorCompra").value = "";
    document.getElementById("dataCompra").value = "";
}

function mostrarCompras() {
    const tabela = document.getElementById("listaCompras");
    const totalContador = document.getElementById("totalCompras");
    if (!tabela) return;

    if (totalContador) totalContador.textContent = `${compras.length} compra${compras.length !== 1 ? 's' : ''}`;

    tabela.innerHTML = "";
    compras.forEach(c => {
        const mat = materiais.find(m => m.id == c.materialId);
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${c.nome}</td>
            <td>${c.fornecedor || "-"}</td>
            <td>${mat ? mat.nome : "Outros"}</td>
            <td>${c.quantidade}</td>
            <td>${Number(c.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${c.data || "-"}</td>
            <td><button class="secondary-button" onclick="excluirCompra(${c.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });
}

function excluirCompra(id) {
    if (!confirm("Deseja realmente excluir esta compra?")) return;
    compras = compras.filter(c => c.id !== id);
    salvarDadosStorage();
    mostrarCompras();
}


// ==============================
// DASHBOARD
// ==============================

function atualizarDashboard() {
    // Total de Clientes
    const elTotalClientes = document.getElementById("dashTotalClientes");
    if (elTotalClientes) elTotalClientes.textContent = clientes.length;

    // Obras Ativas
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

    // Resumo das Últimas Obras no Dashboard
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
mostrarMateriais();
mostrarCompras();
atualizarDashboard();
