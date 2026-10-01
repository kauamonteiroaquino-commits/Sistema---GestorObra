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


// Abrir cadastro
btnNovoCliente.addEventListener("click", function() {
    modalCliente.classList.remove("hidden");
});


// Fechar no X
fecharModal.addEventListener("click", function() {
    modalCliente.classList.add("hidden");
});


// Fechar no Cancelar
cancelarCliente.addEventListener("click", function() {
    modalCliente.classList.add("hidden");
});


// ==============================
// SALVAR CLIENTE
// ==============================

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

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

    // ==============================
    // EDITANDO CLIENTE
    // ==============================

    if (clienteEditandoId !== null) {

        const cliente = clientes.find(
            cliente => cliente.id === clienteEditandoId
        );

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

        // Volta para a ficha do cliente
        abrirCliente(cliente.id);

        return;
    }


    // ==============================
    // NOVO CLIENTE
    // ==============================

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

// ==============================
// MOSTRAR CLIENTES
// ==============================

function mostrarClientes() {

    const tabela = document.getElementById("listaClientes");

    tabela.innerHTML = "";

    const clientesOrdenados = [...clientes].sort((a, b) =>
        String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR",
            { sensitivity: "base" }
        )
    );

    clientesOrdenados.forEach(cliente => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                <button
                    class="cliente-link"
                    onclick="abrirCliente(${cliente.id})">
                    ${cliente.nome}
                </button>
            </td>

            <td>${cliente.telefone}</td>

            <td>${cliente.documento}</td>

            <td>${cliente.endereco}</td>

            <td>
                <button
                    class="secondary-button"
                    onclick="excluirCliente(${cliente.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalClientes();
}

// ==============================
// EXCLUIR CLIENTE
// ==============================

function excluirCliente(id) {

    const obrasVinculadas = obras.filter(
        obra => obra.clienteId === id
    );

    if (obrasVinculadas.length > 0) {

        alert(
            "Não é possível excluir este cliente porque existem " +
            obrasVinculadas.length +
            " obra(s) vinculada(s) a ele."
        );

        return;
    }

    if (!confirm("Deseja realmente excluir este cliente?")) {
        return;
    }

    clientes = clientes.filter(
        cliente => cliente.id !== id
    );

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

    mostrarClientes();
}

// ==============================
// CONTADOR
// ==============================

function atualizarTotalClientes() {

    const total = clientes.length;

    document.getElementById("totalClientes").textContent =
        total === 1 ? "1 cliente" : total + " clientes";
}


// ==============================
// LIMPAR FORMULÁRIO
// ==============================

function limparFormularioCliente() {

    document.getElementById("nomeCliente").value = "";
    document.getElementById("telefoneCliente").value = "";
    document.getElementById("documentoCliente").value = "";
    document.getElementById("enderecoCliente").value = "";
    document.getElementById("observacoesCliente").value = "";

}


// ==============================
// TELEFONE AUTOMÁTICO
// ==============================

const telefoneInput = document.getElementById("telefoneCliente");

telefoneInput.addEventListener("input", function() {

    let numero = this.value.replace(/\D/g, "");

    if (numero.length > 11) {
        numero = numero.substring(0, 11);
    }

    if (numero.length <= 10) {

        numero = numero.replace(
            /^(\d{2})(\d{0,4})(\d{0,4}).*/,
            function(_, ddd, parte1, parte2) {

                let resultado = "";

                if (ddd) resultado = "(" + ddd;
                if (ddd.length === 2) resultado += ") ";
                if (parte1) resultado += parte1;
                if (parte2) resultado += "-" + parte2;

                return resultado;
            }
        );

    } else {

        numero = numero.replace(
            /^(\d{2})(\d{5})(\d{0,4}).*/,
            function(_, ddd, parte1, parte2) {

                let resultado = "(" + ddd + ") " + parte1;

                if (parte2) {
                    resultado += "-" + parte2;
                }

                return resultado;
            }
        );
    }

    this.value = numero;

});


// ==============================
// CPF / CNPJ AUTOMÁTICO
// ==============================

const documentoInput = document.getElementById("documentoCliente");

documentoInput.addEventListener("input", function() {

    let numero = this.value.replace(/\D/g, "");

    if (numero.length > 14) {
        numero = numero.substring(0, 14);
    }

    if (numero.length <= 11) {

        numero = numero.replace(
            /^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2}).*/,
            function(_, p1, p2, p3, p4) {

                let resultado = p1;

                if (p2) resultado += "." + p2;
                if (p3) resultado += "." + p3;
                if (p4) resultado += "-" + p4;

                return resultado;
            }
        );

    } else {

        numero = numero.replace(
            /^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/,
            function(_, p1, p2, p3, p4, p5) {

                let resultado = p1;

                if (p2) resultado += "." + p2;
                if (p3) resultado += "." + p3;
                if (p4) resultado += "/" + p4;
                if (p5) resultado += "-" + p5;

                return resultado;
            }
        );
    }

    this.value = numero;

});


// ==============================
// CARREGAR CLIENTES
// ==============================

mostrarClientes();
// ==============================
// PESQUISAR CLIENTES
// ==============================

const pesquisaCliente = document.getElementById("pesquisaCliente");

pesquisaCliente.addEventListener("input", function() {

    const pesquisa = this.value.toLowerCase().trim();

    const tabela = document.getElementById("listaClientes");

    const linhas = tabela.querySelectorAll("tr");

    linhas.forEach(linha => {

        const texto = linha.textContent.toLowerCase();

        if (texto.includes(pesquisa)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }

    });

});

// ==============================
// ABRIR FICHA DO CLIENTE
// ==============================

