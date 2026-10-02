// ==============================
// NAVEGAÇÃO
// ==============================

const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

menuItems.forEach(item => {
    item.addEventListener("click", function(event) {
        event.preventDefault();

        menuItems.forEach(menu => {
            menu.classList.remove("active");
        });

        this.classList.add("active");

        pages.forEach(page => {
            page.classList.add("hidden");
        });

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

const btnNovoCliente = document.getElementById("btnNovoCliente");
const modalCliente = document.getElementById("modalCliente");
const fecharModal = document.getElementById("fecharModal");
const cancelarCliente = document.getElementById("cancelarCliente");
const salvarCliente = document.getElementById("salvarCliente");
const editarCliente = document.getElementById("editarCliente");

if (btnNovoCliente) {
    btnNovoCliente.addEventListener("click", function() {
        clienteEditandoId = null;
        limparFormularioCliente();
        document.querySelector("#modalCliente h2").textContent = "Novo cliente";
        salvarCliente.textContent = "Salvar cliente";
        modalCliente.classList.remove("hidden");
    });
}

if (fecharModal) {
    fecharModal.addEventListener("click", function() {
        modalCliente.classList.add("hidden");
    });
}

if (cancelarCliente) {
    cancelarCliente.addEventListener("click", function() {
        modalCliente.classList.add("hidden");
    });
}


// ==============================
// SALVAR CLIENTE
// ==============================

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let clienteEditandoId = null;

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

        // EDITANDO CLIENTE
        if (clienteEditandoId !== null) {
            const cliente = clientes.find(c => c.id === clienteEditandoId);

            if (cliente) {
                cliente.nome = nome;
                cliente.telefone = telefone;
                cliente.documento = documento;
                cliente.endereco = endereco;
                cliente.observacoes = observacoes;
            }

            localStorage.setItem("clientes", JSON.stringify(clientes));

            mostrarClientes();
            mostrarObras();

            modalCliente.classList.add("hidden");
            clienteEditandoId = null;

            document.querySelector("#modalCliente h2").textContent = "Novo cliente";
            salvarCliente.textContent = "Salvar cliente";

            limparFormularioCliente();
            abrirCliente(cliente.id);
            return;
        }

        // NOVO CLIENTE
        const cliente = {
            id: Date.now(),
            nome: nome,
            telefone: telefone,
            documento: documento,
            endereco: endereco,
            observacoes: observacoes
        };

        clientes.push(cliente);
        localStorage.setItem("clientes", JSON.stringify(clientes));

        mostrarClientes();
        modalCliente.classList.add("hidden");
        limparFormularioCliente();
    });
}

// ==============================
// MOSTRAR CLIENTES
// ==============================

function mostrarClientes() {
    const tabela = document.getElementById("listaClientes");
    if (!tabela) return;

    tabela.innerHTML = "";

    const clientesOrdenados = [...clientes].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    clientesOrdenados.forEach(cliente => {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                <button class="cliente-link" onclick="abrirCliente(${cliente.id})">
                    ${cliente.nome}
                </button>
            </td>
            <td>${cliente.telefone || "-"}</td>
            <td>${cliente.documento || "-"}</td>
            <td>${cliente.endereco || "-"}</td>
            <td>
                <button class="secondary-button" onclick="excluirCliente(${cliente.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalClientes();
}

function excluirCliente(id) {
    const obrasVinculadas = obras.filter(obra => obra.clienteId === id);

    if (obrasVinculadas.length > 0) {
        alert("Não é possível excluir este cliente porque existem " + obrasVinculadas.length + " obra(s) vinculada(s) a ele.");
        return;
    }

    if (!confirm("Deseja realmente excluir este cliente?")) {
        return;
    }

    clientes = clientes.filter(cliente => cliente.id !== id);
    localStorage.setItem("clientes", JSON.stringify(clientes));
    mostrarClientes();
}

function atualizarTotalClientes() {
    const totalElement = document.getElementById("totalClientes");
    if (totalElement) {
        const total = clientes.length;
        totalElement.textContent = total === 1 ? "1 cliente" : total + " clientes";
    }
}

function limparFormularioCliente() {
    document.getElementById("nomeCliente").value = "";
    document.getElementById("telefoneCliente").value = "";
    document.getElementById("documentoCliente").value = "";
    document.getElementById("enderecoCliente").value = "";
    document.getElementById("observacoesCliente").value = "";
}


// ==============================
// MÁSCARAS AUTOMÁTICAS
// ==============================

const telefoneInput = document.getElementById("telefoneCliente");
if (telefoneInput) {
    telefoneInput.addEventListener("input", function() {
        let numero = this.value.replace(/\D/g, "");
        if (numero.length > 11) numero = numero.substring(0, 11);

        if (numero.length <= 10) {
            numero = numero.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, function(_, ddd, p1, p2) {
                let res = "";
                if (ddd) res = "(" + ddd;
                if (ddd.length === 2) res += ") ";
                if (p1) res += p1;
                if (p2) res += "-" + p2;
                return res;
            });
        } else {
            numero = numero.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, function(_, ddd, p1, p2) {
                let res = "(" + ddd + ") " + p1;
                if (p2) res += "-" + p2;
                return res;
            });
        }
        this.value = numero;
    });
}

const documentoInput = document.getElementById("documentoCliente");
if (documentoInput) {
    documentoInput.addEventListener("input", function() {
        let numero = this.value.replace(/\D/g, "");
        if (numero.length > 14) numero = numero.substring(0, 14);

        if (numero.length <= 11) {
            numero = numero.replace(/^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2}).*/, function(_, p1, p2, p3, p4) {
                let res = p1;
                if (p2) res += "." + p2;
                if (p3) res += "." + p3;
                if (p4) res += "-" + p4;
                return res;
            });
        } else {
            numero = numero.replace(/^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/, function(_, p1, p2, p3, p4, p5) {
                let res = p1;
                if (p2) res += "." + p2;
                if (p3) res += "." + p3;
                if (p4) res += "/" + p4;
                if (p5) res += "-" + p5;
                return res;
            });
        }
        this.value = numero;
    });
}

