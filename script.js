'use strict';

// =====================================================================
// CONFIGURAÇÃO
// =====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAUJ1NViUIgmGl8qKf8gsbtlw72R0okOrg",
    authDomain: "gestorobra-c4a92.firebaseapp.com",
    projectId: "gestorobra-c4a92",
    storageBucket: "gestorobra-c4a92.firebasestorage.app",
    messagingSenderId: "369876379222",
    appId: "1:369876379222:web:af5dcde7dc3be9e881fdf7",
    measurementId: "G-1F69BSSMF9"
};

// false = anexos ficam no Firestore (funciona no plano gratuito, limite ~700 KB por arquivo).
// true  = anexos vão para o Firebase Storage (exige plano Blaze e a linha do storage no index.html).
const USAR_STORAGE = false;
const MAX_BYTES = 700 * 1024;

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = (USAR_STORAGE && firebase.storage) ? firebase.storage() : null;
db.enablePersistence({ synchronizeTabs: true }).catch(() => { /* sem cache offline neste navegador */ });

// =====================================================================
// UTILITÁRIOS
// =====================================================================
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = v => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (!v) return 0;
    const n = Number(String(v).replace(/[^\d,-]/g, '').replace(',', '.'));
    return isFinite(n) ? n : 0;
};
const arred = n => Math.round(n * 1000) / 1000;
const fmtQtd = n => arred(n).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const fmtData = iso => iso ? String(iso).split('-').reverse().join('/') : '-';
const hoje = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const novoId = () => String(Date.now());
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const plural = (n, s, p = s + 's') => `${n} ${n === 1 ? s : p}`;
const ordenar = (arr, campo) => [...arr].sort((a, b) => String(a[campo] || '').localeCompare(String(b[campo] || ''), 'pt-BR'));
const porData = (arr) => [...arr].sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')) || String(b.id).localeCompare(String(a.id)));
const moedaInput = n => n ? brl(num(n)) : '';
const vazio = msg => `<p class="muted">${esc(msg)}</p>`;
const linhaVazia = (cols, msg) => `<tr><td class="vazio" colspan="${cols}">${esc(msg)}</td></tr>`;

function toast(msg, tipo = 'info') {
    const el = document.createElement('div');
    el.className = 'toast ' + tipo;
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 4500);
}

async function tentar(fn, msgErro) {
    try {
        return await fn();
    } catch (e) {
        console.error(e);
        if (e && e.code) {
            const extra = e.code === 'permission-denied' ? ' Sem permissão: verifique as regras do Firestore.' : '';
            toast(msgErro + extra, 'erro');
        } else {
            toast((e && e.message) || msgErro, 'erro');
        }
        return null;
    }
}

async function comBotao(btnId, fn, msgErro) {
    const btn = $(btnId);
    const txt = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Salvando…';
    try { return await tentar(fn, msgErro); }
    finally { btn.disabled = false; btn.textContent = txt; }
}

function gravar(col, id, dados, novo) {
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    return db.collection(col).doc(id).set({ ...dados, id, [novo ? 'criadoEm' : 'atualizadoEm']: ts }, { merge: true });
}

function preencherSelect(id, itens, rotulo, vazioOpt) {
    $(id).innerHTML = (vazioOpt ? `<option value="${esc(vazioOpt[0])}">${esc(vazioOpt[1])}</option>` : '') +
        itens.map(i => `<option value="${esc(i.id)}">${esc(rotulo(i))}</option>`).join('');
}

function delegar(id, acoes) {
    $(id).addEventListener('click', e => {
        const el = e.target.closest('[data-acao]');
        if (!el || !acoes[el.dataset.acao]) return;
        acoes[el.dataset.acao](el.dataset.id, el);
    });
}

const abrirModal = id => $(id).classList.remove('hidden');
const fecharModal = id => $(id).classList.add('hidden');

document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]');
    if (c) return fecharModal(c.closest('.modal').id);
    if (e.target.classList.contains('modal')) fecharModal(e.target.id);
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const abertos = [...document.querySelectorAll('.modal:not(.hidden)')];
    if (abertos.length) fecharModal(abertos[abertos.length - 1].id);
});

// Máscaras
document.addEventListener('input', e => {
    const el = e.target;
    if (el.classList && el.classList.contains('input-moeda')) {
        const d = el.value.replace(/\D/g, '');
        el.value = d ? (Number(d) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
    }
});

$('documentoCliente').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 14);
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        v = v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    e.target.value = v;
});

$('telefoneCliente').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    else if (v.length > 0) v = v.replace(/^(\d*)/, '($1');
    e.target.value = v;
});

// =====================================================================
// ESTADO
// =====================================================================
const COLECOES = ['clientes', 'obras', 'contratos', 'lancamentos', 'materiais', 'movimentacoes'];
const S = { clientes: [], obras: [], contratos: [], lancamentos: [], materiais: [], movimentacoes: [] };
const editando = { cliente: null, obra: null, contrato: null, lancamento: null, material: null };
let unsubs = [];
let fichaClienteId = null;
let fichaObraId = null;
let anexoAtual = null;

const porId = (col, id) => S[col].find(x => String(x.id) === String(id));

// =====================================================================
// TEMA
// =====================================================================
function aplicarTema(claro) {
    document.body.classList.toggle('light-mode', claro);
    document.querySelector('meta[name="theme-color"]').content = claro ? '#ffffff' : '#0f172a';
}
try { aplicarTema(localStorage.getItem('tema') === 'claro'); } catch (e) { /* ignora */ }

$('btnTema').addEventListener('click', e => {
    e.preventDefault();
    const claro = !document.body.classList.contains('light-mode');
    aplicarTema(claro);
    try { localStorage.setItem('tema', claro ? 'claro' : 'escuro'); } catch (err) { /* ignora */ }
});

// =====================================================================
// AUTENTICAÇÃO (Firebase Authentication)
// =====================================================================
const MSG_AUTH = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Este usuário está desativado.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/operation-not-allowed': 'O login por E-mail/senha não está ativado. No Firebase: Authentication → Sign-in method → E-mail/senha → Ativar.',
    'auth/configuration-not-found': 'O Authentication ainda não foi iniciado. No Firebase: Authentication → clique em "Vamos começar" (Get started).',
    'auth/invalid-api-key': 'Chave de API inválida. Confira o firebaseConfig no script.js.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Chave de API inválida. Confira o firebaseConfig no script.js.',
    'auth/unauthorized-domain': 'Este endereço não está autorizado. No Firebase: Authentication → Settings → Authorized domains → adicione o domínio do site.'
};