function abrirCliente(id) {

    const cliente = clientes.find(cliente => cliente.id === id);

    if (!cliente) {
        return;
    }

    // Esconde todas as páginas
    pages.forEach(page => {
        page.classList.add("hidden");
    });

    // Mostra a ficha
    document.getElementById("page-ficha-cliente").classList.remove("hidden");

    // Preenche os dados
    document.getElementById("fichaNomeCliente").textContent = cliente.nome;
    document.getElementById("fichaTelefone").textContent = cliente.telefone || "-";
    document.getElementById("fichaDocumento").textContent = cliente.documento || "-";
    document.getElementById("fichaEndereco").textContent = cliente.endereco || "-";
    document.getElementById("fichaObservacoes").textContent =
        cliente.observacoes || "Nenhuma observação.";
        const obrasCliente = obras.filter(
    obra => obra.clienteId === cliente.id
);

const containerObras = document.getElementById("obrasDoCliente");

containerObras.innerHTML = "";

if (obrasCliente.length === 0) {

    containerObras.innerHTML = `
        <p>Nenhuma obra cadastrada para este cliente.</p>
    `;

} else {

obrasCliente.forEach(obra => {

    const obraDiv = document.createElement("div");

    obraDiv.innerHTML = `
        <div style="margin-bottom: 18px;">

            <button
                class="cliente-link"
                onclick="abrirObra(${obra.id})">
                🏗️ ${obra.nome}
            </button>

            <p style="margin: 6px 0; color: #94a3b8;">
                📍 ${obra.endereco || "Endereço não informado"}
            </p>

            <p style="margin: 6px 0; color: #94a3b8;">
                💰 ${Number(obra.valor || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })}
            </p>

            <p style="margin: 6px 0; color: #94a3b8;">
                📅 ${
                    obra.dataInicio
                        ? new Date(obra.dataInicio + "T00:00:00")
                            .toLocaleDateString("pt-BR")
                        : "Data não informada"
                }
            </p>

        </div>
    `;

    containerObras.appendChild(obraDiv);

});
const contratosCliente = contratos.filter(contrato => {

    const obra = obras.find(
        obra => obra.id === contrato.obraId
    );

    return obra && obra.clienteId === cliente.id;

});

const containerContratos =
    document.getElementById("contratosDoCliente");

containerContratos.innerHTML = "";

if (contratosCliente.length === 0) {

    containerContratos.innerHTML = `
        <p>Nenhum contrato cadastrado para este cliente.</p>
    `;

} else {

    contratosCliente.forEach(contrato => {

        const obra = obras.find(
            obra => obra.id === contrato.obraId
        );

        const contratoDiv = document.createElement("div");

        contratoDiv.innerHTML = `
            <div style="margin-bottom: 18px;">

                <button
                    class="cliente-link"
                    onclick="abrirContrato(${contrato.id})">
                    📄 ${contrato.nome}
                </button>

                <p style="margin: 6px 0; color: #94a3b8;">
                    🏗️ ${obra ? obra.nome : "Obra não encontrada"}
                </p>

                <p style="margin: 6px 0; color: #94a3b8;">
                    💰 ${Number(contrato.valor || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    })}
                </p>

            </div>
        `;

        containerContratos.appendChild(contratoDiv);

    });

}
}
}
// ==============================
// VOLTAR PARA CLIENTES
// ==============================

const voltarClientes = document.getElementById("voltarClientes");

voltarClientes.addEventListener("click", function() {

    // Esconde a ficha
    document.getElementById("page-ficha-cliente").classList.add("hidden");

    // Mostra a tela de clientes
    document.getElementById("page-clientes").classList.remove("hidden");

});

// ==============================
// EDITAR CLIENTE
// ==============================

let clienteEditandoId = null;

editarCliente.addEventListener("click", function() {

    const nome = document.getElementById("fichaNomeCliente").textContent;

    const cliente = clientes.find(cliente => cliente.nome === nome);

    if (!cliente) {
        return;
    }

    clienteEditandoId = cliente.id;

    // Preenche o formulário
    document.getElementById("nomeCliente").value = cliente.nome;
    document.getElementById("telefoneCliente").value = cliente.telefone;
    document.getElementById("documentoCliente").value = cliente.documento;
    document.getElementById("enderecoCliente").value = cliente.endereco;
    document.getElementById("observacoesCliente").value = cliente.observacoes;

    // Muda o título
    document.querySelector("#modalCliente h2").textContent = "Editar cliente";

    // Muda o botão
    salvarCliente.textContent = "Salvar alterações";

    // Vai para a tela de clientes
    document.getElementById("page-ficha-cliente").classList.add("hidden");
    document.getElementById("page-clientes").classList.remove("hidden");

    // Abre o formulário
    modalCliente.classList.remove("hidden");

});

// ==============================
// OBRAS - ABRIR MODAL
// ==============================

const btnNovaObra = document.getElementById("btnNovaObra");
const modalObra = document.getElementById("modalObra");
const fecharModalObra = document.getElementById("fecharModalObra");
const cancelarObra = document.getElementById("cancelarObra");
const clienteObra = document.getElementById("clienteObra");


// Abrir formulário
btnNovaObra.addEventListener("click", function() {

    carregarClientesNaObra();

    modalObra.classList.remove("hidden");

});


// Fechar no X
fecharModalObra.addEventListener("click", function() {

    modalObra.classList.add("hidden");

});


// Fechar no Cancelar
cancelarObra.addEventListener("click", function() {

    modalObra.classList.add("hidden");

});


// ==============================
// CARREGAR CLIENTES
// ==============================

function carregarClientesNaObra() {

    clienteObra.innerHTML = `
        <option value="">Selecione o cliente</option>
    `;

    clientes.forEach(cliente => {

        const option = document.createElement("option");

        option.value = cliente.id;
        option.textContent = cliente.nome;

        clienteObra.appendChild(option);

    });

}

// ==============================
// SALVAR OBRA
// ==============================

let obras = JSON.parse(localStorage.getItem("obras")) || [];

const salvarObra = document.getElementById("salvarObra");