const pesquisaCliente = document.getElementById("pesquisaCliente");
if (pesquisaCliente) {
    pesquisaCliente.addEventListener("input", function() {
        const pesquisa = this.value.toLowerCase().trim();
        const tabela = document.getElementById("listaClientes");
        const linhas = tabela.querySelectorAll("tr");

        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(pesquisa) ? "" : "none";
        });
    });
}


// ==============================
// ABRIR FICHA DO CLIENTE
// ==============================

function abrirCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    pages.forEach(page => page.classList.add("hidden"));
    document.getElementById("page-ficha-cliente").classList.remove("hidden");

    document.getElementById("fichaNomeCliente").textContent = cliente.nome;
    document.getElementById("fichaTelefone").textContent = cliente.telefone || "-";
    document.getElementById("fichaDocumento").textContent = cliente.documento || "-";
    document.getElementById("fichaEndereco").textContent = cliente.endereco || "-";
    document.getElementById("fichaObservacoes").textContent = cliente.observacoes || "Nenhuma observação.";

    // Obras do Cliente
    const obrasCliente = obras.filter(obra => obra.clienteId === cliente.id);
    const containerObras = document.getElementById("obrasDoCliente");
    containerObras.innerHTML = "";

    if (obrasCliente.length === 0) {
        containerObras.innerHTML = "<p>Nenhuma obra cadastrada para este cliente.</p>";
    } else {
        obrasCliente.forEach(obra => {
            const obraDiv = document.createElement("div");
            obraDiv.style.marginBottom = "18px";
            obraDiv.innerHTML = `
                <button class="cliente-link" onclick="abrirObra(${obra.id})">🏗️ ${obra.nome}</button>
                <p style="margin: 6px 0; color: #94a3b8;">📍 ${obra.endereco || "Endereço não informado"}</p>
                <p style="margin: 6px 0; color: #94a3b8;">💰 ${Number(obra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                <p style="margin: 6px 0; color: #94a3b8;">📅 ${obra.dataInicio ? new Date(obra.dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "Data não informada"}</p>
            `;
            containerObras.appendChild(obraDiv);
        });
    }

    // Contratos do Cliente
    const contratosCliente = contratos.filter(contrato => {
        const obra = obras.find(o => o.id === contrato.obraId);
        return obra && obra.clienteId === cliente.id;
    });

    const containerContratos = document.getElementById("contratosDoCliente");
    containerContratos.innerHTML = "";

    if (contratosCliente.length === 0) {
        containerContratos.innerHTML = "<p>Nenhum contrato cadastrado para este cliente.</p>";
    } else {
        contratosCliente.forEach(contrato => {
            const obra = obras.find(o => o.id === contrato.obraId);
            const contratoDiv = document.createElement("div");
            contratoDiv.style.marginBottom = "18px";
            contratoDiv.innerHTML = `
                <button class="cliente-link" onclick="abrirContrato(${contrato.id})">📄 ${contrato.nome}</button>
                <p style="margin: 6px 0; color: #94a3b8;">🏗️ ${obra ? obra.nome : "Obra não encontrada"}</p>
                <p style="margin: 6px 0; color: #94a3b8;">💰 ${Number(contrato.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            `;
            containerContratos.appendChild(contratoDiv);
        });
    }
}