function mostrarErroLogin(msg) {
    const el = $('erroLogin');
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
}

$('formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const senha = $('loginSenha').value;
    if (!email || !senha) return mostrarErroLogin('Informe e-mail e senha.');
    const btn = $('btnLogin');
    btn.disabled = true; btn.textContent = 'Entrando…';
    mostrarErroLogin('');
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        $('loginSenha').value = '';
    } catch (err) {
        console.error('Erro de login:', err);
        mostrarErroLogin(MSG_AUTH[err.code] || `Não foi possível entrar. Código do erro: ${err.code || err.message}`);
    } finally {
        btn.disabled = false; btn.textContent = 'Entrar';
    }
});

$('btnEsqueciSenha').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    if (!email) return mostrarErroLogin('Digite seu e-mail acima e clique novamente em "Esqueci minha senha".');
    try {
        await auth.sendPasswordResetEmail(email);
        mostrarErroLogin('');
        toast('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.', 'ok');
    } catch (err) {
        mostrarErroLogin(MSG_AUTH[err.code] || 'Não foi possível enviar o e-mail.');
    }
});

$('btnSair').addEventListener('click', e => { e.preventDefault(); auth.signOut(); });

auth.onAuthStateChanged(user => {
    $('splash').classList.add('hidden');
    const app = document.querySelector('.app');
    if (user) {
        $('telaLogin').classList.add('hidden');
        app.classList.remove('hidden');
        $('emailUsuario').textContent = user.email || 'Gestor';
        irPara('dashboard');
        iniciarListeners();
    } else {
        pararListeners();
        COLECOES.forEach(c => { S[c] = []; });
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        app.classList.add('hidden');
        $('telaLogin').classList.remove('hidden');
    }
});

// =====================================================================
// SINCRONIZAÇÃO EM TEMPO REAL
// =====================================================================
function iniciarListeners() {
    pararListeners();
    COLECOES.forEach(col => {
        unsubs.push(db.collection(col).onSnapshot(snap => {
            S[col] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            agendarRender();
        }, err => {
            console.error(err);
            toast(err.code === 'permission-denied'
                ? 'Sem permissão para ler os dados. Verifique as regras do Firestore.'
                : 'Erro de sincronização (' + col + ').', 'erro');
        }));
    });
}

function pararListeners() { unsubs.forEach(u => u()); unsubs = []; }

let renderPendente = false;
function agendarRender() {
    if (renderPendente) return;
    renderPendente = true;
    requestAnimationFrame(() => { renderPendente = false; renderTudo(); });
}

function renderTudo() {
    renderClientes(); renderObras(); renderContratos(); renderLancamentos(); renderEstoque(); renderDashboard();
    renderFichaCliente(); renderFichaObra();
    if (anexoAtual && !$(ANEXOS[anexoAtual.col].modal).classList.contains('hidden')) renderAnexos();
}

['pesquisaCliente', 'pesquisaObra', 'pesquisaContrato', 'pesquisaLancamento', 'pesquisaMaterial']
    .forEach(id => $(id).addEventListener('input', agendarRender));

// =====================================================================
// NAVEGAÇÃO
// =====================================================================
const TITULOS = {
    dashboard: ['Dashboard', 'Visão geral da sua empresa'],
    clientes: ['Clientes', 'Gerencie os clientes da empresa'],
    obras: ['Obras', 'Gerencie as obras da empresa'],
    contratos: ['Contratos', 'Gerencie os contratos das obras'],
    estoque: ['Estoque', 'Controle de materiais'],
    financeiro: ['Financeiro', 'Controle de receitas e despesas']
};

function irPara(pagina) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('hidden', p.id !== 'page-' + pagina));
    const menu = pagina === 'ficha-cliente' ? 'clientes' : pagina === 'ficha-obra' ? 'obras' : pagina;
    document.querySelectorAll('.menu-item[data-page]').forEach(m => m.classList.toggle('active', m.dataset.page === menu));
    const [t, s] = TITULOS[menu] || TITULOS.dashboard;
    $('tituloPagina').textContent = t;
    $('subtituloPagina').textContent = s;
    window.scrollTo(0, 0);
}

document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); irPara(item.dataset.page); });
});
$('voltarClientes').addEventListener('click', () => irPara('clientes'));
$('voltarObras').addEventListener('click', () => irPara('obras'));