salvarObra.addEventListener("click", function() {

    const nome = document.getElementById("nomeObra").value.trim();
    const clienteId = document.getElementById("clienteObra").value;
    const endereco = document.getElementById("enderecoObra").value.trim();
    const dataInicio = document.getElementById("dataInicioObra").value;
   const valorTexto = document.getElementById("valorObra").value;

const valor = valorTexto
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
    const observacoes = document.getElementById("observacoesObra").value.trim();

    if (nome === "") {
        alert("Digite o nome da obra.");
        return;
    }

    if (clienteId === "") {
        alert("Selecione o cliente.");
        return;
    }

    const cliente = clientes.find(
        cliente => cliente.id === Number(clienteId)
    );

  const obra = {
    id: Date.now(),
    nome: nome,
    clienteId: Number(clienteId),
    endereco: endereco,
    dataInicio: dataInicio,
    valor: valor,
    observacoes: observacoes
};

    obras.push(obra);

    localStorage.setItem("obras", JSON.stringify(obras));

    modalObra.classList.add("hidden");

    limparFormularioObra();

    mostrarObras();

});

// ==============================
// LIMPAR FORMULÁRIO DA OBRA
// ==============================

function limparFormularioObra() {

    document.getElementById("nomeObra").value = "";
    document.getElementById("clienteObra").value = "";
    document.getElementById("enderecoObra").value = "";
    document.getElementById("dataInicioObra").value = "";
    document.getElementById("valorObra").value = "";
    document.getElementById("observacoesObra").value = "";

}

// ==============================
// MOSTRAR OBRAS
// ==============================

function mostrarObras() {

    const tabela = document.getElementById("listaObras");

    tabela.innerHTML = "";

    const obrasOrdenadas = [...obras].sort((a, b) =>
        String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR",
            { sensitivity: "base" }
        )
    );

    obrasOrdenadas.forEach(obra => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                <button
                    class="cliente-link"
                    onclick="abrirObra(${obra.id})">
                    ${obra.nome}
                </button>
            </td>

            <td>
                ${
                    clientes.find(
                        cliente => cliente.id === obra.clienteId
                    )?.nome || "-"
                }
            </td>

            <td>
                ${obra.endereco || "-"}
            </td>

            <td>
                ${
                    Number(obra.valor || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    })
                }
            </td>

            <td>
                <button
                    class="secondary-button"
                    onclick="excluirObra(${obra.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalObras();
}
// ==============================
// CONTADOR DE OBRAS
// ==============================

function atualizarTotalObras() {

    const total = obras.length;

    document.getElementById("totalObras").textContent =
        total === 1 ? "1 obra" : total + " obras";
}

// ==============================
// EXCLUIR OBRA
// ==============================

function excluirObra(id) {

    if (!confirm("Deseja realmente excluir esta obra?")) {
        return;
    }

    obras = obras.filter(obra => obra.id !== id);

    localStorage.setItem("obras", JSON.stringify(obras));

    mostrarObras();
}

// ==============================
// CARREGAR OBRAS
// ==============================

mostrarObras();

// ==============================
// VALOR DA OBRA - FORMATAÇÃO
// ==============================

const valorObraInput = document.getElementById("valorObra");

valorObraInput.addEventListener("input", function() {

    let valor = this.value.replace(/\D/g, "");

    if (valor === "") {
        this.value = "";
        return;
    }

    valor = (Number(valor) / 100).toFixed(2);

    valor = Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    this.value = valor;

});

// ==============================
// PESQUISAR OBRAS
// ==============================

const pesquisaObra = document.getElementById("pesquisaObra");

pesquisaObra.addEventListener("input", function() {

    const pesquisa = this.value.toLowerCase().trim();

    const tabela = document.getElementById("listaObras");

    const linhas = tabela.querySelectorAll("tr");

    linhas.forEach(linha => {

        const texto = linha.textContent.toLowerCase();

        if (texto.includes(pesquisa)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }

    });

});

// ==============================
// ABRIR FICHA DA OBRA
// ==============================