const voltarClientes = document.getElementById("voltarClientes");
if (voltarClientes) {
    voltarClientes.addEventListener("click", function() {
        document.getElementById("page-ficha-cliente").classList.add("hidden");
        document.getElementById("page-clientes").classList.remove("hidden");
    });
}

if (editarCliente) {
    editarCliente.addEventListener("click", function() {
        const nome = document.getElementById("fichaNomeCliente").textContent;
        const cliente = clientes.find(c => c.nome === nome);
        if (!cliente) return;

        clienteEditandoId = cliente.id;
        document.getElementById("nomeCliente").value = cliente.nome;
        document.getElementById("telefoneCliente").value = cliente.telefone || "";
        document.getElementById("documentoCliente").value = cliente.documento || "";
        document.getElementById("enderecoCliente").value = cliente.endereco || "";
        document.getElementById("observacoesCliente").value = cliente.observacoes || "";

        document.querySelector("#modalCliente h2").textContent = "Editar cliente";
        salvarCliente.textContent = "Salvar alterações";

        document.getElementById("page-ficha-cliente").classList.add("hidden");
        document.getElementById("page-clientes").classList.remove("hidden");
        modalCliente.classList.remove("hidden");
    });
}


// ==============================
// OBRAS
// ==============================

let obras = JSON.parse(localStorage.getItem("obras")) || [];

const btnNovaObra = document.getElementById("btnNovaObra");
const modalObra = document.getElementById("modalObra");
const fecharModalObra = document.getElementById("fecharModalObra");
const cancelarObra = document.getElementById("cancelarObra");
const clienteObra = document.getElementById("clienteObra");
const salvarObra = document.getElementById("salvarObra");

if (btnNovaObra) {
    btnNovaObra.addEventListener("click", function() {
        carregarClientesNaObra();
        modalObra.classList.remove("hidden");
    });
}

if (fecharModalObra) {
    fecharModalObra.addEventListener("click", function() { modalObra.classList.add("hidden"); });
}

if (cancelarObra) {
    cancelarObra.addEventListener("click", function() { modalObra.classList.add("hidden"); });
}

function carregarClientesNaObra() {
    if (!clienteObra) return;
    clienteObra.innerHTML = '<option value="">Selecione o cliente</option>';
    clientes.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente.id;
        option.textContent = cliente.nome;
        clienteObra.appendChild(option);
    });
}

if (salvarObra) {
    salvarObra.addEventListener("click", function() {
        const nome = document.getElementById("nomeObra").value.trim();
        const clienteId = document.getElementById("clienteObra").value;
        const endereco = document.getElementById("enderecoObra").value.trim();
        const dataInicio = document.getElementById("dataInicioObra").value;
        const valorTexto = document.getElementById("valorObra").value;
        const valor = valorTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
        const observacoes = document.getElementById("observacoesObra").value.trim();

        if (nome === "") { alert("Digite o nome da obra."); return; }
        if (clienteId === "") { alert("Selecione o cliente."); return; }

        const obra = {
            id: Date.now(),
            nome: nome,
            clienteId: Number(clienteId),
            endereco: endereco,
            dataInicio: dataInicio,
            valor: Number(valor) || 0,
            observacoes: observacoes
        };

        obras.push(obra);
        localStorage.setItem("obras", JSON.stringify(obras));
        modalObra.classList.add("hidden");
        limparFormularioObra();
        mostrarObras();
    });
}

function limparFormularioObra() {
    document.getElementById("nomeObra").value = "";
    document.getElementById("clienteObra").value = "";
    document.getElementById("enderecoObra").value = "";
    document.getElementById("dataInicioObra").value = "";
    document.getElementById("valorObra").value = "";
    document.getElementById("observacoesObra").value = "";
}