// =====================================================================
// CLIENTES
// =====================================================================
function renderClientes() {
    const q = norm($('pesquisaCliente').value);
    const lista = ordenar(S.clientes, 'nome').filter(c => !q || norm([c.nome, c.telefone, c.documento, c.endereco].join(' ')).includes(q));
    $('totalClientes').textContent = plural(S.clientes.length, 'cliente');
    $('listaClientes').innerHTML = lista.length ? lista.map(c => `
        <tr>
            <td><button class="link-button" data-acao="abrir" data-id="${esc(c.id)}">${esc(c.nome)}</button></td>
            <td>${esc(c.telefone || '-')}</td>
            <td>${esc(c.documento || '-')}</td>
            <td>${esc(c.endereco || '-')}</td>
            <td><div class="acoes">
                <button class="secondary-button btn-sm" data-acao="editar" data-id="${esc(c.id)}">Editar</button>
                <button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(c.id)}">Excluir</button>
            </div></td>
        </tr>`).join('') : linhaVazia(5, q ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.');
}

function formCliente(c = {}) {
    $('nomeCliente').value = c.nome || '';
    $('telefoneCliente').value = c.telefone || '';
    $('documentoCliente').value = c.documento || '';
    $('enderecoCliente').value = c.endereco || '';
    $('observacoesCliente').value = c.observacoes || '';
}

$('btnNovoCliente').addEventListener('click', () => {
    editando.cliente = null;
    $('tituloModalCliente').textContent = 'Novo Cliente';
    formCliente();
    abrirModal('modalCliente');
    $('nomeCliente').focus();
});

$('salvarCliente').addEventListener('click', async () => {
    const d = {
        nome: $('nomeCliente').value.trim(),
        telefone: $('telefoneCliente').value.trim(),
        documento: $('documentoCliente').value.trim(),
        endereco: $('enderecoCliente').value.trim(),
        observacoes: $('observacoesCliente').value.trim()
    };
    if (!d.nome) return toast('Digite o nome do cliente.', 'erro');
    const dig = d.documento.replace(/\D/g, '');
    if (dig && dig.length !== 11 && dig.length !== 14) return toast('CPF/CNPJ incompleto.', 'erro');
    if (dig) {
        const dup = S.clientes.find(c => c.id !== editando.cliente && String(c.documento || '').replace(/\D/g, '') === dig);
        if (dup) return toast('Já existe um cliente com este CPF/CNPJ: ' + dup.nome + '.', 'erro');
    }
    await comBotao('salvarCliente', async () => {
        await gravar('clientes', editando.cliente || novoId(), d, !editando.cliente);
        fecharModal('modalCliente');
        toast('Cliente salvo.', 'ok');
    }, 'Erro ao salvar cliente.');
});

delegar('listaClientes', {
    abrir: id => abrirCliente(id),
    editar: id => {
        const c = porId('clientes', id);
        if (!c) return;
        editando.cliente = c.id;
        $('tituloModalCliente').textContent = 'Editar Cliente';
        formCliente(c);
        abrirModal('modalCliente');
    },
    excluir: async id => {
        const c = porId('clientes', id);
        if (!c) return;
        const qtd = S.obras.filter(o => String(o.clienteId) === String(id)).length;
        if (qtd) return toast(`Este cliente possui ${plural(qtd, 'obra')}. Exclua ou reatribua as obras antes.`, 'erro');
        if (!confirm('Deseja realmente excluir este cliente?')) return;
        await tentar(() => db.collection('clientes').doc(id).delete(), 'Erro ao excluir cliente.');
    }
});

// ---- Ficha do cliente
function abrirCliente(id) {
    fichaClienteId = id;
    irPara('ficha-cliente');
    renderFichaCliente();
}

function renderFichaCliente() {
    if ($('page-ficha-cliente').classList.contains('hidden')) return;
    const c = porId('clientes', fichaClienteId);
    if (!c) return;
    $('fichaNomeCliente').textContent = c.nome;
    $('fichaTelefone').textContent = c.telefone || '-';
    $('fichaDocumento').textContent = c.documento || '-';
    $('fichaEndereco').textContent = c.endereco || '-';
    $('fichaObservacoes').textContent = c.observacoes || 'Nenhuma observação.';

    const obras = S.obras.filter(o => String(o.clienteId) === String(c.id));
    $('obrasDoCliente').innerHTML = obras.length ? obras.map(o => `
        <div class="item-card"><div>
            <button class="link-button" data-acao="obra" data-id="${esc(o.id)}">🏗️ ${esc(o.nome)}</button>
            <small>Status: ${esc(o.status || '-')} · Valor: ${brl(num(o.valor))}</small>
        </div></div>`).join('') : vazio('Nenhuma obra cadastrada para este cliente.');

    const contratos = S.contratos.filter(x => String(x.clienteId) === String(c.id));
    $('contratosDoCliente').innerHTML = contratos.length ? contratos.map(x => {
        const o = porId('obras', x.obraId);
        return `<div class="item-card"><div>📄 Contrato (${esc(o ? o.nome : 'Obra Geral')})<small>Valor: ${brl(num(x.valor))}</small></div></div>`;
    }).join('') : vazio('Nenhum contrato cadastrado para este cliente.');

    const ids = new Set(obras.map(o => String(o.id)));
    $('financeiroDoCliente').innerHTML = htmlFinanceiro(S.lancamentos.filter(l => ids.has(String(l.obraId))),
        'Nenhum lançamento financeiro para este cliente.');
}

delegar('obrasDoCliente', { obra: id => abrirObra(id) });

// Resumo + lista de lançamentos (usado nas fichas)
function htmlFinanceiro(lancs, msgVazio) {
    if (!lancs.length) return vazio(msgVazio);
    const rec = lancs.filter(l => l.tipo === 'receita').reduce((s, l) => s + num(l.valor), 0);
    const desp = lancs.filter(l => l.tipo !== 'receita').reduce((s, l) => s + num(l.valor), 0);
    return `<div class="resumo-fin">
            <span>Receitas: <strong>${brl(rec)}</strong></span>
            <span>Despesas: <strong>${brl(desp)}</strong></span>
            <span>Saldo: <strong>${brl(rec - desp)}</strong></span></div>` +
        porData(lancs).slice(0, 20).map(l => `
        <div class="item-card"><div>${esc(l.descricao)}<small>${fmtData(l.data)}</small></div>
        <span class="valor ${l.tipo === 'receita' ? '' : 'neg'}">${l.tipo === 'receita' ? '+' : '−'} ${brl(num(l.valor))}</span></div>`).join('');
}

// =====================================================================
// ANEXOS (obras e contratos)
// =====================================================================
const ANEXOS = {
    obras: { modal: 'modalAnexosObra', lista: 'listaAnexosObra', input: 'inputArquivoAnexoObra' },
    contratos: { modal: 'modalAnexos', lista: 'listaAnexosContrato', input: 'inputArquivoAnexo' }
};

const lerDataURL = blob => new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => erro(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(blob);
});

async function comprimirImagem(file, max = 1600) {
    try {
        const bmp = await createImageBitmap(file);
        const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bmp.width * k);
        c.height = Math.round(bmp.height * k);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
        return blob && blob.size < file.size ? blob : file;
    } catch (e) {
        return file;
    }
}

// Envia os arquivos e devolve só os metadados (guardados dentro da obra/contrato)
async function enviarArquivos(col, parentId, files) {
    const metas = [];
    for (const f of files) {
        const blob = f.type.startsWith('image/') ? await comprimirImagem(f) : f;
        const id = novoId() + Math.random().toString(36).slice(2, 6);
        const meta = { id, nome: f.name, tipo: blob.type || f.type, tamanho: blob.size, data: hoje() };
        if (storage) {
            const path = `anexos/${col}/${parentId}/${id}-${f.name}`;
            await storage.ref(path).put(blob);
            meta.url = await storage.ref(path).getDownloadURL();
            meta.path = path;
        } else {
            if (blob.size > MAX_BYTES) {
                throw new Error(`"${f.name}" é grande demais (${Math.round(blob.size / 1024)} KB). Limite: ${MAX_BYTES / 1024} KB. Reduza o PDF ou use o Storage.`);
            }
            await db.collection('anexos').doc(id).set({ dataUrl: await lerDataURL(blob), refCol: col, refId: parentId });
        }
        metas.push(meta);
    }
    return metas;
}

function abrirAnexos(col, id) {
    anexoAtual = { col, id };
    renderAnexos();
    abrirModal(ANEXOS[col].modal);
}