function abrirObra(id) {

    const obra = obras.find(obra => obra.id === id);

    if (!obra) {
        return;
    }

    // Esconde todas as páginas
    pages.forEach(page => {
        page.classList.add("hidden");
    });

    // Mostra a ficha da obra
    document.getElementById("page-ficha-obra").classList.remove("hidden");

    // Preenche os dados
    document.getElementById("fichaNomeObra").textContent =
        obra.nome;

   const cliente = clientes.find(
    cliente => cliente.id === obra.clienteId
);

const fichaCliente = document.getElementById("fichaClienteObra");

if (cliente) {

    fichaCliente.innerHTML = `
        <button
            class="cliente-link"
            onclick="abrirCliente(${cliente.id})">
            ${cliente.nome}
        </button>
    `;

} else {

    fichaCliente.textContent = "-";

}

    document.getElementById("fichaEnderecoObra").textContent =
        obra.endereco || "-";

    document.getElementById("fichaDataObra").textContent =
        obra.dataInicio
            ? new Date(obra.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
            : "-";

    document.getElementById("fichaValorObra").textContent =
        Number(obra.valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("fichaObservacoesObra").textContent =
        obra.observacoes || "Nenhuma observação.";

}
// ==============================
// VOLTAR PARA OBRAS
// ==============================

const voltarObras = document.getElementById("voltarObras");

voltarObras.addEventListener("click", function() {

    document.getElementById("page-ficha-obra").classList.add("hidden");

    document.getElementById("page-obras").classList.remove("hidden");

});

// ==============================
// CONTRATOS - ABRIR MODAL
// ==============================

const btnNovoContrato = document.getElementById("btnNovoContrato");
const modalContrato = document.getElementById("modalContrato");
const fecharModalContrato = document.getElementById("fecharModalContrato");
const cancelarContrato = document.getElementById("cancelarContrato");
const obraContrato = document.getElementById("obraContrato");

btnNovoContrato.addEventListener("click", function() {

    carregarObrasNoContrato();

    modalContrato.classList.remove("hidden");

});

fecharModalContrato.addEventListener("click", function() {

    modalContrato.classList.add("hidden");

});

cancelarContrato.addEventListener("click", function() {

    modalContrato.classList.add("hidden");

});


// ==============================
// CARREGAR OBRAS NO CONTRATO
// ==============================

function carregarObrasNoContrato() {

    obraContrato.innerHTML = `
        <option value="">
            Selecione a obra
        </option>
    `;

    obras.forEach(obra => {

        const option = document.createElement("option");

        option.value = obra.id;
        option.textContent = obra.nome;

        obraContrato.appendChild(option);

    });

}

// ==============================
// FORMATAÇÃO DO VALOR DO CONTRATO
// ==============================

const valorContratoInput = document.getElementById("valorContrato");

valorContratoInput.addEventListener("input", function() {

    let valor = this.value.replace(/\D/g, "");

    if (valor === "") {
        this.value = "";
        return;
    }

    valor = (Number(valor) / 100).toFixed(2);

    valor = Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    this.value = valor;

});

// ==============================
// SALVAR CONTRATO
// ==============================

let contratos = JSON.parse(localStorage.getItem("contratos")) || [];

const salvarContrato = document.getElementById("salvarContrato");

salvarContrato.addEventListener("click", function() {

    const nome = document.getElementById("nomeContrato").value.trim();
    const obraId = document.getElementById("obraContrato").value;
    const data = document.getElementById("dataContrato").value;
    const valorTexto = document.getElementById("valorContrato").value;
    const observacoes = document.getElementById("observacoesContrato").value.trim();

    if (nome === "") {
        alert("Digite o nome do contrato.");
        return;
    }

    

    const valor = valorTexto
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    // EDITAR CONTRATO
    if (contratoEditandoId !== null) {

        const contrato = contratos.find(
            contrato => contrato.id === contratoEditandoId
        );

        contrato.nome = nome;
        contrato.obraId = Number(obraId);
        contrato.data = data;
        contrato.valor = valor;
        contrato.observacoes = observacoes;

        localStorage.setItem(
            "contratos",
            JSON.stringify(contratos)
        );

        contratoEditandoId = null;

    } else {

        // NOVO CONTRATO
        const contrato = {
            id: Date.now(),
            nome: nome,
            obraId: Number(obraId),
            data: data,
            valor: valor,
            observacoes: observacoes
        };

        contratos.push(contrato);

        localStorage.setItem(
            "contratos",
            JSON.stringify(contratos)
        );

    }

    modalContrato.classList.add("hidden");

    limparFormularioContrato();

    mostrarContratos();

    document.querySelector("#modalContrato h2").textContent =
        "Novo contrato";

    salvarContrato.textContent =
        "Salvar contrato";

});

// ==============================
// LIMPAR FORMULÁRIO DO CONTRATO
// ==============================

function limparFormularioContrato() {

    document.getElementById("nomeContrato").value = "";
    document.getElementById("obraContrato").value = "";
    document.getElementById("dataContrato").value = "";
    document.getElementById("valorContrato").value = "";
    document.getElementById("observacoesContrato").value = "";

}

// ==============================
// MOSTRAR CONTRATOS
// ==============================

function mostrarContratos(lista = contratos) {

    const tabela = document.getElementById("listaContratos");

    tabela.innerHTML = "";

    const contratosOrdenados = [...lista].sort((a, b) =>
        String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR",
            { sensitivity: "base" }
        )
    );

    contratosOrdenados.forEach(contrato => {

        const obra = obras.find(
            obra => obra.id === contrato.obraId
        );

        const cliente = obra
            ? clientes.find(
                cliente => cliente.id === obra.clienteId
            )
            : null;

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                <button
                    class="cliente-link"
                    onclick="abrirContrato(${contrato.id})">
                    ${contrato.nome}
                </button>
            </td>

            <td>
                ${obra ? obra.nome : "-"}
            </td>

            <td>
                ${cliente ? cliente.nome : "-"}
            </td>

            <td>
                ${Number(contrato.valor || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })}
            </td>

            <td>
                <button
                    class="secondary-button"
                    onclick="excluirContrato(${contrato.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalContratos();
}

// ==============================
// PESQUISA DE CONTRATOS
// ==============================

const pesquisaContrato =
    document.getElementById("pesquisaContrato");

pesquisaContrato.addEventListener("input", function() {

    const pesquisa = this.value.toLowerCase().trim();

    const contratosFiltrados = contratos.filter(contrato => {

        const obra = obras.find(
            obra => obra.id === contrato.obraId
        );

        const cliente = obra
            ? clientes.find(
                cliente => cliente.id === obra.clienteId
            )
            : null;

        return (
            String(contrato.nome || "")
                .toLowerCase()
                .includes(pesquisa) ||

            String(obra?.nome || "")
                .toLowerCase()
                .includes(pesquisa) ||

            String(cliente?.nome || "")
                .toLowerCase()
                .includes(pesquisa)
        );
    });

    mostrarContratos(contratosFiltrados);
});


// ==============================
// TOTAL DE CONTRATOS
// ==============================

function atualizarTotalContratos() {

    const total = contratos.length;

    document.getElementById("totalContratos").textContent =
        total === 1
            ? "1 contrato"
            : total + " contratos";
}

// ==============================
// EXCLUIR CONTRATO
// ==============================

function excluirContrato(id) {

    if (!confirm("Deseja realmente excluir este contrato?")) {
        return;
    }

    contratos = contratos.filter(
        contrato => contrato.id !== id
    );

    localStorage.setItem(
        "contratos",
        JSON.stringify(contratos)
    );

    mostrarContratos();
}
mostrarContratos();

// ==============================
// ABRIR FICHA DO CONTRATO
// ==============================

function abrirContrato(id) {

    const contrato = contratos.find(
        contrato => contrato.id === id
    );

    if (!contrato) {
        return;
    }
    contratoEditandoId = contrato.id;

    pages.forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById("page-ficha-contrato").classList.remove("hidden");

    document.getElementById("fichaNomeContrato").textContent =
        contrato.nome;

    const obra = obras.find(
        obra => obra.id === contrato.obraId
    );

    const cliente = obra
        ? clientes.find(cliente => cliente.id === obra.clienteId)
        : null;

    document.getElementById("fichaObraContrato").innerHTML =
        obra
            ? `<button
                    class="cliente-link"
                    onclick="abrirObra(${obra.id})">
                    ${obra.nome}
               </button>`
            : "-";

    document.getElementById("fichaClienteContrato").innerHTML =
        cliente
            ? `<button
                    class="cliente-link"
                    onclick="abrirCliente(${cliente.id})">
                    ${cliente.nome}
               </button>`
            : "-";

    document.getElementById("fichaDataContrato").textContent =
        contrato.data
            ? new Date(
                contrato.data + "T00:00:00"
            ).toLocaleDateString("pt-BR")
            : "-";

    document.getElementById("fichaValorContrato").textContent =
        Number(contrato.valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("fichaObservacoesContrato").textContent =
        contrato.observacoes || "Nenhuma observação.";
}

// ==============================
// VOLTAR PARA CONTRATOS
// ==============================

const voltarContratos = document.getElementById("voltarContratos");

voltarContratos.addEventListener("click", function() {

    document.getElementById("page-ficha-contrato").classList.add("hidden");

    document.getElementById("page-contratos").classList.remove("hidden");

});

// ==============================
// EDITAR CONTRATO
// ==============================

let contratoEditandoId = null;

const editarContrato = document.getElementById("editarContrato");

editarContrato.addEventListener("click", function() {

    const contrato = contratos.find(
        contrato => contrato.id === contratoEditandoId
    );

    if (!contrato) {
        return;
    }

    carregarObrasNoContrato();

    document.getElementById("nomeContrato").value =
        contrato.nome;

    document.getElementById("obraContrato").value =
        contrato.obraId;

    document.getElementById("dataContrato").value =
        contrato.data;

    document.getElementById("valorContrato").value =
        Number(contrato.valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("observacoesContrato").value =
        contrato.observacoes || "";

    document.querySelector("#modalContrato h2").textContent =
        "Editar contrato";

    document.getElementById("salvarContrato").textContent =
        "Salvar alterações";

    document.getElementById("page-ficha-contrato").classList.add("hidden");

    document.getElementById("page-contratos").classList.remove("hidden");

    modalContrato.classList.remove("hidden");

});

const btnNovoLancamento = document.getElementById("btnNovoLancamento");

const modalLancamento = document.getElementById("modalLancamento");

const fecharModalLancamento =
    document.getElementById("fecharModalLancamento");

const cancelarLancamento =
    document.getElementById("cancelarLancamento");


btnNovoLancamento.addEventListener("click", function() {

    carregarObrasNoLancamento();

    modalLancamento.classList.remove("hidden");

});


fecharModalLancamento.addEventListener("click", function() {

    modalLancamento.classList.add("hidden");

});


cancelarLancamento.addEventListener("click", function() {

    modalLancamento.classList.add("hidden");

});

const valorLancamentoInput =
    document.getElementById("valorLancamento");

valorLancamentoInput.addEventListener("input", function() {

    let valor = this.value.replace(/\D/g, "");

    if (valor === "") {
        this.value = "";
        return;
    }

    valor = (Number(valor) / 100).toFixed(2);

    valor = Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    this.value = valor;

});

const obraLancamento =
    document.getElementById("obraLancamento");

function carregarObrasNoLancamento() {

    obraLancamento.innerHTML = `
    <option value="geral">
        🏢 Geral / Caixa
    </option>
`;

    obras.forEach(obra => {

        const option = document.createElement("option");

        option.value = obra.id;
        option.textContent = obra.nome;

        obraLancamento.appendChild(option);

    });

}

let lancamentos = JSON.parse(
    localStorage.getItem("lancamentos")
) || [];

const salvarLancamento =
    document.getElementById("salvarLancamento");


salvarLancamento.addEventListener("click", function() {

    const descricao =
        document.getElementById("descricaoLancamento").value.trim();

    const tipo =
        document.getElementById("tipoLancamento").value;

    const obraId =
        document.getElementById("obraLancamento").value;

    const data =
        document.getElementById("dataLancamento").value;

    const valorTexto =
        document.getElementById("valorLancamento").value;

    const observacoes =
        document.getElementById("observacoesLancamento").value.trim();


    if (descricao === "") {
        alert("Digite a descrição do lançamento.");
        return;
    }


    if (obraId === "") {
        alert("Selecione a obra.");
        return;
    }


    if (valorTexto === "") {
        alert("Digite o valor.");
        return;
    }


    const valor = valorTexto
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();


    const lancamento = {

        id: Date.now(),

        descricao: descricao,

        tipo: tipo,

        obraId: Number(obraId),

        data: data,

        valor: valor,

        observacoes: observacoes

    };


    lancamentos.push(lancamento);


    localStorage.setItem(
        "lancamentos",
        JSON.stringify(lancamentos)
    );


    modalLancamento.classList.add("hidden");


    limparFormularioLancamento();

    mostrarLancamentos();

});

function limparFormularioLancamento() {

    document.getElementById("descricaoLancamento").value = "";

    document.getElementById("tipoLancamento").value = "receita";

    document.getElementById("obraLancamento").value = "";

    document.getElementById("dataLancamento").value = "";

    document.getElementById("valorLancamento").value = "";

    document.getElementById("observacoesLancamento").value = "";

}

 function mostrarLancamentos(lista = lancamentos) {

    const tabela =
        document.getElementById("listaLancamentos");

    tabela.innerHTML = "";

    // Ordenar lançamentos por descrição A → Z
    const lancamentosOrdenados = [...lista].sort((a, b) =>
        String(a.descricao || "").localeCompare(
            String(b.descricao || ""),
            "pt-BR",
            { sensitivity: "base" }
        )
    );

    lancamentosOrdenados.forEach(lancamento => {

        const obra = obras.find(
            obra => obra.id === Number(lancamento.obraId)
        );

        const cliente = obra
            ? clientes.find(
                cliente => cliente.id === obra.clienteId
            )
            : null;

        let destino = "🏢 Geral / Caixa";

        if (
            lancamento.obraId !== "geral" &&
            lancamento.obraId !== "" &&
            obra
        ) {
            destino = "🏗️ " + obra.nome;
        }

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                ${lancamento.descricao}
            </td>

            <td>
                ${
                    lancamento.tipo === "receita"
                        ? "Receita"
                        : "Despesa"
                }
            </td>

            <td>
                ${destino}
            </td>

            <td>
                ${cliente ? cliente.nome : "-"}
            </td>

            <td>
                ${
                    Number(lancamento.valor || 0)
                        .toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                        })
                }
            </td>

            <td>
                ${
                    lancamento.data
                        ? new Date(
                            lancamento.data + "T00:00:00"
                        ).toLocaleDateString("pt-BR")
                        : "-"
                }
            </td>

            <td>
                <button
                    class="secondary-button"
                    onclick="excluirLancamento(${lancamento.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalLancamentos();
}


// ==============================
// PESQUISAR LANÇAMENTOS
// ==============================

const pesquisaLancamento =
    document.getElementById("pesquisaLancamento");

pesquisaLancamento.addEventListener("input", function() {

    const pesquisa =
        this.value.toLowerCase().trim();

    const lancamentosFiltrados =
        lancamentos.filter(lancamento => {

            const obra = obras.find(
                obra => obra.id === Number(lancamento.obraId)
            );

            const cliente = obra
                ? clientes.find(
                    cliente => cliente.id === obra.clienteId
                )
                : null;

            return (
                String(lancamento.descricao || "")
                    .toLowerCase()
                    .includes(pesquisa) ||

                String(lancamento.tipo || "")
                    .toLowerCase()
                    .includes(pesquisa) ||

                String(obra?.nome || "")
                    .toLowerCase()
                    .includes(pesquisa) ||

                String(cliente?.nome || "")
                    .toLowerCase()
                    .includes(pesquisa)
            );
        });

    // A pesquisa também fica em ordem A → Z
    mostrarLancamentos(lancamentosFiltrados);
});


// ==============================
// ATUALIZAR TOTAL FINANCEIRO
// ==============================

function atualizarTotalLancamentos() {

    const total = lancamentos.length;

    document.getElementById("totalLancamentos").textContent =
        total === 1
            ? "1 lançamento"
            : total + " lançamentos";


    let receitas = 0;
    let despesas = 0;


    lancamentos.forEach(lancamento => {

        const valor =
            Number(lancamento.valor || 0);


        if (lancamento.tipo === "receita") {
            receitas += valor;
        }


        if (lancamento.tipo === "despesa") {
            despesas += valor;
        }

    });


    const saldo =
        receitas - despesas;


    document.getElementById("totalReceitas").textContent =
        receitas.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });


    document.getElementById("totalDespesas").textContent =
        despesas.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });


    document.getElementById("saldoFinanceiro").textContent =
        saldo.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}