function mostrarObras() {
    const tabela = document.getElementById("listaObras");
    if (!tabela) return;

    tabela.innerHTML = "";
    const obrasOrdenadas = [...obras].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    obrasOrdenadas.forEach(obra => {
        const cliente = clientes.find(c => c.id === obra.clienteId);
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td><button class="cliente-link" onclick="abrirObra(${obra.id})">${obra.nome}</button></td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${obra.endereco || "-"}</td>
            <td>${Number(obra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><button class="secondary-button" onclick="excluirObra(${obra.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });

    atualizarTotalObras();
}

function atualizarTotalObras() {
    const el = document.getElementById("totalObras");
    if (el) el.textContent = obras.length === 1 ? "1 obra" : obras.length + " obras";
}

function excluirObra(id) {
    if (!confirm("Deseja realmente excluir esta obra?")) return;
    obras = obras.filter(o => o.id !== id);
    localStorage.setItem("obras", JSON.stringify(obras));
    mostrarObras();
}

const valorObraInput = document.getElementById("valorObra");
if (valorObraInput) {
    valorObraInput.addEventListener("input", function() {
        let v = this.value.replace(/\D/g, "");
        if (v === "") { this.value = ""; return; }
        this.value = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    });
}

const pesquisaObra = document.getElementById("pesquisaObra");
if (pesquisaObra) {
    pesquisaObra.addEventListener("input", function() {
        const pesquisa = this.value.toLowerCase().trim();
        const tabela = document.getElementById("listaObras");
        tabela.querySelectorAll("tr").forEach(linha => {
            linha.style.display = linha.textContent.toLowerCase().includes(pesquisa) ? "" : "none";
        });
    });
}

function abrirObra(id) {
    const obra = obras.find(o => o.id === id);
    if (!obra) return;

    pages.forEach(p => p.classList.add("hidden"));
    document.getElementById("page-ficha-obra").classList.remove("hidden");

    document.getElementById("fichaNomeObra").textContent = obra.nome;
    const cliente = clientes.find(c => c.id === obra.clienteId);
    document.getElementById("fichaClienteObra").innerHTML = cliente
        ? `<button class="cliente-link" onclick="abrirCliente(${cliente.id})">${cliente.nome}</button>`
        : "-";
    document.getElementById("fichaEnderecoObra").textContent = obra.endereco || "-";
    document.getElementById("fichaDataObra").textContent = obra.dataInicio ? new Date(obra.dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "-";
    document.getElementById("fichaValorObra").textContent = Number(obra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    document.getElementById("fichaObservacoesObra").textContent = obra.observacoes || "Nenhuma observação.";
}

const voltarObras = document.getElementById("voltarObras");
if (voltarObras) {
    voltarObras.addEventListener("click", function() {
        document.getElementById("page-ficha-obra").classList.add("hidden");
        document.getElementById("page-obras").classList.remove("hidden");
    });
}


// ==============================
// CONTRATOS
// ==============================

let contratos = JSON.parse(localStorage.getItem("contratos")) || [];
let contratoEditandoId = null;

const btnNovoContrato = document.getElementById("btnNovoContrato");
const modalContrato = document.getElementById("modalContrato");
const fecharModalContrato = document.getElementById("fecharModalContrato");
const cancelarContrato = document.getElementById("cancelarContrato");
const obraContrato = document.getElementById("obraContrato");
const salvarContrato = document.getElementById("salvarContrato");

if (btnNovoContrato) {
    btnNovoContrato.addEventListener("click", function() {
        contratoEditandoId = null;
        carregarObrasNoContrato();
        limparFormularioContrato();
        document.querySelector("#modalContrato h2").textContent = "Novo contrato";
        salvarContrato.textContent = "Salvar contrato";
        modalContrato.classList.remove("hidden");
    });
}

if (fecharModalContrato) fecharModalContrato.addEventListener("click", function() { modalContrato.classList.add("hidden"); });
if (cancelarContrato) cancelarContrato.addEventListener("click", function() { modalContrato.classList.add("hidden"); });

function carregarObrasNoContrato() {
    if (!obraContrato) return;
    obraContrato.innerHTML = '<option value="">Selecione a obra</option>';
    obras.forEach(obra => {
        const option = document.createElement("option");
        option.value = obra.id;
        option.textContent = obra.nome;
        obraContrato.appendChild(option);
    });
}

const valorContratoInput = document.getElementById("valorContrato");
if (valorContratoInput) {
    valorContratoInput.addEventListener("input", function() {
        let v = this.value.replace(/\D/g, "");
        if (v === "") { this.value = ""; return; }
        this.value = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    });
}

if (salvarContrato) {
    salvarContrato.addEventListener("click", function() {
        const nome = document.getElementById("nomeContrato").value.trim();
        const obraId = document.getElementById("obraContrato").value;
        const data = document.getElementById("dataContrato").value;
        const valorTexto = document.getElementById("valorContrato").value;
        const observacoes = document.getElementById("observacoesContrato").value.trim();

        if (nome === "") { alert("Digite o nome do contrato."); return; }

        const valor = valorTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();

        if (contratoEditandoId !== null) {
            const contrato = contratos.find(c => c.id === contratoEditandoId);
            if (contrato) {
                contrato.nome = nome;
                contrato.obraId = Number(obraId);
                contrato.data = data;
                contrato.valor = Number(valor) || 0;
                contrato.observacoes = observacoes;
            }
            contratoEditandoId = null;
        } else {
            const contrato = {
                id: Date.now(),
                nome: nome,
                obraId: Number(obraId),
                data: data,
                valor: Number(valor) || 0,
                observacoes: observacoes
            };
            contratos.push(contrato);
        }

        localStorage.setItem("contratos", JSON.stringify(contratos));
        modalContrato.classList.add("hidden");
        limparFormularioContrato();
        mostrarContratos();
    });
}

function limparFormularioContrato() {
    document.getElementById("nomeContrato").value = "";
    document.getElementById("obraContrato").value = "";
    document.getElementById("dataContrato").value = "";
    document.getElementById("valorContrato").value = "";
    document.getElementById("observacoesContrato").value = "";
}

function mostrarContratos(lista = contratos) {
    const tabela = document.getElementById("listaContratos");
    if (!tabela) return;

    tabela.innerHTML = "";
    const ordenados = [...lista].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    ordenados.forEach(contrato => {
        const obra = obras.find(o => o.id === contrato.obraId);
        const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td><button class="cliente-link" onclick="abrirContrato(${contrato.id})">${contrato.nome}</button></td>
            <td>${obra ? obra.nome : "-"}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${Number(contrato.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><button class="secondary-button" onclick="excluirContrato(${contrato.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });

    atualizarTotalContratos();
}

function atualizarTotalContratos() {
    const el = document.getElementById("totalContratos");
    if (el) el.textContent = contratos.length === 1 ? "1 contrato" : contratos.length + " contratos";
}

function excluirContrato(id) {
    if (!confirm("Deseja realmente excluir este contrato?")) return;
    contratos = contratos.filter(c => c.id !== id);
    localStorage.setItem("contratos", JSON.stringify(contratos));
    mostrarContratos();
}

function abrirContrato(id) {
    const contrato = contratos.find(c => c.id === id);
    if (!contrato) return;

    contratoEditandoId = contrato.id;
    pages.forEach(p => p.classList.add("hidden"));
    document.getElementById("page-ficha-contrato").classList.remove("hidden");

    document.getElementById("fichaNomeContrato").textContent = contrato.nome;
    const obra = obras.find(o => o.id === contrato.obraId);
    const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;

    document.getElementById("fichaObraContrato").innerHTML = obra ? `<button class="cliente-link" onclick="abrirObra(${obra.id})">${obra.nome}</button>` : "-";
    document.getElementById("fichaClienteContrato").innerHTML = cliente ? `<button class="cliente-link" onclick="abrirCliente(${cliente.id})">${cliente.nome}</button>` : "-";
    document.getElementById("fichaDataContrato").textContent = contrato.data ? new Date(contrato.data + "T00:00:00").toLocaleDateString("pt-BR") : "-";
    document.getElementById("fichaValorContrato").textContent = Number(contrato.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    document.getElementById("fichaObservacoesContrato").textContent = contrato.observacoes || "Nenhuma observação.";
}

const editarContrato = document.getElementById("editarContrato");
if (editarContrato) {
    editarContrato.addEventListener("click", function() {
        const contrato = contratos.find(c => c.id === contratoEditandoId);
        if (!contrato) return;

        carregarObrasNoContrato();
        document.getElementById("nomeContrato").value = contrato.nome;
        document.getElementById("obraContrato").value = contrato.obraId;
        document.getElementById("dataContrato").value = contrato.data;
        document.getElementById("valorContrato").value = Number(contrato.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById("observacoesContrato").value = contrato.observacoes || "";

        document.querySelector("#modalContrato h2").textContent = "Editar contrato";
        salvarContrato.textContent = "Salvar alterações";

        document.getElementById("page-ficha-contrato").classList.add("hidden");
        document.getElementById("page-contratos").classList.remove("hidden");
        modalContrato.classList.remove("hidden");
    });
}

const voltarContratos = document.getElementById("voltarContratos");
if (voltarContratos) {
    voltarContratos.addEventListener("click", function() {
        document.getElementById("page-ficha-contrato").classList.add("hidden");
        document.getElementById("page-contratos").classList.remove("hidden");
    });
}


// ==============================
// LANÇAMENTOS (FINANCEIRO)
// ==============================

let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

const btnNovoLancamento = document.getElementById("btnNovoLancamento");
const modalLancamento = document.getElementById("modalLancamento");
const fecharModalLancamento = document.getElementById("fecharModalLancamento");
const cancelarLancamento = document.getElementById("cancelarLancamento");
const salvarLancamento = document.getElementById("salvarLancamento");
const obraLancamento = document.getElementById("obraLancamento");

if (btnNovoLancamento) {
    btnNovoLancamento.addEventListener("click", function() {
        carregarObrasNoLancamento();
        modalLancamento.classList.remove("hidden");
    });
}

if (fecharModalLancamento) fecharModalLancamento.addEventListener("click", function() { modalLancamento.classList.add("hidden"); });
if (cancelarLancamento) cancelarLancamento.addEventListener("click", function() { modalLancamento.classList.add("hidden"); });

function carregarObrasNoLancamento() {
    if (!obraLancamento) return;
    obraLancamento.innerHTML = '<option value="geral">🏢 Geral / Caixa</option>';
    obras.forEach(obra => {
        const option = document.createElement("option");
        option.value = obra.id;
        option.textContent = obra.nome;
        obraLancamento.appendChild(option);
    });
}

const valorLancamentoInput = document.getElementById("valorLancamento");
if (valorLancamentoInput) {
    valorLancamentoInput.addEventListener("input", function() {
        let v = this.value.replace(/\D/g, "");
        if (v === "") { this.value = ""; return; }
        this.value = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    });
}

if (salvarLancamento) {
    salvarLancamento.addEventListener("click", function() {
        const descricao = document.getElementById("descricaoLancamento").value.trim();
        const tipo = document.getElementById("tipoLancamento").value;
        const obraId = document.getElementById("obraLancamento").value;
        const data = document.getElementById("dataLancamento").value;
        const valorTexto = document.getElementById("valorLancamento").value;
        const observacoes = document.getElementById("observacoesLancamento").value.trim();

        if (descricao === "") { alert("Digite a descrição do lançamento."); return; }
        if (obraId === "") { alert("Selecione a obra."); return; }
        if (valorTexto === "") { alert("Digite o valor."); return; }

        const valor = valorTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();

        const lancamento = {
            id: Date.now(),
            descricao: descricao,
            tipo: tipo,
            obraId: obraId === "geral" ? "geral" : Number(obraId),
            data: data,
            valor: Number(valor) || 0,
            observacoes: observacoes
        };

        lancamentos.push(lancamento);
        localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
        modalLancamento.classList.add("hidden");
        limparFormularioLancamento();
        mostrarLancamentos();
    });
}

function limparFormularioLancamento() {
    document.getElementById("descricaoLancamento").value = "";
    document.getElementById("tipoLancamento").value = "receita";
    document.getElementById("obraLancamento").value = "geral";
    document.getElementById("dataLancamento").value = "";
    document.getElementById("valorLancamento").value = "";
    document.getElementById("observacoesLancamento").value = "";
}

function mostrarLancamentos(lista = lancamentos) {
    const tabela = document.getElementById("listaLancamentos");
    if (!tabela) return;

    tabela.innerHTML = "";
    const ordenados = [...lista].sort((a, b) =>
        String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR", { sensitivity: "base" })
    );

    ordenados.forEach(lancamento => {
        const obra = obras.find(o => o.id === Number(lancamento.obraId));
        const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;
        let destino = (lancamento.obraId !== "geral" && obra) ? "🏗️ " + obra.nome : "🏢 Geral / Caixa";

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${lancamento.descricao}</td>
            <td>${lancamento.tipo === "receita" ? "Receita" : "Despesa"}</td>
            <td>${destino}</td>
            <td>${cliente ? cliente.nome : "-"}</td>
            <td>${Number(lancamento.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${lancamento.data ? new Date(lancamento.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</td>
            <td><button class="secondary-button" onclick="excluirLancamento(${lancamento.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });

    atualizarTotalLancamentos();
}

function atualizarTotalLancamentos() {
    const el = document.getElementById("totalLancamentos");
    if (el) el.textContent = lancamentos.length === 1 ? "1 lançamento" : lancamentos.length + " lançamentos";

    let receitas = 0;
    let despesas = 0;

    lancamentos.forEach(l => {
        const v = Number(l.valor || 0);
        if (l.tipo === "receita") receitas += v;
        if (l.tipo === "despesa") despesas += v;
    });

    const saldo = receitas - despesas;

    const elRec = document.getElementById("totalReceitas");
    const elDes = document.getElementById("totalDespesas");
    const elSal = document.getElementById("saldoFinanceiro");

    if (elRec) elRec.textContent = receitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elDes) elDes.textContent = despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (elSal) elSal.textContent = saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function excluirLancamento(id) {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    lancamentos = lancamentos.filter(l => l.id !== id);
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
    mostrarLancamentos();
}


// ==============================
// MATERIAIS E ESTOQUE
// ==============================

let materiais = JSON.parse(localStorage.getItem("materiais")) || [];

const btnNovoMaterial = document.getElementById("btnNovoMaterial");
const modalMaterial = document.getElementById("modalMaterial");
const fecharModalMaterial = document.getElementById("fecharModalMaterial");
const cancelarMaterial = document.getElementById("cancelarMaterial");
const salvarMaterial = document.getElementById("salvarMaterial");

if (btnNovoMaterial) btnNovoMaterial.addEventListener("click", () => modalMaterial.classList.remove("hidden"));
if (fecharModalMaterial) fecharModalMaterial.addEventListener("click", () => modalMaterial.classList.add("hidden"));
if (cancelarMaterial) cancelarMaterial.addEventListener("click", () => modalMaterial.classList.add("hidden"));

const precoMaterialInput = document.getElementById("precoMaterial");
if (precoMaterialInput) {
    precoMaterialInput.addEventListener("input", function() {
        let v = this.value.replace(/\D/g, "");
        if (v === "") { this.value = ""; return; }
        this.value = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    });
}

if (salvarMaterial) {
    salvarMaterial.addEventListener("click", function() {
        const nome = document.getElementById("nomeMaterial").value.trim();
        const categoria = document.getElementById("categoriaMaterial").value.trim();
        const unidade = document.getElementById("unidadeMaterial").value;
        const quantidade = document.getElementById("quantidadeMaterial").value;
        const precoTexto = document.getElementById("precoMaterial").value;

        if (nome === "") { alert("Digite o nome do material."); return; }
        if (quantidade === "") { alert("Digite a quantidade."); return; }

        const preco = precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();

        const material = {
            id: Date.now(),
            nome: nome,
            categoria: categoria,
            unidade: unidade,
            quantidade: Number(quantidade),
            preco: Number(preco) || 0
        };

        materiais.push(material);
        localStorage.setItem("materiais", JSON.stringify(materiais));
        modalMaterial.classList.add("hidden");
        limparFormularioMaterial();
        mostrarMateriais();
    });
}

function limparFormularioMaterial() {
    document.getElementById("nomeMaterial").value = "";
    document.getElementById("categoriaMaterial").value = "";
    document.getElementById("unidadeMaterial").value = "un";
    document.getElementById("quantidadeMaterial").value = "";
    document.getElementById("precoMaterial").value = "";
}

function mostrarMateriais() {
    const tabela = document.getElementById("listaMateriais");
    if (!tabela) return;

    tabela.innerHTML = "";
    const ordenados = [...materiais].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    ordenados.forEach(material => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${material.nome}</td>
            <td>${material.categoria || "-"}</td>
            <td>${material.quantidade}</td>
            <td>${material.unidade}</td>
            <td>${Number(material.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>
                <button class="secondary-button" onclick="excluirMaterial(${material.id})">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });

    atualizarTotalMateriais();
}

function atualizarTotalMateriais() {
    const el = document.getElementById("totalMateriais");
    if (el) el.textContent = materiais.length === 1 ? "1 material" : materiais.length + " materiais";
}

function excluirMaterial(id) {
    if (!confirm("Deseja realmente excluir este material?")) return;
    materiais = materiais.filter(m => m.id !== id);
    localStorage.setItem("materiais", JSON.stringify(materiais));
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
        preencherMateriaisCompra();
        modalCompra.classList.remove("hidden");
    });
}

if (fecharModalCompra) fecharModalCompra.addEventListener("click", () => modalCompra.classList.add("hidden"));
if (cancelarCompra) cancelarCompra.addEventListener("click", () => modalCompra.classList.add("hidden"));

function preencherMateriaisCompra() {
    const select = document.getElementById("materialCompra");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o material</option>';
    const ordenados = [...materiais].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    ordenados.forEach(material => {
        const option = document.createElement("option");
        option.value = material.id;
        option.textContent = material.nome;
        select.appendChild(option);
    });

    const optionOutros = document.createElement("option");
    optionOutros.value = "outros";
    optionOutros.textContent = "Outros";
    select.appendChild(optionOutros);
}

const valorCompra = document.getElementById("valorCompra");
if (valorCompra) {
    valorCompra.addEventListener("input", function() {
        let v = this.value.replace(/\D/g, "");
        if (v === "") { this.value = ""; return; }
        this.value = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
        const observacoes = document.getElementById("observacoesCompra").value.trim();

        if (nome === "") { alert("Digite o nome da compra."); return; }
        if (materialId === "") { alert("Selecione o material."); return; }
        if (quantidade === "" || Number(quantidade) <= 0) { alert("Digite uma quantidade válida."); return; }
        if (valorTexto === "") { alert("Digite o valor."); return; }

        const valor = Number(valorTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());

        if (isNaN(valor) || valor <= 0) {
            alert("Digite um valor válido.");
            return;
        }

        const compra = {
            id: Date.now(),
            nome: nome,
            fornecedor: fornecedor,
            materialId: materialId === "outros" ? "outros" : Number(materialId),
            quantidade: Number(quantidade),
            valor: valor,
            data: data,
            observacoes: observacoes
        };

        compras.push(compra);
        localStorage.setItem("compras", JSON.stringify(compras));

        // Atualizar Estoque
        if (materialId !== "outros") {
            const material = materiais.find(m => m.id === Number(materialId));
            if (material) {
                material.quantidade = Number(material.quantidade || 0) + Number(quantidade);
                localStorage.setItem("materiais", JSON.stringify(materiais));
            }
        }

        // Lançar Financeiro
        const novoLancamento = {
            id: Date.now() + 1,
            descricao: "Compra: " + nome,
            tipo: "despesa",
            valor: valor,
            data: data,
            obraId: "geral",
            observacoes: fornecedor ? "Fornecedor: " + fornecedor + (observacoes ? " | " + observacoes : "") : observacoes
        };

        lancamentos.push(novoLancamento);
        localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

        mostrarCompras();
        mostrarMateriais();
        mostrarLancamentos();

        modalCompra.classList.add("hidden");
        limparFormularioCompra();

        alert("Compra cadastrada!\n\n✓ Estoque atualizado\n✓ Despesa lançada no Financeiro");
    });
}

function limparFormularioCompra() {
    document.getElementById("nomeCompra").value = "";
    document.getElementById("fornecedorCompra").value = "";
    document.getElementById("materialCompra").value = "";
    document.getElementById("quantidadeCompra").value = "";
    document.getElementById("valorCompra").value = "";
    document.getElementById("dataCompra").value = "";
    document.getElementById("observacoesCompra").value = "";
}

function mostrarCompras(lista = compras) {
    const tabela = document.getElementById("listaCompras");
    if (!tabela) return;

    tabela.innerHTML = "";
    const ordenadas = [...lista].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
    );

    ordenadas.forEach(compra => {
        const material = materiais.find(m => m.id === Number(compra.materialId));
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${compra.nome}</td>
            <td>${compra.fornecedor || "-"}</td>
            <td>${material ? material.nome : "-"}</td>
            <td>${compra.quantidade}</td>
            <td>${Number(compra.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>${compra.data ? new Date(compra.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</td>
            <td><button class="secondary-button" onclick="excluirCompra(${compra.id})">Excluir</button></td>
        `;
        tabela.appendChild(linha);
    });

    atualizarTotalCompras();
}

function atualizarTotalCompras() {
    const el = document.getElementById("totalCompras");
    if (el) el.textContent = compras.length === 1 ? "1 compra" : compras.length + " compras";
}

function excluirCompra(id) {
    if (!confirm("Deseja realmente excluir esta compra?")) return;
    compras = compras.filter(c => c.id !== id);
    localStorage.setItem("compras", JSON.stringify(compras));
    mostrarCompras();
}


// ==============================
// AUTENTICAÇÃO E LOGIN
// ==============================

const usuarioCorreto = "ADM";
const senhaCorreta = "ADM";

const telaLogin = document.getElementById("telaLogin");
const loginUsuario = document.getElementById("loginUsuario");
const loginSenha = document.getElementById("loginSenha");
const btnLogin = document.getElementById("btnLogin");
const erroLogin = document.getElementById("erroLogin");

function fazerLogin() {
    if (!loginUsuario || !loginSenha) return;

    const usuario = loginUsuario.value.trim();
    const senha = loginSenha.value;

    if (usuario === usuarioCorreto && senha === senhaCorreta) {
        localStorage.setItem("gestorObraLogado", "true");
        telaLogin.classList.add("hidden");

        pages.forEach(p => p.classList.add("hidden"));
        document.getElementById("page-dashboard").classList.remove("hidden");

        menuItems.forEach(m => m.classList.remove("active"));
        const dashMenu = document.querySelector('[data-page="dashboard"]');
        if (dashMenu) dashMenu.classList.add("active");

        if (erroLogin) erroLogin.classList.add("hidden");
        loginUsuario.value = "";
        loginSenha.value = "";
    } else {
        if (erroLogin) erroLogin.classList.remove("hidden");
        loginSenha.value = "";
        loginSenha.focus();
    }
}

if (btnLogin) btnLogin.addEventListener("click", fazerLogin);

if (loginSenha) {
    loginSenha.addEventListener("keydown", function(event) {
        if (event.key === "Enter") fazerLogin();
    });
}

if (localStorage.getItem("gestorObraLogado") === "true") {
    if (telaLogin) telaLogin.classList.add("hidden");
} else {
    if (telaLogin) telaLogin.classList.remove("hidden");
}

const btnSair = document.getElementById("btnSair");
if (btnSair) {
    btnSair.addEventListener("click", function(event) {
        event.preventDefault();
        localStorage.removeItem("gestorObraLogado");
        if (telaLogin) telaLogin.classList.remove("hidden");
        if (loginUsuario) loginUsuario.value = "";
        if (loginSenha) loginSenha.value = "";
    });
}


// ==============================
// INICIALIZAÇÃO DAS LISTAS
// ==============================

mostrarClientes();
mostrarObras();
mostrarContratos();
mostrarLancamentos();
mostrarMateriais();
mostrarCompras();