function renderAnexos() {
    if (!anexoAtual) return;
    const { col, id } = anexoAtual;
    const anexos = (porId(col, id) || {}).anexos || [];
    $(ANEXOS[col].lista).innerHTML = anexos.length ? anexos.map((a, i) => `
        <div class="anexo-item">
            <button class="link-button" data-acao="abrir" data-id="${i}">📄 ${esc(a.nome || 'Arquivo')}</button>
            <button class="secondary-button btn-sm btn-danger" data-acao="remover" data-id="${i}">Excluir</button>
        </div>`).join('') : vazio('Nenhum anexo.');
}

async function abrirAnexo(a) {
    const w = window.open('about:blank', '_blank');
    try {
        let url = a.url;
        if (!url) {
            const d = await db.collection('anexos').doc(a.id).get();
            if (!d.exists) throw new Error('Arquivo não encontrado.');
            url = d.data().dataUrl;
        }
        if (url.startsWith('data:')) url = URL.createObjectURL(await (await fetch(url)).blob());
        if (w) w.location = url; else window.location = url;
    } catch (e) {
        if (w) w.close();
        toast('Não foi possível abrir o arquivo.', 'erro');
    }
}

async function removerAnexo(i) {
    const { col, id } = anexoAtual;
    const item = porId(col, id);
    const a = item && item.anexos && item.anexos[i];
    if (!a || !confirm('Deseja realmente excluir este arquivo?')) return;
    await tentar(async () => {
        await db.collection(col).doc(id).update({ anexos: item.anexos.filter((_, k) => k !== i) });
        if (a.path && storage) await storage.ref(a.path).delete().catch(() => { });
        else if (a.id && !a.url) await db.collection('anexos').doc(a.id).delete().catch(() => { });
    }, 'Erro ao excluir anexo.');
}

Object.entries(ANEXOS).forEach(([col, cfg]) => {
    delegar(cfg.lista, {
        abrir: i => { const item = porId(col, anexoAtual.id); if (item && item.anexos[i]) abrirAnexo(item.anexos[i]); },
        remover: i => removerAnexo(Number(i))
    });
    $(cfg.input).addEventListener('change', async e => {
        const files = [...e.target.files];
        e.target.value = '';
        if (!files.length || !anexoAtual) return;
        toast('Enviando arquivo(s)…');
        await tentar(async () => {
            const metas = await enviarArquivos(col, anexoAtual.id, files);
            await db.collection(col).doc(anexoAtual.id).update({ anexos: firebase.firestore.FieldValue.arrayUnion(...metas) });
            toast('Arquivo(s) adicionado(s).', 'ok');
        }, 'Erro ao enviar arquivo.');
    });
});

$('btnAddAnexoObra').addEventListener('click', () => $('inputArquivoAnexoObra').click());

const botaoAnexos = (col, item) => `<button class="secondary-button btn-sm" data-acao="anexos" data-id="${esc(item.id)}">📎 Anexos (${(item.anexos || []).length})</button>`;

// =====================================================================
// OBRAS
// =====================================================================
const classeStatus = s => ({ 'Em andamento': 'info', 'Concluída': 'ok', 'Pausada': 'warn' }[s] || '');

function renderObras() {
    const q = norm($('pesquisaObra').value);
    const nomeCli = o => (porId('clientes', o.clienteId) || {}).nome || '';
    const lista = ordenar(S.obras, 'nome').filter(o => !q || norm([o.nome, nomeCli(o), o.status, o.endereco].join(' ')).includes(q));
    $('totalObras').textContent = plural(S.obras.length, 'obra');
    $('listaObras').innerHTML = lista.length ? lista.map(o => `
        <tr>
            <td><button class="link-button" data-acao="abrir" data-id="${esc(o.id)}">${esc(o.nome || '-')}</button></td>
            <td>${esc(nomeCli(o) || '-')}</td>
            <td><span class="badge ${classeStatus(o.status)}">${esc(o.status || '-')}</span></td>
            <td>${brl(num(o.valor))}</td>
            <td><div class="acoes">
                ${botaoAnexos('obras', o)}
                <button class="secondary-button btn-sm" data-acao="editar" data-id="${esc(o.id)}">Editar</button>
                <button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(o.id)}">Excluir</button>
            </div></td>
        </tr>`).join('') : linhaVazia(5, q ? 'Nenhuma obra encontrada.' : 'Nenhuma obra cadastrada.');
}

function formObra(o = {}) {
    preencherSelect('clienteObra', ordenar(S.clientes, 'nome'), c => c.nome, ['', 'Selecione o cliente']);
    $('nomeObra').value = o.nome || '';
    $('clienteObra').value = o.clienteId || '';
    $('enderecoObra').value = o.endereco || '';
    $('dataInicioObra').value = o.dataInicio || '';
    $('dataFimObra').value = o.dataFim || '';
    $('statusObra').value = o.status || 'Em andamento';
    $('valorObra').value = moedaInput(o.valor);
    $('observacoesObra').value = o.observacoes || '';
    $('anexoObra').value = '';
}

$('btnNovaObra').addEventListener('click', () => {
    editando.obra = null;
    $('tituloModalObra').textContent = 'Nova Obra';
    formObra();
    abrirModal('modalObra');
    $('nomeObra').focus();
});

$('salvarObra').addEventListener('click', async () => {
    const d = {
        nome: $('nomeObra').value.trim(),
        clienteId: $('clienteObra').value,
        endereco: $('enderecoObra').value.trim(),
        dataInicio: $('dataInicioObra').value,
        dataFim: $('dataFimObra').value,
        status: $('statusObra').value || 'Em andamento',
        valor: num($('valorObra').value),
        observacoes: $('observacoesObra').value.trim()
    };
    if (!d.nome) return toast('Insira o nome da obra.', 'erro');
    if (d.dataInicio && d.dataFim && d.dataFim < d.dataInicio) return toast('A previsão de término é anterior ao início.', 'erro');
    const files = [...$('anexoObra').files];
    await comBotao('salvarObra', async () => {
        const novo = !editando.obra;
        const id = editando.obra || novoId();
        const metas = files.length ? await enviarArquivos('obras', id, files) : [];
        if (metas.length) d.anexos = [...((porId('obras', id) || {}).anexos || []), ...metas];
        else if (novo) d.anexos = [];
        await gravar('obras', id, d, novo);
        fecharModal('modalObra');
        toast('Obra salva.', 'ok');
    }, 'Erro ao salvar obra.');
});