function excluirLancamento(id) {

    if (!confirm("Deseja realmente excluir este lançamento?")) {
        return;
    }

    lancamentos = lancamentos.filter(
        lancamento => lancamento.id !== id
    );

    localStorage.setItem(
        "lancamentos",
        JSON.stringify(lancamentos)
    );

    mostrarLancamentos();
   

}
function atualizarResumoFinanceiro() {

    let receitas = 0;
    let despesas = 0;

    lancamentos.forEach(lancamento => {

        const valor = Number(lancamento.valor || 0);

        if (lancamento.tipo === "receita") {
            receitas += valor;
        }

        if (lancamento.tipo === "despesa") {
            despesas += valor;
        }

    });

    const saldo = receitas - despesas;

    document.getElementById("totalReceitas").textContent =
        receitas.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("totalDespesas").textContent =
        despesas.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("saldoFinanceiro").textContent =
        saldo.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

}
mostrarLancamentos();

const btnNovoMaterial = document.getElementById("btnNovoMaterial");
const modalMaterial = document.getElementById("modalMaterial");
const fecharModalMaterial = document.getElementById("fecharModalMaterial");
const cancelarMaterial = document.getElementById("cancelarMaterial");

btnNovoMaterial.addEventListener("click", function() {
    modalMaterial.classList.remove("hidden");
});