delegar('listaObras', {
    abrir: id => abrirObra(id),
    anexos: id => abrirAnexos('obras', id),
    editar: id => {
        const o = porId('obras', id);
        if (!o) return;
        editando.obra = o.id;
        $('tituloModalObra').textContent = 'Editar Obra';
        formObra(o);
        abrirModal('modalObra');
    },
    excluir: async id => {
        const o = porId('obras', id);
        if (!o) return;
        const nc = S.contratos.filter(c => String(c.obraId) === String(id)).length;
        const nl = S.lancamentos.filter(l => String(l.obraId) === String(id)).length;
        const nm = S.movimentacoes.filter(m => String(m.obraId) === String(id)).length;
        if (nc || nl || nm) {
            return toast(`Esta obra possui ${[nc && plural(nc, 'contrato'), nl && plural(nl, 'lançamento'), nm && plural(nm, 'movimentação de estoque', 'movimentações de estoque')].filter(Boolean).join(', ')}. Remova-os antes de excluir a obra.`, 'erro');
        }
        if (!confirm('Deseja realmente excluir esta obra?')) return;
        await tentar(() => db.collection('obras').doc(id).delete(), 'Erro ao excluir obra.');
    }
});

// ---- Ficha da obra
function abrirObra(id) {
    fichaObraId = id;
    irPara('ficha-obra');
    renderFichaObra();
}

function renderFichaObra() {
    if ($('page-ficha-obra').classList.contains('hidden')) return;
    const o = porId('obras', fichaObraId);
    if (!o) return;
    $('fichaNomeObra').textContent = o.nome;
    $('fichaClienteObra').textContent = (porId('clientes', o.clienteId) || {}).nome || '-';
    $('fichaEnderecoObra').textContent = o.endereco || '-';
    $('fichaStatusObra').textContent = o.status || '-';
    $('fichaDataObra').textContent = fmtData(o.dataInicio);
    $('fichaFimObra').textContent = fmtData(o.dataFim);
    $('fichaValorObra').textContent = o.valor ? brl(num(o.valor)) : '-';
    $('fichaObservacoesObra').textContent = o.observacoes || 'Nenhuma observação.';

    const contratos = S.contratos.filter(c => String(c.obraId) === String(o.id));
    $('contratosDaObra').innerHTML = contratos.length ? contratos.map(c => `
        <div class="item-card"><div>📄 Contrato #${esc(String(c.id).slice(-4))}<small>${esc(fmtData(c.data))}${c.descricao ? ' · ' + esc(c.descricao) : ''}</small></div>
        <span class="valor">${brl(num(c.valor))}</span></div>`).join('') : vazio('Nenhum contrato cadastrado para esta obra.');

    const saidas = S.movimentacoes.filter(m => m.tipo === 'saida' && String(m.obraId) === String(o.id));
    const grupos = {};
    saidas.forEach(m => {
        const g = grupos[m.materialId] || (grupos[m.materialId] = { nome: m.materialNome || '-', un: m.unidade || '', qtd: 0, custo: 0 });
        g.qtd += num(m.quantidade);
        g.custo += num(m.quantidade) * num(m.custoUnit);
    });
    const lista = Object.values(grupos);
    const total = lista.reduce((s, g) => s + g.custo, 0);
    $('materiaisDaObra').innerHTML = lista.length ? `<div class="resumo-fin"><span>Custo de materiais: <strong>${brl(total)}</strong></span></div>` +
        lista.map(g => `<div class="item-card"><div>📦 ${esc(g.nome)}<small>${fmtQtd(g.qtd)} ${esc(g.un)}</small></div><span class="valor neg">${brl(g.custo)}</span></div>`).join('')
        : vazio('Nenhum material lançado para esta obra.');

    $('financeiroDaObra').innerHTML = htmlFinanceiro(S.lancamentos.filter(l => String(l.obraId) === String(o.id)),
        'Nenhum lançamento financeiro para esta obra.');
}

// =====================================================================
// CONTRATOS
// =====================================================================
function renderContratos() {
    const q = norm($('pesquisaContrato').value);
    const ctx = c => ({ cli: (porId('clientes', c.clienteId) || {}).nome || '', obra: (porId('obras', c.obraId) || {}).nome || '' });
    const lista = porData(S.contratos).filter(c => { const x = ctx(c); return !q || norm([x.cli, x.obra, c.descricao, 'contrato ' + String(c.id).slice(-4)].join(' ')).includes(q); });
    $('totalContratos').textContent = plural(S.contratos.length, 'contrato');
    $('listaContratos').innerHTML = lista.length ? lista.map(c => {
        const x = ctx(c);
        return `<tr>
            <td>Contrato #${esc(String(c.id).slice(-4))}</td>
            <td>${esc(x.cli || '-')}</td>
            <td>${esc(x.obra || '-')}</td>
            <td>${brl(num(c.valor))}</td>
            <td><div class="acoes">
                ${botaoAnexos('contratos', c)}
                <button class="secondary-button btn-sm" data-acao="editar" data-id="${esc(c.id)}">Editar</button>
                <button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(c.id)}">Excluir</button>
            </div></td></tr>`;
    }).join('') : linhaVazia(5, q ? 'Nenhum contrato encontrado.' : 'Nenhum contrato cadastrado.');
}

function formContrato(c = {}) {
    preencherSelect('clienteContrato', ordenar(S.clientes, 'nome'), x => x.nome, ['', 'Selecione o cliente']);
    preencherSelect('obraContrato', ordenar(S.obras, 'nome'), x => x.nome, ['', 'Selecione a obra']);
    $('clienteContrato').value = c.clienteId || '';
    $('obraContrato').value = c.obraId || '';
    $('valorContrato').value = moedaInput(c.valor);
    $('dataContrato').value = c.data || '';
    $('descricaoContrato').value = c.descricao || '';
    $('anexoContrato').value = '';
}

$('obraContrato').addEventListener('change', () => {
    const o = porId('obras', $('obraContrato').value);
    if (o && o.clienteId && !$('clienteContrato').value) $('clienteContrato').value = o.clienteId;
});

$('btnNovoContrato').addEventListener('click', () => {
    editando.contrato = null;
    $('tituloModalContrato').textContent = 'Novo Contrato';
    formContrato();
    abrirModal('modalContrato');
});