fecharModalMaterial.addEventListener("click", function() {
    modalMaterial.classList.add("hidden");
});

cancelarMaterial.addEventListener("click", function() {
    modalMaterial.classList.add("hidden");
});

let materiais = JSON.parse(
    localStorage.getItem("materiais")
) || [];

const salvarMaterial =
    document.getElementById("salvarMaterial");

    const precoMaterialInput =
    document.getElementById("precoMaterial");

precoMaterialInput.addEventListener("input", function() {

    let valor = this.value.replace(/\D/g, "");

    if (valor === "") {
        this.value = "";
        return;
    }

    valor = (Number(valor) / 100).toFixed(2);

    this.value = Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
});

salvarMaterial.addEventListener("click", function() {

    const nome =
        document.getElementById("nomeMaterial").value.trim();

    const categoria =
        document.getElementById("categoriaMaterial").value.trim();

    const unidade =
        document.getElementById("unidadeMaterial").value;

    const quantidade =
        document.getElementById("quantidadeMaterial").value;

    const precoTexto =
        document.getElementById("precoMaterial").value;

    if (nome === "") {
        alert("Digite o nome do material.");
        return;
    }

    if (quantidade === "") {
        alert("Digite a quantidade.");
        return;
    }

    if (precoTexto === "") {
        alert("Digite o preço.");
        return;
    }

    const preco = precoTexto
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    const material = {
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        unidade: unidade,
        quantidade: Number(quantidade),
        preco: Number(preco)
    };

    materiais.push(material);

    localStorage.setItem(
        "materiais",
        JSON.stringify(materiais)
    );

    modalMaterial.classList.add("hidden");

    limparFormularioMaterial();

    mostrarMateriais();
});

function limparFormularioMaterial() {

    document.getElementById("nomeMaterial").value = "";
    document.getElementById("categoriaMaterial").value = "";
    document.getElementById("unidadeMaterial").value = "un";
    document.getElementById("quantidadeMaterial").value = "";
    document.getElementById("precoMaterial").value = "";
}

// ==============================
// MOSTRAR MATERIAIS
// ==============================

function mostrarMateriais() {

    const tabela =
        document.getElementById("listaMateriais");

    tabela.innerHTML = "";

    const materiaisOrdenados = [...materiais].sort((a, b) =>
        String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR",
            { sensitivity: "base" }
        )
    );

    materiaisOrdenados.forEach(material => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                ${material.nome}
            </td>

            <td>
                ${material.categoria || "-"}
            </td>

            <td>
                ${material.quantidade}
            </td>

            <td>
                ${material.unidade}
            </td>

            <td>
                ${
                    Number(material.preco || 0)
                        .toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                        })
                }
            </td>

           <td>

    <button
        class="secondary-button"
        onclick="abrirSaidaMaterial(${material.id})">
        ➖ Saída
    </button>

    <button
        class="secondary-button"
        onclick="excluirMaterial(${material.id})">
        Excluir
    </button>

</td>
        `;

        tabela.appendChild(linha);
    });

    atualizarTotalMateriais();
}


// ==============================
// ATUALIZAR TOTAL DE MATERIAIS
// ==============================

function atualizarTotalMateriais() {

    const total = materiais.length;

    document.getElementById("totalMateriais").textContent =
        total === 1
            ? "1 material"
            : total + " materiais";
}


// ==============================
// EXCLUIR MATERIAL
// ==============================

function excluirMaterial(id) {

    if (!confirm("Deseja realmente excluir este material?")) {
        return;
    }

    materiais = materiais.filter(
        material => material.id !== id
    );

    localStorage.setItem(
        "materiais",
        JSON.stringify(materiais)
    );

    mostrarMateriais();
}


// ==============================
// CARREGAR MATERIAIS
// ==============================

mostrarMateriais();


// ==============================
// PESQUISAR MATERIAL
// ==============================

const pesquisaMaterial =
    document.getElementById("pesquisaMaterial");

pesquisaMaterial.addEventListener("input", function() {

    const pesquisa =
        this.value.toLowerCase().trim();

    const materiaisFiltrados =
        materiais.filter(material => {

            return (
                String(material.nome || "")
                    .toLowerCase()
                    .includes(pesquisa)

                ||

                String(material.categoria || "")
                    .toLowerCase()
                    .includes(pesquisa)
            );
        });


    // Ordena também os resultados da pesquisa
    const materiaisOrdenados =
        [...materiaisFiltrados].sort((a, b) =>
            String(a.nome || "").localeCompare(
                String(b.nome || ""),
                "pt-BR",
                { sensitivity: "base" }
            )
        );


    const tabela =
        document.getElementById("listaMateriais");

    tabela.innerHTML = "";


    materiaisOrdenados.forEach(material => {

        const linha =
            document.createElement("tr");

        linha.innerHTML = `
            <td>
                ${material.nome}
            </td>

            <td>
                ${material.categoria || "-"}
            </td>

            <td>
                ${material.quantidade}
            </td>

            <td>
                ${material.unidade}
            </td>

            <td>
                ${
                    Number(material.preco || 0)
                        .toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                        })
                }
            </td>

            <td>
                <button
                    class="secondary-button"
                    onclick="excluirMaterial(${material.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });
});

// ==============================
// COMPRAS
// ==============================

let compras =
    JSON.parse(localStorage.getItem("compras")) || [];


// ==============================
// ELEMENTOS
// ==============================

const btnNovaCompra =
    document.getElementById("btnNovaCompra");

const modalCompra =
    document.getElementById("modalCompra");

const fecharModalCompra =
    document.getElementById("fecharModalCompra");

const cancelarCompra =
    document.getElementById("cancelarCompra");

const salvarCompra =
    document.getElementById("salvarCompra");


// ==============================
// ABRIR MODAL
// ==============================

btnNovaCompra.addEventListener("click", function() {

    preencherMateriaisCompra();

    modalCompra.classList.remove("hidden");

});


// ==============================
// FECHAR MODAL
// ==============================

fecharModalCompra.addEventListener("click", function() {

    modalCompra.classList.add("hidden");

});


cancelarCompra.addEventListener("click", function() {

    modalCompra.classList.add("hidden");

});


// ==============================
// MATERIAIS DA COMPRA
// ==============================

function preencherMateriaisCompra() {

    const select =
        document.getElementById("materialCompra");

    select.innerHTML = `
        <option value="">
            Selecione o material
        </option>
    `;

    const materiaisOrdenados =
        [...materiais].sort((a, b) =>
            String(a.nome || "").localeCompare(
                String(b.nome || ""),
                "pt-BR",
                { sensitivity: "base" }
            )
        );

    materiaisOrdenados.forEach(material => {

        const option =
            document.createElement("option");

        option.value =
            material.id;

        option.textContent =
            material.nome;

        select.appendChild(option);

    });

    // Opção para materiais que não estão no estoque
    const optionOutros =
        document.createElement("option");

    optionOutros.value = "outros";

    optionOutros.textContent = "Outros";

    select.appendChild(optionOutros);
}

// ==============================
// FORMATAR VALOR
// ==============================

const valorCompra =
    document.getElementById("valorCompra");

valorCompra.addEventListener("input", function() {

    let valor =
        this.value.replace(/\D/g, "");

    if (valor === "") {

        this.value = "";

        return;
    }

    valor =
        (Number(valor) / 100).toFixed(2);

    this.value =
        Number(valor).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

});