$('salvarContrato').addEventListener('click', async () => {
    const d = {
        clienteId: $('clienteContrato').value,
        obraId: $('obraContrato').value,
        valor: num($('valorContrato').value),
        data: $('dataContrato').value,
        descricao: $('descricaoContrato').value.trim()
    };
    if (d.valor <= 0) return toast('Insira o valor do contrato.', 'erro');
    const files = [...$('anexoContrato').files];
    await comBotao('salvarContrato', async () => {
        const novo = !editando.contrato;
        const id = editando.contrato || novoId();
        const metas = files.length ? await enviarArquivos('contratos', id, files) : [];
        if (metas.length) d.anexos = [...((porId('contratos', id) || {}).anexos || []), ...metas];
        else if (novo) d.anexos = [];
        await gravar('contratos', id, d, novo);
        fecharModal('modalContrato');
        toast('Contrato salvo.', 'ok');
    }, 'Erro ao salvar contrato.');
});

delegar('listaContratos', {
    anexos: id => abrirAnexos('contratos', id),
    editar: id => {
        const c = porId('contratos', id);
        if (!c) return;
        editando.contrato = c.id;
        $('tituloModalContrato').textContent = 'Editar Contrato';
        formContrato(c);
        abrirModal('modalContrato');
    },
    excluir: async id => {
        if (!confirm('Deseja realmente excluir este contrato?')) return;
        await tentar(() => db.collection('contratos').doc(id).delete(), 'Erro ao excluir contrato.');
    }
});

// =====================================================================
// FINANCEIRO
// =====================================================================
function renderLancamentos() {
    const q = norm($('pesquisaLancamento').value);
    let rec = 0, desp = 0;
    S.lancamentos.forEach(l => { if (l.tipo === 'receita') rec += num(l.valor); else desp += num(l.valor); });
    $('totalLancamentos').textContent = plural(S.lancamentos.length, 'lançamento');
    $('totalReceitas').textContent = brl(rec);
    $('totalDespesas').textContent = brl(desp);
    $('saldoFinanceiro').textContent = brl(rec - desp);

    const ctx = l => { const o = porId('obras', l.obraId); return { obra: o ? o.nome : 'Geral', cli: o ? (porId('clientes', o.clienteId) || {}).nome || '' : '' }; };
    const lista = porData(S.lancamentos).filter(l => { const x = ctx(l); return !q || norm([l.descricao, x.obra, x.cli, l.tipo].join(' ')).includes(q); });
    $('listaLancamentos').innerHTML = lista.length ? lista.map(l => {
        const x = ctx(l);
        return `<tr>
            <td>${esc(l.descricao)}</td>
            <td>${l.tipo === 'receita' ? '🟢 Receita' : '🔴 Despesa'}</td>
            <td>${esc(x.obra)}</td>
            <td>${esc(x.cli || '-')}</td>
            <td>${brl(num(l.valor))}</td>
            <td>${fmtData(l.data)}</td>
            <td><div class="acoes">
                <button class="secondary-button btn-sm" data-acao="editar" data-id="${esc(l.id)}">Editar</button>
                <button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(l.id)}">Excluir</button>
            </div></td></tr>`;
    }).join('') : linhaVazia(7, q ? 'Nenhum lançamento encontrado.' : 'Nenhum lançamento cadastrado.');
}

function formLancamento(l = {}) {
    preencherSelect('obraLancamento', ordenar(S.obras, 'nome'), o => '🏗 ' + o.nome, ['geral', '🏢 Geral / Caixa']);
    $('descricaoLancamento').value = l.descricao || '';
    $('tipoLancamento').value = l.tipo || 'receita';
    $('dataLancamento').value = l.data || hoje();
    $('obraLancamento').value = l.obraId || 'geral';
    $('valorLancamento').value = moedaInput(l.valor);
    $('observacoesLancamento').value = l.observacoes || '';
}

$('btnNovoLancamento').addEventListener('click', () => {
    editando.lancamento = null;
    $('tituloModalLancamento').textContent = 'Novo lançamento';
    formLancamento();
    abrirModal('modalLancamento');
    $('descricaoLancamento').focus();
});

$('salvarLancamento').addEventListener('click', async () => {
    const d = {
        descricao: $('descricaoLancamento').value.trim(),
        tipo: $('tipoLancamento').value,
        data: $('dataLancamento').value || hoje(),
        obraId: $('obraLancamento').value || 'geral',
        valor: num($('valorLancamento').value),
        observacoes: $('observacoesLancamento').value.trim()
    };
    if (!d.descricao) return toast('Digite a descrição do lançamento.', 'erro');
    if (d.valor <= 0) return toast('Informe um valor maior que zero.', 'erro');
    await comBotao('salvarLancamento', async () => {
        await gravar('lancamentos', editando.lancamento || novoId(), d, !editando.lancamento);
        fecharModal('modalLancamento');
        toast('Lançamento salvo.', 'ok');
    }, 'Erro ao salvar lançamento.');
});

delegar('listaLancamentos', {
    editar: id => {
        const l = porId('lancamentos', id);
        if (!l) return;
        editando.lancamento = l.id;
        $('tituloModalLancamento').textContent = 'Editar lançamento';
        formLancamento(l);
        abrirModal('modalLancamento');
    },
    excluir: async id => {
        if (!confirm('Deseja realmente excluir este lançamento?')) return;
        await tentar(() => db.collection('lancamentos').doc(id).delete(), 'Erro ao excluir lançamento.');
    }
});

// =====================================================================
// ESTOQUE
// =====================================================================
function situacaoMaterial(m) {
    const saldo = num(m.saldo), min = num(m.minimo);
    if (saldo <= 0) return { txt: 'Sem estoque', cls: 'danger', alerta: true };
    if (min > 0 && saldo <= min) return { txt: 'Estoque baixo', cls: 'warn', alerta: true };
    return { txt: 'OK', cls: 'ok', alerta: false };
}