salvarCompra.addEventListener("click", function() {

    const nome =
        document.getElementById("nomeCompra")
            .value.trim();

    const fornecedor =
        document.getElementById("fornecedorCompra")
            .value.trim();

    const materialId =
        document.getElementById("materialCompra")
            .value;

    const quantidade =
        document.getElementById("quantidadeCompra")
            .value;

    const valorTexto =
        document.getElementById("valorCompra")
            .value;

    const data =
        document.getElementById("dataCompra")
            .value;

    const observacoes =
        document.getElementById("observacoesCompra")
            .value.trim();


    // ==============================
    // VALIDAÇÕES
    // ==============================

    if (nome === "") {

        alert("Digite o nome da compra.");

        return;
    }


    if (materialId === "") {

        alert("Selecione o material.");

        return;
    }


    if (quantidade === "") {

        alert("Digite a quantidade.");

        return;
    }


    if (Number(quantidade) <= 0) {

        alert("Digite uma quantidade válida.");

        return;
    }


    if (valorTexto === "") {

        alert("Digite o valor.");

        return;
    }


    // ==============================
    // CONVERTER VALOR
    // ==============================

    const valor =
        Number(
            valorTexto
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        );


    if (isNaN(valor) || valor <= 0) {

        alert("Digite um valor válido.");

        return;
    }


    // ==============================
    // CRIAR COMPRA
    // ==============================

    const compra = {

        id: Date.now(),

        nome: nome,

        fornecedor: fornecedor,

        materialId:
            materialId === "outros"
                ? "outros"
                : Number(materialId),

        quantidade:
            Number(quantidade),

        valor: valor,

        data: data,

        observacoes: observacoes

    };


    // ==============================
    // SALVAR COMPRA
    // ==============================

    compras.push(compra);

    localStorage.setItem(
        "compras",
        JSON.stringify(compras)
    );


    // ==============================
    // ATUALIZAR ESTOQUE
    // ==============================

    if (materialId !== "outros") {

        const material =
            materiais.find(
                material =>
                    material.id === Number(materialId)
            );


        if (material) {

            material.quantidade =
                Number(material.quantidade || 0) +
                Number(quantidade);


            localStorage.setItem(
                "materiais",
                JSON.stringify(materiais)
            );

        }

    }


    // ==============================
    // LANÇAR NO FINANCEIRO
    // ==============================

    const novoLancamento = {

        id: Date.now() + 1,

        descricao:
            "Compra: " + nome,

        tipo: "despesa",

        valor: valor,

        data: data,

        obraId: "geral",

        observacoes:
            fornecedor
                ? "Fornecedor: " + fornecedor +
                  (observacoes
                    ? " | " + observacoes
                    : "")
                : observacoes

    };


    lancamentos.push(novoLancamento);


    localStorage.setItem(
        "lancamentos",
        JSON.stringify(lancamentos)
    );


    // ==============================
    // ATUALIZAR TELAS
    // ==============================

    mostrarCompras();

    mostrarMateriais();

    mostrarLancamentos();


    // ==============================
    // FECHAR E LIMPAR
    // ==============================

    modalCompra.classList.add("hidden");

    limparFormularioCompra();


    alert(
        "Compra cadastrada!\n\n" +
        "✓ Estoque atualizado\n" +
        "✓ Despesa lançada no Financeiro"
    );

});

    modalCompra.classList.add("hidden");


    limparFormularioCompra();




// ==============================
// LIMPAR FORMULÁRIO
// ==============================

function limparFormularioCompra() {

    document.getElementById("nomeCompra").value = "";

    document.getElementById("fornecedorCompra").value = "";

    document.getElementById("materialCompra").value = "";

    document.getElementById("quantidadeCompra").value = "";

    document.getElementById("valorCompra").value = "";

    document.getElementById("dataCompra").value = "";

    document.getElementById("observacoesCompra").value = "";

}

// ==============================
// MOSTRAR COMPRAS
// ==============================

function mostrarCompras(lista = compras) {

    const tabela =
        document.getElementById("listaCompras");

    tabela.innerHTML = "";


    const comprasOrdenadas =
        [...lista].sort((a, b) =>
            String(a.nome || "").localeCompare(
                String(b.nome || ""),
                "pt-BR",
                { sensitivity: "base" }
            )
        );


    comprasOrdenadas.forEach(compra => {

        const material =
            materiais.find(
                material =>
                    material.id === Number(compra.materialId)
            );


        const linha =
            document.createElement("tr");


        linha.innerHTML = `
            <td>
                ${compra.nome}
            </td>

            <td>
                ${compra.fornecedor || "-"}
            </td>

            <td>
                ${material ? material.nome : "-"}
            </td>

            <td>
                ${compra.quantidade}
            </td>

            <td>
                ${
                    Number(compra.valor || 0)
                        .toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                        })
                }
            </td>

            <td>
                ${
                    compra.data
                        ? new Date(
                            compra.data + "T00:00:00"
                        ).toLocaleDateString("pt-BR")
                        : "-"
                }
            </td>

            <td>

                <button
                    class="secondary-button"
                    onclick="excluirCompra(${compra.id})">
                    Excluir
                </button>

            </td>
        `;


        tabela.appendChild(linha);

    });


    atualizarTotalCompras();
}


// ==============================
// TOTAL DE COMPRAS
// ==============================

function atualizarTotalCompras() {

    const total =
        compras.length;


    document.getElementById(
        "totalCompras"
    ).textContent =

        total === 1
            ? "1 compra"
            : total + " compras";

}


// ==============================
// EXCLUIR COMPRA
// ==============================

function excluirCompra(id) {

    if (
        !confirm(
            "Deseja realmente excluir esta compra?"
        )
    ) {
        return;
    }


    compras =
        compras.filter(
            compra => compra.id !== id
        );


    localStorage.setItem(
        "compras",
        JSON.stringify(compras)
    );


    mostrarCompras();

}


// ==============================
// PESQUISAR COMPRAS
// ==============================

const pesquisaCompra =
    document.getElementById("pesquisaCompra");


pesquisaCompra.addEventListener(
    "input",
    function() {

        const pesquisa =
            this.value
                .toLowerCase()
                .trim();


        const comprasFiltradas =
            compras.filter(compra => {

                const material =
                    materiais.find(
                        material =>
                            material.id ===
                            Number(compra.materialId)
                    );


                return (

                    String(compra.nome || "")
                        .toLowerCase()
                        .includes(pesquisa)

                    ||

                    String(compra.fornecedor || "")
                        .toLowerCase()
                        .includes(pesquisa)

                    ||

                    String(material?.nome || "")
                        .toLowerCase()
                        .includes(pesquisa)

                );

            });


        mostrarCompras(
            comprasFiltradas
        );

    }
);


// ==============================
// CARREGAR COMPRAS
// ==============================

mostrarCompras();