function renderEstoque() {
    const q = norm($('pesquisaMaterial').value);
    const lista = ordenar(S.materiais, 'nome').filter(m => !q || norm(m.nome).includes(q));
    $('totalMateriais').textContent = plural(S.materiais.length, 'material', 'materiais');
    $('estTotalItens').textContent = S.materiais.length;
    $('estBaixo').textContent = S.materiais.filter(m => situacaoMaterial(m).alerta).length;
    $('estValor').textContent = brl(S.materiais.reduce((s, m) => s + num(m.saldo) * num(m.custo), 0));

    $('listaMateriais').innerHTML = lista.length ? lista.map(m => {
        const s = situacaoMaterial(m);
        return `<tr>
            <td>${esc(m.nome)}</td>
            <td>${fmtQtd(num(m.saldo))} ${esc(m.unidade || '')}</td>
            <td>${m.minimo ? fmtQtd(num(m.minimo)) : '-'}</td>
            <td>${m.custo ? brl(num(m.custo)) : '-'}</td>
            <td><span class="badge ${s.cls}">${s.txt}</span></td>
            <td><div class="acoes">
                <button class="secondary-button btn-sm btn-ok" data-acao="entrada" data-id="${esc(m.id)}">+ Entrada</button>
                <button class="secondary-button btn-sm" data-acao="saida" data-id="${esc(m.id)}">− Saída</button>
                <button class="secondary-button btn-sm" data-acao="editar" data-id="${esc(m.id)}">Editar</button>
                <button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(m.id)}">Excluir</button>
            </div></td></tr>`;
    }).join('') : linhaVazia(6, q ? 'Nenhum material encontrado.' : 'Nenhum material cadastrado.');

    const movs = porData(S.movimentacoes);
    $('totalMovimentacoes').textContent = plural(movs.length, 'movimentação', 'movimentações') + (movs.length > 100 ? ' (exibindo as 100 mais recentes)' : '');
    $('listaMovimentacoes').innerHTML = movs.length ? movs.slice(0, 100).map(m => {
        const mat = porId('materiais', m.materialId);
        const obra = porId('obras', m.obraId);
        return `<tr>
            <td>${fmtData(m.data)}</td>
            <td>${esc(mat ? mat.nome : m.materialNome || '-')}</td>
            <td>${m.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Saída'}</td>
            <td>${fmtQtd(num(m.quantidade))} ${esc(m.unidade || (mat && mat.unidade) || '')}</td>
            <td>${esc(obra ? obra.nome : '-')}</td>
            <td>${esc(m.obs || '-')}</td>
            <td><button class="secondary-button btn-sm btn-danger" data-acao="excluir" data-id="${esc(m.id)}">Excluir</button></td>
        </tr>`;
    }).join('') : linhaVazia(7, 'Nenhuma movimentação registrada.');
}

// ---- Material
$('btnNovoMaterial').addEventListener('click', () => {
    editando.material = null;
    $('tituloModalMaterial').textContent = 'Novo Material';
    $('nomeMaterial').value = '';
    $('unidadeMaterial').value = 'un';
    $('minimoMaterial').value = '';
    $('custoMaterial').value = '';
    $('saldoInicialMaterial').value = '';
    $('grupoSaldoInicial').classList.remove('hidden');
    abrirModal('modalMaterial');
    $('nomeMaterial').focus();
});

$('salvarMaterial').addEventListener('click', async () => {
    const d = {
        nome: $('nomeMaterial').value.trim(),
        unidade: $('unidadeMaterial').value,
        minimo: Math.max(0, Number($('minimoMaterial').value) || 0),
        custo: num($('custoMaterial').value)
    };
    const inicial = Math.max(0, Number($('saldoInicialMaterial').value) || 0);
    if (!d.nome) return toast('Digite o nome do material.', 'erro');
    if (S.materiais.some(m => m.id !== editando.material && norm(m.nome) === norm(d.nome))) return toast('Já existe um material com este nome.', 'erro');
    await comBotao('salvarMaterial', async () => {
        const ts = firebase.firestore.FieldValue.serverTimestamp();
        if (editando.material) {
            await gravar('materiais', editando.material, d, false);
        } else {
            const id = novoId();
            const batch = db.batch();
            batch.set(db.collection('materiais').doc(id), { ...d, id, saldo: inicial, criadoEm: ts });
            if (inicial > 0) {
                const mid = id + 'i';
                batch.set(db.collection('movimentacoes').doc(mid), {
                    id: mid, materialId: id, materialNome: d.nome, unidade: d.unidade, tipo: 'entrada',
                    quantidade: inicial, data: hoje(), obraId: '', obs: 'Saldo inicial', custoUnit: d.custo, criadoEm: ts
                });
            }
            await batch.commit();
        }
        fecharModal('modalMaterial');
        toast('Material salvo.', 'ok');
    }, 'Erro ao salvar material.');
});

// ---- Movimentações
function abrirMovimentacao(materialId, tipo) {
    if (!S.materiais.length) return toast('Cadastre um material primeiro.', 'erro');
    preencherSelect('movMaterial', ordenar(S.materiais, 'nome'), m => `${m.nome} (${fmtQtd(num(m.saldo))} ${m.unidade || ''})`);
    preencherSelect('movObra', ordenar(S.obras, 'nome'), o => o.nome, ['', '— Sem obra —']);
    if (materialId) $('movMaterial').value = materialId;
    $('movTipo').value = tipo || 'entrada';
    $('movQuantidade').value = '';
    $('movData').value = hoje();
    $('movObra').value = '';
    $('movCusto').value = '';
    $('movLancarFinanceiro').checked = false;
    $('movObs').value = '';
    atualizarCamposMov();
    abrirModal('modalMovimentacao');
    $('movQuantidade').focus();
}

function atualizarCamposMov() {
    $('grupoEntrada').classList.toggle('hidden', $('movTipo').value !== 'entrada');
}

function sugerirCustoMov() {
    const m = porId('materiais', $('movMaterial').value);
    if ($('movTipo').value === 'entrada' && m && m.custo) $('movCusto').value = brl(num(m.custo));
}

$('movTipo').addEventListener('change', () => { atualizarCamposMov(); sugerirCustoMov(); });
$('movMaterial').addEventListener('change', sugerirCustoMov);
$('btnNovaMovimentacao').addEventListener('click', () => abrirMovimentacao(null, 'entrada'));

$('salvarMovimentacao').addEventListener('click', async () => {
    const quantidade = arred(Number($('movQuantidade').value) || 0);
    const m = {
        id: novoId(),
        materialId: $('movMaterial').value,
        tipo: $('movTipo').value,
        quantidade,
        data: $('movData').value || hoje(),
        obraId: $('movObra').value,
        obs: $('movObs').value.trim(),
        custoUnit: num($('movCusto').value)
    };
    if (!m.materialId) return toast('Selecione o material.', 'erro');
    if (quantidade <= 0) return toast('Informe uma quantidade maior que zero.', 'erro');
    const lancar = $('movLancarFinanceiro').checked;
    await comBotao('salvarMovimentacao', async () => {
        await registrarMov(m, lancar);
        fecharModal('modalMovimentacao');
        toast('Movimentação registrada.', 'ok');
    }, 'Erro ao registrar movimentação.');
});

// O saldo é atualizado dentro de uma transação para evitar erros com acessos simultâneos
async function registrarMov(m, lancar) {
    const matRef = db.collection('materiais').doc(m.materialId);
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async t => {
        const snap = await t.get(matRef);
        if (!snap.exists) throw new Error('Material não encontrado.');
        const mat = snap.data();
        const saldo = num(mat.saldo);
        const novo = arred(m.tipo === 'entrada' ? saldo + m.quantidade : saldo - m.quantidade);
        if (novo < 0) throw new Error(`Saldo insuficiente de ${mat.nome}: disponível ${fmtQtd(saldo)} ${mat.unidade || ''}.`);
        const upd = { saldo: novo };
        if (m.tipo === 'entrada' && m.custoUnit > 0) upd.custo = m.custoUnit;
        if (m.tipo === 'saida') m.custoUnit = num(mat.custo);
        m.materialNome = mat.nome;
        m.unidade = mat.unidade || '';
        if (lancar && m.tipo === 'entrada' && m.custoUnit > 0) {
            const lid = novoId() + 'm';
            t.set(db.collection('lancamentos').doc(lid), {
                id: lid, tipo: 'despesa', data: m.data, obraId: m.obraId || 'geral',
                descricao: `Compra de material: ${mat.nome} (${fmtQtd(m.quantidade)} ${mat.unidade || ''})`,
                valor: Math.round(m.quantidade * m.custoUnit * 100) / 100, observacoes: m.obs || '', criadoEm: ts
            });
            m.lancamentoId = lid;
        }
        t.update(matRef, upd);
        t.set(db.collection('movimentacoes').doc(m.id), { ...m, criadoEm: ts });
    });
}

delegar('listaMateriais', {
    entrada: id => abrirMovimentacao(id, 'entrada'),
    saida: id => abrirMovimentacao(id, 'saida'),
    editar: id => {
        const m = porId('materiais', id);
        if (!m) return;
        editando.material = m.id;
        $('tituloModalMaterial').textContent = 'Editar Material';
        $('nomeMaterial').value = m.nome || '';
        $('unidadeMaterial').value = m.unidade || 'un';
        $('minimoMaterial').value = m.minimo || '';
        $('custoMaterial').value = moedaInput(m.custo);
        $('grupoSaldoInicial').classList.add('hidden');
        abrirModal('modalMaterial');
    },
    excluir: async id => {
        const m = porId('materiais', id);
        if (!m) return;
        const movs = S.movimentacoes.filter(x => String(x.materialId) === String(id));
        if (!confirm(`Excluir "${m.nome}" e ${plural(movs.length, 'movimentação', 'movimentações')} deste material? O custo em obras que usaram este material deixará de aparecer nas fichas.`)) return;
        await tentar(async () => {
            const batch = db.batch();
            movs.forEach(x => batch.delete(db.collection('movimentacoes').doc(x.id)));
            batch.delete(db.collection('materiais').doc(id));
            await batch.commit();
        }, 'Erro ao excluir material.');
    }
});

delegar('listaMovimentacoes', {
    excluir: async id => {
        const m = porId('movimentacoes', id);
        if (!m) return;
        if (!confirm('Excluir esta movimentação? O saldo do material será ajustado' + (m.lancamentoId ? ' e a despesa vinculada também será removida.' : '.'))) return;
        await tentar(async () => {
            const matRef = db.collection('materiais').doc(m.materialId);
            await db.runTransaction(async t => {
                const snap = await t.get(matRef);
                if (snap.exists) {
                    const saldo = num(snap.data().saldo);
                    const novo = arred(m.tipo === 'entrada' ? saldo - num(m.quantidade) : saldo + num(m.quantidade));
                    if (novo < 0) throw new Error('Não é possível excluir: o saldo ficaria negativo (o material já foi usado).');
                    t.update(matRef, { saldo: novo });
                }
                t.delete(db.collection('movimentacoes').doc(id));
                if (m.lancamentoId) t.delete(db.collection('lancamentos').doc(m.lancamentoId));
            });
            toast('Movimentação excluída e saldo ajustado.', 'ok');
        }, 'Erro ao excluir movimentação.');
    }
});

// =====================================================================
// DASHBOARD
// =====================================================================
function renderDashboard() {
    let rec = 0, desp = 0;
    S.lancamentos.forEach(l => { if (l.tipo === 'receita') rec += num(l.valor); else desp += num(l.valor); });
    $('dashTotalClientes').textContent = S.clientes.length;
    $('dashObrasAtivas').textContent = S.obras.filter(o => (o.status || 'Em andamento') === 'Em andamento').length;
    $('dashTotalReceitas').textContent = brl(rec);
    $('dashTotalDespesas').textContent = brl(desp);
    $('dashSaldoGeral').textContent = brl(rec - desp);

    const alertas = S.materiais.filter(m => situacaoMaterial(m).alerta);
    $('dashEstoqueBaixo').textContent = alertas.length;
    $('dashAlertasEstoque').innerHTML = alertas.length ? alertas.map(m => {
        const s = situacaoMaterial(m);
        return `<div class="item-card"><div><strong>${esc(m.nome)}</strong><small>Saldo: ${fmtQtd(num(m.saldo))} ${esc(m.unidade || '')} · Mínimo: ${fmtQtd(num(m.minimo))}</small></div><span class="badge ${s.cls}">${s.txt}</span></div>`;
    }).join('') : vazio('Nenhum alerta no momento.');

    const recentes = [...S.obras].sort((a, b) => String(b.id).localeCompare(String(a.id))).slice(0, 5);
    $('dashListaObrasRecentes').innerHTML = recentes.length ? recentes.map(o => {
        const cli = porId('clientes', o.clienteId);
        const saldo = S.lancamentos.filter(l => String(l.obraId) === String(o.id))
            .reduce((s, l) => s + (l.tipo === 'receita' ? 1 : -1) * num(l.valor), 0);
        return `<div class="item-card">
            <div><button class="link-button" data-acao="obra" data-id="${esc(o.id)}">${esc(o.nome)}</button>
                <small>Cliente: ${esc(cli ? cli.nome : 'Não vinculado')} · Saldo da obra: ${brl(saldo)}</small></div>
            <span class="valor">${brl(num(o.valor))}</span></div>`;
    }).join('') : vazio('Nenhuma obra cadastrada até o momento.');
}

delegar('dashListaObrasRecentes', { obra: id => abrirObra(id) });
