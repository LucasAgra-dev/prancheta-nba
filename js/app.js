/**
 * Prancheta NBA — lógica da aplicação (SPA por hash, sem dependências).
 * Seções: utilidades · imagens · rotas · telas · carrossel · formulários · acessibilidade.
 */
(function () {
  'use strict';

  /* ================= Utilidades ================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const raiz = document.documentElement;

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Remove acentos para a busca: "doncic" encontra "Dončić".
  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = (t) => normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const num = (v) => v.toFixed(1);
  const dataCurta = (iso) => iso.split('-').reverse().slice(0, 2).join('/');

  const guardar = {
    ler(chave, padrao) {
      try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (e) { return padrao; }
    },
    salvar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* armazenamento bloqueado */ }
    },
    apagar(chave) {
      try { localStorage.removeItem(chave); } catch (e) { /* armazenamento bloqueado */ }
    }
  };

  /* ---------- Índices de dados ---------- */
  const TIME = Object.fromEntries(TIMES.map((t) => [t.id, t]));
  const JOGADORES = [];
  TIMES.forEach((t) => t.jogadores.forEach((j) => {
    j.time = t;
    j.slug = slug(j.nome);
    JOGADORES.push(j);
  }));

  const aproveitamento = (t) => t.vitorias / (t.vitorias + t.derrotas);
  const pct = (t) => aproveitamento(t).toFixed(3).replace(/^0/, '');

  const classificacao = (conf) => TIMES
    .filter((t) => t.conferencia === conf)
    .sort((a, b) => aproveitamento(b) - aproveitamento(a) || b.vitorias - a.vitorias || a.desempate - b.desempate);

  ['Leste', 'Oeste'].forEach((conf) => {
    const lista = classificacao(conf);
    const lider = lista[0];
    lista.forEach((t, i) => {
      t.posicao = i + 1;
      const gb = ((lider.vitorias - t.vitorias) + (t.derrotas - lider.derrotas)) / 2;
      t.gb = i === 0 ? '—' : String(gb);
    });
  });

  /* ---------- Cores com contraste garantido ---------- */
  function luminancia(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const razao = (a, b) => {
    const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  // Preto ou branco: o de maior contraste sempre passa de 4.5:1 sobre uma cor sólida.
  const textoSobre = (fundo) => (razao(fundo, '#000000') >= razao(fundo, '#FFFFFF') ? '#000000' : '#FFFFFF');
  const variaveisTime = (t) =>
    `--banner:${t.cores.banner};--sobre-banner:${textoSobre(t.cores.banner)};` +
    `--bloco:${t.cores.bloco};--sobre-bloco:${textoSobre(t.cores.bloco)}`;

  /* ================= Imagens com fallback SVG ================= */
  const svgURI = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const svg = (viewBox, corpo) => {
    const [, , w, h] = viewBox.split(' ');
    return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${corpo}</svg>`);
  };

  const escudo = (t) => svg('0 0 100 100',
    `<path d="M50 3 93 16v36c0 24-19 38-43 45C26 90 7 76 7 52V16Z" fill="${t.cores.primaria}" stroke="${t.cores.secundaria}" stroke-width="5"/>` +
    `<text x="50" y="58" font-family="Impact,Arial Black,sans-serif" font-size="30" text-anchor="middle" fill="${textoSobre(t.cores.primaria)}">${t.sigla}</text>`);

  const silhueta = (j) => {
    const c = j.time.cores.primaria;
    return svg('0 0 200 250',
      `<rect width="200" height="250" rx="18" fill="#E9ECEF"/>` +
      `<circle cx="100" cy="62" r="34" fill="#6C757D"/><rect x="88" y="88" width="24" height="22" fill="#6C757D"/>` +
      `<path d="M62 108 36 124 18 214h24l18-62v98h80v-98l18 62h24l-18-90-26-16-18-4c-8 18-36 18-44 0Z" fill="#6C757D"/>` +
      `<path d="M66 108h16c6 20 30 20 36 0h16l-2 40 12 18v84H56v-84l12-18Z" fill="${c}" stroke="${j.time.cores.secundaria}" stroke-width="4"/>` +
      `<text x="100" y="205" font-family="Impact,Arial Black,sans-serif" font-size="48" text-anchor="middle" fill="${textoSobre(c)}">${j.numero}</text>`);
  };

  const quadra = (corpo) => svg('0 0 640 360',
    `<rect width="640" height="360" fill="#0B1020"/>` +
    `<g fill="none" stroke="#B87333" stroke-width="3" opacity=".6"><rect x="20" y="20" width="600" height="320"/><path d="M320 20v320"/><circle cx="320" cy="180" r="55"/><path d="M20 70c150 0 150 220 0 220M620 70c-150 0-150 220 0 220"/><path d="M20 130h110v100H20M620 130H510v100h110"/></g>` + corpo);

  const bola = (x, y, r) =>
    `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#C8671F"/><g fill="none" stroke="#2A1305" stroke-width="${r / 18}">` +
    `<circle r="${r}"/><path d="M${-r} 0H${r}M0 ${-r}V${r}M${-r * 0.7} ${-r * 0.72}Q0 0 ${-r * 0.7} ${r * 0.72}M${r * 0.7} ${-r * 0.72}Q0 0 ${r * 0.7} ${r * 0.72}"/></g></g>`;

  const figura = (bracos, extra) => quadra(
    `<g stroke="#E8B48A" stroke-width="22" stroke-linecap="round" fill="none"><path d="${bracos}"/></g>` +
    `<circle cx="320" cy="90" r="32" fill="#E8B48A"/><path d="M275 130h90l-8 110h-74Z" fill="#1D428A" stroke="#FFCC00" stroke-width="4"/>` +
    `<g stroke="#1D428A" stroke-width="30" fill="none"><path d="M300 235l-25 95M342 235l35 90"/></g>` + extra);

  const ARTES = {
    hero: 'assets/images/hero.png',
    'bem-vindo-1': 'assets/images/bem-vindo-1.png',
    'bem-vindo-2': 'assets/images/bem-vindo-2.png',
    'bem-vindo-3': 'assets/images/bem-vindo-3.png',
    'destaque-1': 'assets/images/mia-spurs.png',
    'destaque-2': 'assets/images/lk.png',
    'destaque-3':'assets/images/lakers-spu.png',
    'destaque-4': 'assets/images/astros.png',
  };

  const marcaSVG = 'assets/images/logo.png';

  /**
   * Retorna os atributos src/onerror de uma imagem.
   * Com CONFIG.usarImagensLocais = false usa o SVG direto (console limpo, sem 404).
   */
  const reservas = new Map();
  let contadorReserva = 0;
  const chaves = new Map();
  function atributosImg(caminho, reserva) {
    if (!CONFIG.usarImagensLocais) return `src="${reserva}"`;
    if (!chaves.has(caminho)) {
      chaves.set(caminho, 'r' + (++contadorReserva));
      reservas.set(chaves.get(caminho), reserva);
    }
    return `src="${caminho}" data-reserva="${chaves.get(caminho)}" onerror="PranchetaFallback(this)"`;
  }
  window.PranchetaFallback = (img) => {
    img.onerror = null;
    img.src = reservas.get(img.dataset.reserva);
  };
  function aplicarImg(img, caminho, reserva) {
    if (CONFIG.usarImagensLocais) {
      img.onerror = () => { img.onerror = null; img.src = reserva; };
      img.src = caminho;
    } else {
      img.src = reserva;
    }
  }

  const imgLogo = (t, alt, classe = '', tam = 80) =>
    `<img class="${classe}" ${atributosImg(`assets/logos/${t.id}.png`, escudo(t))} alt="${esc(alt)}" width="${tam}" height="${tam}">`;
  const imgJogador = (j) =>
    `<img ${atributosImg(`assets/images/jogadores/${j.time.id}-${j.slug}.png`, silhueta(j))} alt="Avatar de ${esc(j.nome)}, camisa ${j.numero} do ${esc(j.time.nome)}" width="200" height="250" loading="lazy">`;

  /* ================= Abas acessíveis (padrão WAI-ARIA) ================= */
  function selecionarAba(lista, aba) {
    $$('[role="tab"]', lista).forEach((t) => {
      const ativa = t === aba;
      t.setAttribute('aria-selected', String(ativa));
      t.tabIndex = ativa ? 0 : -1;
    });
  }
  function prepararAbas(lista, aoSelecionar) {
    const abas = $$('[role="tab"]', lista);
    abas.forEach((aba) => aba.addEventListener('click', () => { selecionarAba(lista, aba); aoSelecionar(aba); }));
    lista.addEventListener('keydown', (e) => {
      const i = abas.indexOf(document.activeElement);
      const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 }[e.key];
      if (i < 0 || destino === undefined) return;
      e.preventDefault();
      const aba = abas[(destino + abas.length) % abas.length];
      aba.focus();
      aba.click();
    });
  }
  const alternarPaineis = (aba) => {
    $$('[role="tab"]', aba.parentElement).forEach((t) => {
      document.getElementById(t.getAttribute('aria-controls')).hidden = t !== aba;
    });
  };

  /* ================= Componentes ================= */
  const cardJogador = (j) => `
    <a class="card-link" href="#jogador/${j.time.id}/${j.slug}" style="--cor-card:${j.time.cores.primaria}">
      ${imgJogador(j)}
      <strong>${esc(j.nome)}</strong>
      <span>${j.pos} · #${j.numero} · ${j.time.sigla}</span>
      <dl class="metricas">
        <div><dt>PPG</dt><dd>${num(j.ppg)}</dd></div>
        <div><dt>RPG</dt><dd>${num(j.rpg)}</dd></div>
        <div><dt>APG</dt><dd>${num(j.apg)}</dd></div>
      </dl>
    </a>`;

  const cardTime = (t) => `
    <a class="card-link" href="#time/${t.id}" style="--cor-card:${t.cores.primaria}">
      ${imgLogo(t, `Escudo do ${t.nome}`, '', 110)}
      <strong>${esc(t.nome)}</strong>
      <span>${t.conferencia} · ${t.divisao}</span>
      <span>#${t.posicao} · ${t.vitorias}V ${t.derrotas}D · ${t.jogadores.length} jogadores</span>
    </a>`;

  const NOMES_STATUS = { 'AO VIVO': 'vivo', FINAL: 'final', 'EM BREVE': 'breve' };
  function cardJogo(g) {
    const lados = [g.visitante, g.casa];
    const parciais = [0, 1, 2, 3];
    const linha = (id, i) => {
      const t = TIME[id];
      const q = g.quartos ? g.quartos[i === 0 ? 'visitante' : 'casa'] : [];
      return `<tr><th scope="row"><a class="time-celula" href="#time/${id}">${imgLogo(t, '', '', 22)}<abbr title="${esc(t.nome)}">${t.sigla}</abbr></a></th>
        ${parciais.map((p) => `<td>${q[p] ?? '–'}</td>`).join('')}
        <td class="total">${q.length ? q.reduce((a, b) => a + b, 0) : '–'}</td></tr>`;
    };
    const quando = g.status === 'AO VIVO' ? `${g.periodo}º quarto` : `${dataCurta(g.data)} · ${g.hora} ET`;
    return `<article class="card jogo" aria-label="${esc(TIME[g.visitante].nome)} contra ${esc(TIME[g.casa].nome)}">
      <div class="jogo__topo"><span class="badge badge--${NOMES_STATUS[g.status]}">${g.status}</span><span>${quando}</span></div>
      <table><caption class="sr-only">Placar por quarto (visitante na primeira linha)</caption>
        <thead><tr><th scope="col">Time</th><th scope="col">Q1</th><th scope="col">Q2</th><th scope="col">Q3</th><th scope="col">Q4</th><th scope="col">Total</th></tr></thead>
        <tbody>${lados.map(linha).join('')}</tbody></table>
    </article>`;
  }

  /* ================= Tela JOGOS ================= */
  function iniciarJogos() {
    const sel = $('#jogos-data');
    const datas = [...new Set(JOGOS.map((g) => g.data))];
    sel.innerHTML = '<option value="">Todas as datas</option>' + datas.map((d) =>
      `<option value="${d}">${dataCurta(d)}${d === CONFIG.dataReferencia ? ' (hoje)' : ''}</option>`).join('');
    sel.value = CONFIG.dataReferencia;
    $('#filtros-jogos').addEventListener('change', renderJogos);
    $('#filtros-jogos').addEventListener('submit', (e) => e.preventDefault());
    renderJogos();
  }
  function renderJogos() {
    const data = $('#jogos-data').value;
    const status = $('#jogos-status').value;
    const lista = JOGOS.filter((g) => (!data || g.data === data) && (!status || g.status === status));
    $('#jogos-contador').textContent = `${lista.length} ${lista.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}`;
    $('#lista-jogos').innerHTML = lista.map(cardJogo).join('') || '<p>Nenhum jogo para este filtro. Tente outra data ou status.</p>';
  }

  /* ================= Tela CLASSIFICAÇÃO ================= */
  function iniciarClassificacao() {
    [['Leste', 'leste', 'Eastern Conference'], ['Oeste', 'oeste', 'Western Conference']].forEach(([conf, id, titulo]) => {
      const linhas = classificacao(conf).map((t) => {
        const corte = t.posicao === 6 ? 'corte-playoffs' : t.posicao === 10 ? 'corte-playin' : '';
        const zona = t.posicao <= 6 ? '<span class="selo selo--po" title="Zona de Playoffs"><span aria-hidden="true">P</span><span class="sr-only">Playoffs</span></span>'
          : t.posicao <= 10 ? '<span class="selo selo--pi" title="Zona de Play-In"><span aria-hidden="true">PI</span><span class="sr-only">Play-In</span></span>' : '';
        const seq = t.sequencia;
        const seqTexto = `${seq[0] === 'W' ? 'V' : 'D'}${seq.slice(1)}`;
        return `<tr class="${corte}">
          <th scope="row"><a class="time-celula" href="#time/${t.id}"><span>#${t.posicao}</span>${imgLogo(t, `Escudo do ${t.nome}`, '', 28)}<span>${esc(t.nome)}</span></a> ${zona}</th>
          <td>${t.vitorias}</td><td>${t.derrotas}</td><td>${pct(t)}</td><td>${t.gb}</td>
          <td>${seqTexto}</td></tr>`;
      }).join('');
      $(`#painel-${id}`).innerHTML = `<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela ${titulo}, role para o lado se necessário">
        <table><caption>${titulo}</caption>
        <thead><tr><th scope="col">Time</th><th scope="col"><abbr title="Vitórias">V</abbr></th><th scope="col"><abbr title="Derrotas">D</abbr></th>
        <th scope="col"><abbr title="Aproveitamento">%</abbr></th><th scope="col"><abbr title="Jogos atrás do líder">GB</abbr></th>
        <th scope="col"><abbr title="Sequência: V de vitórias, D de derrotas">STRK</abbr></th></tr></thead>
        <tbody>${linhas}</tbody></table></div>`;
    });
    prepararAbas($('#view-classificacao [role="tablist"]'), alternarPaineis);
  }

  /* ================= Abas de PESQUISA ================= */
  const pesquisa = { aba: 'jogadores', limite: 24, comparar: ['lal/luka-doncic', 'den/nikola-jokic'] };
  const METRICAS = { ppg: 'PPG', rpg: 'RPG', apg: 'APG' };
  const jogadorPorChave = (c) => JOGADORES.find((j) => `${j.time.id}/${j.slug}` === c);

  function filtros() {
    return {
      nome: normalizar($('#f-nome').value.trim()),
      conf: $('#f-conf').value,
      div: $('#f-div').value,
      time: $('#f-time').value,
      pos: $('#f-pos').value,
      ordem: $('#f-ordem').value
    };
  }
  const passaTime = (t, f) =>
    (!f.conf || t.conferencia === f.conf) && (!f.div || t.divisao === f.div) && (!f.time || t.id === f.time);
  const filtrarJogadores = (f) => JOGADORES
    .filter((j) => passaTime(j.time, f) && (!f.pos || j.pos === f.pos) && (!f.nome || normalizar(j.nome).includes(f.nome)))
    .sort((a, b) => b[f.ordem] - a[f.ordem] || a.nome.localeCompare(b.nome));

  function iniciarPesquisa() {
    const divisoes = [...new Set(TIMES.map((t) => t.divisao))];
    $('#f-div').insertAdjacentHTML('beforeend', divisoes.map((d) => `<option>${d}</option>`).join(''));
    const opcoes = [...TIMES].sort((a, b) => a.nome.localeCompare(b.nome))
      .map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');
    $('#f-time').insertAdjacentHTML('beforeend', opcoes);
    $('#cad-time').insertAdjacentHTML('beforeend', opcoes);

    const form = $('#filtros');
    const atualizar = () => { pesquisa.limite = 24; renderPesquisa(); };
    form.addEventListener('input', atualizar);
    form.addEventListener('change', atualizar);
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('reset', () => setTimeout(atualizar, 0));
    prepararAbas($('#view-pesquisa [role="tablist"]'), (aba) => {
      history.replaceState(null, '', '#' + aba.dataset.pesquisa);
      marcarNavegacao(aba.dataset.pesquisa);
      mostrarAbaPesquisa(aba.dataset.pesquisa);
    });
  }

  function mostrarAbaPesquisa(nome) {
    pesquisa.aba = nome;
    pesquisa.limite = 24;
    const aba = $(`#tab-${nome}`);
    selecionarAba(aba.parentElement, aba);
    $('#painel-pesquisa').setAttribute('aria-labelledby', aba.id);
    $$('[data-so-jogador]').forEach((el) => { el.hidden = nome === 'times'; });
    $('#f-nome').placeholder = nome === 'times' ? 'Ex.: Celtics' : 'Ex.: Doncic';
    renderPesquisa();
  }

  function renderPesquisa() {
    const f = filtros();
    const painel = $('#painel-pesquisa');
    const contador = $('#contador');
    const vazio = '<p>Nenhum resultado. Ajuste a busca ou use “Limpar filtros”.</p>';
    const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

    if (pesquisa.aba === 'times') {
      const lista = TIMES.filter((t) => passaTime(t, f) && (!f.nome || normalizar(`${t.nome} ${t.sigla}`).includes(f.nome)))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      contador.textContent = plural(lista.length, 'time encontrado', 'times encontrados');
      painel.innerHTML = lista.length ? `<div class="grade">${lista.map(cardTime).join('')}</div>` : vazio;
      return;
    }

    const lista = filtrarJogadores(f);
    contador.textContent = plural(lista.length, 'jogador encontrado', 'jogadores encontrados');

    if (pesquisa.aba === 'jogadores') {
      const visiveis = lista.slice(0, pesquisa.limite);
      painel.innerHTML = lista.length ? `<div class="grade">${visiveis.map(cardJogador).join('')}</div>` +
        (lista.length > visiveis.length ? `<p class="centro"><button type="button" class="botao-secundario" id="btn-mais">Mostrar mais (${visiveis.length} de ${lista.length})</button></p>` : '')
        : vazio;
      const mais = $('#btn-mais');
      if (mais) mais.addEventListener('click', () => {
        const primeiroNovo = pesquisa.limite;
        pesquisa.limite += 24;
        renderPesquisa();
        $$('.card-link', painel)[primeiroNovo].focus();
      });
    } else if (pesquisa.aba === 'estatisticas') {
      renderEstatisticas(painel, lista, vazio);
    } else {
      renderRankings(painel, lista, f, vazio);
    }
  }

  function renderEstatisticas(painel, lista, vazio) {
    const lideres = (chave, titulo) => {
      const top = [...lista].sort((a, b) => b[chave] - a[chave]).slice(0, 5);
      return `<article class="card lider"><h3>${titulo}</h3><ol>${top.map((j) =>
        `<li><a href="#jogador/${j.time.id}/${j.slug}">${esc(j.nome)}</a> (${j.time.sigla}) — <strong>${num(j[chave])}</strong></li>`).join('')}</ol></article>`;
    };
    const blocos = lista.length ? `<h2>Líderes estatísticos</h2><div class="grade">
      ${lideres('ppg', 'Pontos (PPG)')}${lideres('rpg', 'Rebotes (RPG)')}${lideres('apg', 'Assistências (APG)')}${lideres('per', 'Eficiência (PER)')}</div>` : vazio;

    const ordenados = [...JOGADORES].sort((a, b) => a.nome.localeCompare(b.nome));
    const seletor = (i) => `<label>Jogador ${i + 1}<select data-comparar="${i}">${ordenados.map((j) => {
      const c = `${j.time.id}/${j.slug}`;
      return `<option value="${c}"${c === pesquisa.comparar[i] ? ' selected' : ''}>${esc(j.nome)} (${j.time.sigla})</option>`;
    }).join('')}</select></label>`;

    painel.innerHTML = `${blocos}
      <section class="comparador" aria-labelledby="titulo-comparar">
        <h2 id="titulo-comparar">Comparação direta (Head-to-Head)</h2>
        <div class="filtros">${seletor(0)}${seletor(1)}</div>
        <div class="tabela-rolagem" id="tabela-comparar" aria-live="polite"></div>
      </section>`;

    const comparar = () => {
      const [a, b] = pesquisa.comparar.map(jogadorPorChave);
      const linhas = [['ppg', 'PPG'], ['rpg', 'RPG'], ['apg', 'APG'], ['spg', 'Roubos'], ['bpg', 'Tocos'], ['fg', 'FG%'], ['per', 'PER']]
        .map(([k, rotulo]) => {
          const cel = (x, y) => `<td>${x > y ? `<strong>▲ ${num(x)}<span class="sr-only"> (melhor)</span></strong>` : num(x)}</td>`;
          return `<tr><th scope="row">${rotulo}</th>${cel(a[k], b[k])}${cel(b[k], a[k])}</tr>`;
        }).join('');
      $('#tabela-comparar').innerHTML = `<table><caption class="sr-only">Comparação entre ${esc(a.nome)} e ${esc(b.nome)}</caption>
        <thead><tr><th scope="col">Métrica</th><th scope="col">${esc(a.nome)}</th><th scope="col">${esc(b.nome)}</th></tr></thead><tbody>${linhas}</tbody></table>`;
    };
    $$('[data-comparar]', painel).forEach((s) => s.addEventListener('change', () => {
      pesquisa.comparar[Number(s.dataset.comparar)] = s.value;
      comparar();
    }));
    comparar();
  }

  function renderRankings(painel, lista, f, vazio) {
    if (!lista.length) { painel.innerHTML = vazio; return; }
    const linhas = lista.slice(0, 25).map((j, i) => `<tr>
      <td>${i + 1}º</td><th scope="row"><a href="#jogador/${j.time.id}/${j.slug}">${esc(j.nome)}</a></th>
      <td>${j.time.sigla}</td><td>${j.pos}</td><td>${num(j.ppg)}</td><td>${num(j.rpg)}</td><td>${num(j.apg)}</td></tr>`).join('');
    painel.innerHTML = `<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Ranking de jogadores">
      <table><caption>Top ${Math.min(25, lista.length)} por ${METRICAS[f.ordem]}</caption>
      <thead><tr><th scope="col">Pos.</th><th scope="col" class="esq">Jogador</th><th scope="col">Time</th><th scope="col">Função</th><th scope="col">PPG</th><th scope="col">RPG</th><th scope="col">APG</th></tr></thead>
      <tbody>${linhas}</tbody></table></div>`;
  }

  /* ================= Tela do TIME ================= */
  const media = (lista, k) => lista.reduce((s, j) => s + j[k], 0) / lista.length;

  function renderTime(t) {
    const view = $('#view-time');
    const jogosDoTime = JOGOS.filter((g) => g.visitante === t.id || g.casa === t.id);
    const proximos = jogosDoTime.filter((g) => g.status === 'EM BREVE').slice(0, 6);
    const confIngles = t.conferencia === 'Leste' ? 'EASTERN CONFERENCE' : 'WESTERN CONFERENCE';
    const elenco = [...t.jogadores].sort((a, b) => a.numero - b.numero);
    const rotacao = [...t.jogadores].sort((a, b) => b.min - a.min).slice(0, 10);

    view.innerHTML = `
      <div class="time-topo" style="${variaveisTime(t)}">
        <div class="time-topo__interno">
          ${imgLogo(t, `Escudo do ${t.nome}`, 'time-topo__logo', 150)}
          <div>
            <h1>${esc(t.nome.toUpperCase())}</h1>
            <p>#${t.posicao} ${confIngles} · ${t.vitorias}-${t.derrotas}</p>
            <div class="abas" role="tablist" aria-label="Seções do time">
              <button type="button" role="tab" id="tt-jog" aria-controls="tp-jog" aria-selected="true">Jogadores</button>
              <button type="button" role="tab" id="tt-est" aria-controls="tp-est" aria-selected="false" tabindex="-1">Estatísticas</button>
              <button type="button" role="tab" id="tt-jgs" aria-controls="tp-jgs" aria-selected="false" tabindex="-1">Jogos</button>
            </div>
          </div>
        </div>
      </div>
      <div class="container">
        <aside class="proximos" aria-labelledby="titulo-prox">
          <h2 id="titulo-prox">Upcoming Games <span class="sr-only">(próximos jogos)</span></h2>
          <ul tabindex="0" aria-label="Próximos jogos, role para o lado">${proximos.map((g) => {
            const fora = g.visitante === t.id;
            const adv = TIME[fora ? g.casa : g.visitante];
            return `<li><span>${dataCurta(g.data)} · ${g.hora} ET</span>
              <strong><a class="time-celula" href="#time/${adv.id}">${imgLogo(adv, '', '', 28)}${fora ? '@' : 'vs.'} ${adv.sigla}</a></strong>
              <span>${fora ? 'Fora de casa' : 'Em casa'} · ${adv.vitorias}-${adv.derrotas}</span></li>`;
          }).join('')}</ul>
        </aside>

        <div role="tabpanel" id="tp-jog" aria-labelledby="tt-jog" tabindex="0">
          <h2>Elenco (${elenco.length} jogadores)</h2>
          <div class="grade">${elenco.map(cardJogador).join('')}</div>
        </div>

        <div role="tabpanel" id="tp-est" aria-labelledby="tt-est" tabindex="0" hidden>
          <dl class="bio" style="${variaveisTime(t)}">
            <div><dt>Campanha</dt><dd>${t.vitorias}V – ${t.derrotas}D</dd></div>
            <div><dt>Aproveitamento</dt><dd>${pct(t)}</dd></div>
            <div><dt>Divisão</dt><dd>${t.divisao}</dd></div>
            <div><dt>FG% médio (rotação)</dt><dd>${num(media(rotacao, 'fg'))}%</dd></div>
          </dl>
          <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Médias do elenco">
            <table><caption>Médias por jogo</caption>
              <thead><tr><th scope="col">Jogador</th><th scope="col">Pos</th><th scope="col">J</th><th scope="col">MIN</th><th scope="col">PPG</th><th scope="col">RPG</th><th scope="col">APG</th><th scope="col">FG%</th><th scope="col">PER</th></tr></thead>
              <tbody>${[...t.jogadores].sort((a, b) => b.ppg - a.ppg).map((j) => `<tr>
                <th scope="row"><a href="#jogador/${t.id}/${j.slug}">${esc(j.nome)}</a></th><td>${j.pos}</td><td>${j.jogos}</td><td>${num(j.min)}</td>
                <td>${num(j.ppg)}</td><td>${num(j.rpg)}</td><td>${num(j.apg)}</td><td>${num(j.fg)}</td><td>${num(j.per)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>

        <div role="tabpanel" id="tp-jgs" aria-labelledby="tt-jgs" tabindex="0" hidden>
          <h2>Jogos recentes e agenda</h2>
          <div class="grade grade--jogos">${jogosDoTime.map(cardJogo).join('')}</div>
        </div>
      </div>`;
    prepararAbas($('[role="tablist"]', view), alternarPaineis);
  }

  /* ================= Tela do JOGADOR ================= */
  function renderJogador(j) {
    const t = j.time;
    const view = $('#view-jogador');
    const ultimos = ULTIMOS_JOGOS_PROTOTIPO[j.nome];
    const barras = [['PPG', j.ppg, 40], ['RPG', j.rpg, 15], ['APG', j.apg, 12], ['FG%', j.fg, 100], ['3P%', j.tp, 100], ['LL%', j.ft, 100], ['PER', j.per, 35]];

    view.innerHTML = `
      <div class="jogador-topo" style="${variaveisTime(t)}">
        <div class="jogador-topo__interno">
          <div class="jogador-topo__foto">
            ${imgLogo(t, '', '', 300)}
            ${imgJogador(j)}
          </div>
          <div>
            <h1><span>${j.pos}</span> ${esc(j.nome.toUpperCase())} <span class="jogador-topo__numero">#${j.numero}</span></h1>
            <a class="jogador-topo__time" href="#time/${t.id}">${imgLogo(t, `Escudo do ${t.nome}`, '', 40)} ${esc(t.nome)}</a>
            <div class="abas" role="tablist" aria-label="Seções do jogador">
              <button type="button" role="tab" id="jt-est" aria-controls="jp-est" aria-selected="true">Estatísticas</button>
              <button type="button" role="tab" id="jt-bio" aria-controls="jp-bio" aria-selected="false" tabindex="-1">Bio</button>
            </div>
            <dl class="destaques">
              <div><dt>PPG</dt><dd>${num(j.ppg)}</dd></div>
              <div><dt>RPG</dt><dd>${num(j.rpg)}</dd></div>
              <div><dt>APG</dt><dd>${num(j.apg)}</dd></div>
              <div><dt>FG%</dt><dd>${num(j.fg)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
      <div class="container">
        <p><a class="botao-secundario" href="#time/${t.id}">← Voltar para o elenco do time</a></p>
        <p class="nota">Dados ilustrativos para fins acadêmicos.</p>

        <div role="tabpanel" id="jp-est" aria-labelledby="jt-est" tabindex="0">
          <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Estatísticas da temporada">
            <table><caption>Temporada ${CONFIG.temporada}</caption>
              <thead><tr><th scope="col">Time</th><th scope="col">J</th><th scope="col">MIN</th><th scope="col">PPG</th><th scope="col">RPG</th><th scope="col">APG</th><th scope="col">ROU</th><th scope="col">TOC</th><th scope="col">FG%</th><th scope="col">3P%</th><th scope="col">LL%</th><th scope="col">PER</th></tr></thead>
              <tbody><tr><th scope="row">${t.sigla}</th><td>${j.jogos}</td><td>${num(j.min)}</td><td>${num(j.ppg)}</td><td>${num(j.rpg)}</td><td>${num(j.apg)}</td><td>${num(j.spg)}</td><td>${num(j.bpg)}</td><td>${num(j.fg)}</td><td>${num(j.tp)}</td><td>${num(j.ft)}</td><td>${num(j.per)}</td></tr></tbody>
            </table>
          </div>
          <h2>Desempenho</h2>
          <ul class="barras">${barras.map(([r, v, max]) =>
            `<li><span>${r}</span><span class="barra" aria-hidden="true"><span style="width:${Math.min(100, (v / max) * 100)}%"></span></span><span>${num(v)}</span></li>`).join('')}</ul>
          ${ultimos ? `<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Últimos cinco jogos">
            <table><caption>Últimos 5 jogos</caption>
              <thead><tr><th scope="col">Data</th><th scope="col">Jogo</th><th scope="col">V/D</th><th scope="col">MIN</th><th scope="col">PTS</th><th scope="col">REB</th><th scope="col">AST</th></tr></thead>
              <tbody>${ultimos.map((u) => `<tr><th scope="row">${u.data}</th><td>${t.sigla} ${u.jogo}</td><td>${u.res}</td><td>${u.min}</td><td>${u.pts}</td><td>${u.reb}</td><td>${u.ast}</td></tr>`).join('')}</tbody>
            </table></div>` : ''}
        </div>

        <div role="tabpanel" id="jp-bio" aria-labelledby="jt-bio" tabindex="0" hidden>
          <dl class="bio" style="${variaveisTime(t)}">
            <div><dt>Altura</dt><dd>${j.altura.toFixed(2).replace('.', ',')} m</dd></div>
            <div><dt>Peso</dt><dd>${j.peso} kg</dd></div>
            <div><dt>Idade</dt><dd>${j.idade} anos</dd></div>
            <div><dt>Draft</dt><dd>${j.draft || 'Não informado'}</dd></div>
            <div><dt>Franquia atual</dt><dd>${esc(t.nome)}</dd></div>
            <div><dt>Posição / Camisa</dt><dd>${j.pos} · #${j.numero}</dd></div>
          </dl>
        </div>
      </div>`;
    prepararAbas($('[role="tablist"]', view), alternarPaineis);
  }

  /* ================= Rotas (SPA por hash) ================= */
  const VIEWS_PESQUISA = ['jogadores', 'times', 'estatisticas', 'rankings'];
  const TITULOS = { inicio: 'Início', jogos: 'Jogos', classificacao: 'Classificação', jogadores: 'Jogadores', times: 'Times',
    estatisticas: 'Estatísticas', rankings: 'Rankings', contato: 'Contato', login: 'Login', 'criar-conta': 'Criar conta', privacidade: 'Privacidade' };

  function marcarNavegacao(rota) {
    $$('.navbar [data-rota]').forEach((a) => {
      if (a.dataset.rota === rota) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function navegar(moverFoco) {
    let [rota, a, b] = location.hash.slice(1).split('/');
    let view = rota || 'inicio';
    let titulo = TITULOS[view];
    let marcada = view;

    if (view === 'time' && TIME[a]) {
      renderTime(TIME[a]);
      titulo = TIME[a].nome;
      marcada = 'times';
    } else if (view === 'jogador' && TIME[a] && TIME[a].jogadores.some((j) => j.slug === b)) {
      const jogador = TIME[a].jogadores.find((j) => j.slug === b);
      renderJogador(jogador);
      titulo = jogador.nome;
      marcada = 'jogadores';
    } else if (!TITULOS[view]) {
      view = marcada = 'inicio';
      titulo = TITULOS.inicio;
    }

    let secao = view;
    if (VIEWS_PESQUISA.includes(view)) { secao = 'pesquisa'; mostrarAbaPesquisa(view); }
    if (view === 'login' || view === 'criar-conta') {
      secao = 'login';
      const cadastro = view === 'criar-conta';
      $('#form-login').hidden = cadastro;
      $('#form-cadastro').hidden = !cadastro;
      $('#titulo-login').textContent = cadastro ? 'CRIAR CONTA' : 'LOGIN';
    }

    $$('.view').forEach((v) => { v.hidden = v.id !== `view-${secao}`; });
    $('#hero').hidden = secao !== 'inicio';
    // O título da home fica no hero; nas demais telas cada seção tem o próprio h1.
    marcarNavegacao(marcada);
    document.title = `${titulo} — Prancheta NBA`;
    fecharMenu();
    fecharPainel(false);
    carrossel.atualizarVisibilidade(secao === 'inicio');

    window.scrollTo({ top: 0, behavior: 'instant' });
    if (moverFoco) $('#conteudo').focus({ preventScroll: true });
  }

  /* ================= Menu mobile ================= */
  const btnMenu = $('#btn-menu');
  function fecharMenu() {
    $('#menu').classList.remove('aberto');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-label', 'Abrir menu');
  }
  btnMenu.addEventListener('click', () => {
    const abrir = btnMenu.getAttribute('aria-expanded') !== 'true';
    $('#menu').classList.toggle('aberto', abrir);
    btnMenu.setAttribute('aria-expanded', String(abrir));
    btnMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    // No celular, garante que a barra esteja no topo para o menu caber na tela.
    if (abrir) $('.navbar').scrollIntoView({ block: 'start' });
  });

  /* ================= Carrossel ================= */
  const carrossel = (function () {
    const topo = (k) => [...JOGADORES].sort((a, b) => b[k] - a[k])[0];
    let atual = 0;
    let timer = null;
    let pausadoPeloUsuario = false;
    let ocupado = false;     // mouse ou foco sobre o carrossel
    let visivel = true;
    let slides = [];

    const semMovimento = () => raiz.dataset.animacoes === 'reduzidas' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ir(i, anunciar) {
      atual = (i + slides.length) % slides.length;
      $('#trilho').style.transform = `translateX(-${atual * 100}%)`;
      slides.forEach((s, n) => {
        s.classList.toggle('ativo', n === atual);
        s.setAttribute('aria-hidden', String(n !== atual));
      });
      $$('#car-bolinhas button').forEach((b, n) => b.setAttribute('aria-current', String(n === atual)));
      if (anunciar) $('#car-status').textContent = `Slide ${atual + 1} de ${slides.length}: ${$('h3', slides[atual]).textContent}`;
    }
    function agendar() {
      clearInterval(timer);
      timer = null;
      if (!pausadoPeloUsuario && !ocupado && visivel) timer = setInterval(() => ir(atual + 1, false), 6000);
    }
    function rotuloPausa() {
      $('#car-pausa').textContent = pausadoPeloUsuario ? '▶ Reproduzir' : '❚❚ Pausar';
    }

    return {
      iniciar() {
        const cestinha = topo('ppg');
        const garcom = topo('apg');
        const reboteiro = topo('rpg');
        const final = JOGOS.find((g) => g.data === CONFIG.dataReferencia && g.status === 'FINAL');
        const soma = (l) => l.reduce((x, y) => x + y, 0);
        const dados = [
          ['Destaques da rodada', `${TIME[final.visitante].sigla} ${soma(final.quartos.visitante)} × ${soma(final.quartos.casa)} ${TIME[final.casa].sigla}`,
            'Confira os placares por quarto de todos os jogos do dia.', '#jogos', 'Ver jogos'],
          ['Líderes estatísticos', `${cestinha.nome}: ${num(cestinha.ppg)} PPG`,
            `${reboteiro.nome} lidera os rebotes (${num(reboteiro.rpg)}) e ${garcom.nome}, as assistências (${num(garcom.apg)}).`, '#estatisticas', 'Ver líderes'],
          ['Duelo da semana', 'Lakers × Spurs', `27/11, 21:30 ET: o líder do Oeste (${TIME.lal.vitorias}-${TIME.lal.derrotas}) visita o ${TIME.sas.nome} (${TIME.sas.vitorias}-${TIME.sas.derrotas}).`, '#time/lal', 'Ver os Lakers'],
          ['Análise tática', 'Compare os astros', 'Coloque dois jogadores lado a lado e descubra quem leva vantagem em cada métrica.', '#estatisticas', 'Abrir comparador']
        ];
        const alts = ['Bola de basquete no centro da quadra', 'Gráfico de barras sobre a quadra', 'Duas bolas de basquete frente a frente', 'Prancheta tática com movimentação de jogadores'];
        $('#trilho').innerHTML = dados.map(([etiqueta, titulo, texto, link, acao], i) => `
          <article class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${dados.length}">
            <img ${atributosImg(`assets/images/destaque-${i + 1}.jpg`, ARTES[`destaque-${i + 1}`])} alt="${alts[i]}" width="640" height="360">
            <div class="slide__texto"><span class="etiqueta">${etiqueta}</span><h3>${esc(titulo)}</h3><p>${esc(texto)}</p><a href="${link}">${acao} →</a></div>
          </article>`).join('');
        slides = $$('.slide');
        $('#car-bolinhas').innerHTML = dados.map((d, i) => `<button type="button" aria-label="Ir para o slide ${i + 1}: ${d[0]}"></button>`).join('');

        const manual = (i) => { ir(i, true); agendar(); };
        $('#car-anterior').addEventListener('click', () => manual(atual - 1));
        $('#car-proximo').addEventListener('click', () => manual(atual + 1));
        $$('#car-bolinhas button').forEach((b, i) => b.addEventListener('click', () => manual(i)));
        $('#car-pausa').addEventListener('click', () => {
          pausadoPeloUsuario = !pausadoPeloUsuario;
          // Ao pedir "Reproduzir", o carrossel volta a andar mesmo com o foco no botão.
          ocupado = false;
          rotuloPausa();
          agendar();
        });
        const caixa = $('#carrossel');
        caixa.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); manual(atual - 1); }
          if (e.key === 'ArrowRight') { e.preventDefault(); manual(atual + 1); }
        });
        const janela = $('.carrossel__janela');
        ['mouseenter', 'focusin'].forEach((ev) => janela.addEventListener(ev, () => { ocupado = true; agendar(); }));
        ['mouseleave', 'focusout'].forEach((ev) => janela.addEventListener(ev, () => { ocupado = false; agendar(); }));

        pausadoPeloUsuario = semMovimento();
        rotuloPausa();
        ir(0, false);
        agendar();
      },
      atualizarVisibilidade(v) { visivel = v; agendar(); },
      pausar() { pausadoPeloUsuario = true; rotuloPausa(); agendar(); }
    };
  })();

  /* ================= Formulários ================= */
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const regras = {
    'login-email': (v) => !v ? 'Informe seu e-mail.' : !emailValido(v) ? 'E-mail inválido. Use o formato nome@exemplo.com.' : '',
    'login-senha': (v) => !v ? 'Informe sua senha.' : v.length < 8 ? 'A senha tem pelo menos 8 caracteres.' : '',
    'cad-nome': (v) => v.trim().length < 3 ? 'Digite seu nome (mínimo de 3 letras).' : '',
    'cad-email': (v) => regras['login-email'](v),
    'cad-time': (v) => !v ? 'Escolha seu time favorito.' : '',
    'cad-senha': (v) => v.length < 8 || !/[a-zA-Z]/.test(v) || !/\d/.test(v) ? 'Use ao menos 8 caracteres, com letras e números.' : '',
    'cad-confirma': (v) => !v ? 'Repita a senha.' : v !== $('#cad-senha').value ? 'As senhas não coincidem. Digite novamente.' : '',
    'c-nome': (v) => regras['cad-nome'](v),
    'c-email': (v) => regras['login-email'](v),
    'c-assunto': (v) => !v ? 'Selecione um assunto.' : '',
    'c-msg': (v) => v.trim().length < 10 ? 'Escreva uma mensagem com pelo menos 10 caracteres.' : ''
  };

  function validar(campo) {
    const erro = regras[campo.id](campo.value);
    campo.setAttribute('aria-invalid', String(Boolean(erro)));
    $(`#erro-${campo.id}`).textContent = erro;
    return !erro;
  }

  function prepararFormulario(form, status, aoEnviar) {
    const campos = $$('input, select, textarea', form);
    const caixa = $(status);
    campos.forEach((c) => {
      // Valida ao sair do campo e, depois de um erro, a cada digitação.
      c.addEventListener('blur', () => { if (c.value) validar(c); });
      c.addEventListener('input', () => {
        caixa.textContent = '';
        caixa.className = 'status';
        if (c.hasAttribute('aria-invalid')) validar(c);
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalidos = campos.filter((c) => !validar(c));
      if (invalidos.length) {
        caixa.className = 'status falha';
        caixa.textContent = `Corrija ${invalidos.length === 1 ? 'o campo destacado' : `os ${invalidos.length} campos destacados`}.`;
        invalidos[0].focus();
        return;
      }
      caixa.className = 'status ok';
      caixa.textContent = aoEnviar();
      form.reset();
      campos.forEach((c) => c.removeAttribute('aria-invalid'));
    });
  }

  function iniciarFormularios() {
    prepararFormulario($('#form-login'), '#status-login', () => {
      const perfil = guardar.ler('prancheta-perfil', null);
      return `✔ Login simulado com sucesso${perfil ? `, ${perfil.nome}` : ''}!`;
    });
    prepararFormulario($('#form-cadastro'), '#status-cadastro', () => {
      const nome = $('#cad-nome').value.trim();
      const time = $('#cad-time').value;
      guardar.salvar('prancheta-perfil', { nome, time });
      return `✔ Conta de demonstração criada, ${nome}! Time favorito: ${TIME[time].nome}.`;
    });
    prepararFormulario($('#form-contato'), '#status-contato', () => {
      const nome = $('#c-nome').value.trim();
      const assunto = $('#c-assunto').value;
      setTimeout(() => { $('#conta-msg').textContent = '0/600 caracteres (mínimo 10)'; }, 0);
      return `✔ Envio confirmado! Obrigado, ${nome}. Assunto registrado: ${assunto}. (Simulação: nenhuma mensagem é transmitida.)`;
    });
    $('#c-msg').addEventListener('input', (e) => {
      $('#conta-msg').textContent = `${e.target.value.length}/600 caracteres (mínimo 10)`;
    });
    $$('[data-ver]').forEach((btn) => btn.addEventListener('click', () => {
      const campo = $(`#${btn.dataset.ver}`);
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      btn.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      btn.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      btn.setAttribute('aria-pressed', String(mostrar));
    }));
    $('#btn-esqueci').addEventListener('click', () => {
      const email = $('#login-email');
      const status = $('#status-login');
      if (!validar(email)) {
        status.className = 'status falha';
        status.textContent = 'Preencha o campo EMAIL para recuperar a senha.';
        email.focus();
        return;
      }
      status.className = 'status ok';
      status.textContent = `Simulação: um link de recuperação seria enviado para ${email.value}.`;
    });
    $('#btn-apagar').addEventListener('click', () => {
      guardar.apagar('prancheta-perfil');
      guardar.apagar('prancheta-a11y');
      prefs = { ...padraoPrefs() };
      aplicarPrefs();
      $('#status-priv').className = 'status ok';
      $('#status-priv').textContent = 'Dados apagados.';
    });
  }

  /* ================= Acessibilidade ================= */
  const FONTES = [87.5, 100, 115, 130];
  const padraoPrefs = () => ({
    tema: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro',
    fonte: 100, contraste: false, animacoes: false
  });
  let prefs = { ...padraoPrefs(), ...guardar.ler('prancheta-a11y', {}) };

  function aplicarPrefs() {
    raiz.dataset.tema = prefs.tema;
    raiz.style.fontSize = prefs.fonte + '%';
    raiz.toggleAttribute('data-contraste', prefs.contraste);
    if (prefs.contraste) raiz.setAttribute('data-contraste', 'alto');
    raiz.toggleAttribute('data-animacoes', prefs.animacoes);
    if (prefs.animacoes) raiz.setAttribute('data-animacoes', 'reduzidas');

    const marcar = (acao, v) => $(`[data-a11y="${acao}"]`).setAttribute('aria-pressed', String(v));
    marcar('claro', prefs.tema === 'claro');
    marcar('escuro', prefs.tema === 'escuro');
    marcar('contraste', prefs.contraste);
    marcar('animacoes', prefs.animacoes);
    $('#valor-fonte').textContent = `${prefs.fonte}%`;

    const escuro = prefs.tema === 'escuro';
    const btn = $('#btn-tema');
    btn.setAttribute('aria-pressed', String(escuro));
    btn.innerHTML = `${escuro ? '☀️' : '🌙'} <span>TEMA ESCURO</span>`;
  }

  function mudarPrefs(acao) {
    const i = FONTES.indexOf(prefs.fonte);
    const acoes = {
      claro: () => { prefs.tema = 'claro'; },
      escuro: () => { prefs.tema = 'escuro'; },
      'fonte-menor': () => { prefs.fonte = FONTES[Math.max(0, i - 1)]; },
      'fonte-padrao': () => { prefs.fonte = 100; },
      'fonte-maior': () => { prefs.fonte = FONTES[Math.min(FONTES.length - 1, i + 1)]; },
      contraste: () => { prefs.contraste = !prefs.contraste; },
      animacoes: () => { prefs.animacoes = !prefs.animacoes; if (prefs.animacoes) carrossel.pausar(); },
      resetar: () => { prefs = padraoPrefs(); }
    };
    acoes[acao]();
    aplicarPrefs();
    if (acao === 'resetar') guardar.apagar('prancheta-a11y');
    else guardar.salvar('prancheta-a11y', prefs);
  }

  const painel = $('#painel-a11y');
  const btnA11y = $('#btn-a11y');
  function fecharPainel(devolverFoco) {
    if (painel.hidden) return;
    painel.hidden = true;
    btnA11y.setAttribute('aria-expanded', 'false');
    if (devolverFoco) {
      // No celular o botão fica dentro do menu; reabre para o foco não se perder.
      if (btnA11y.offsetParent === null) btnMenu.focus();
      else btnA11y.focus();
    }
  }
  function iniciarAcessibilidade() {
    btnA11y.addEventListener('click', () => {
      if (!painel.hidden) { fecharPainel(true); return; }
      painel.hidden = false;
      btnA11y.setAttribute('aria-expanded', 'true');
      fecharMenu();
      $('#btn-fechar-a11y').focus();
    });
    $('#btn-fechar-a11y').addEventListener('click', () => fecharPainel(true));
    $$('[data-a11y]').forEach((b) => b.addEventListener('click', () => mudarPrefs(b.dataset.a11y)));
    $('#btn-tema').addEventListener('click', () => mudarPrefs(prefs.tema === 'escuro' ? 'claro' : 'escuro'));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!painel.hidden) fecharPainel(true);
      else if (btnMenu.getAttribute('aria-expanded') === 'true') { fecharMenu(); btnMenu.focus(); }
    });
  }

  /* ================= Inicialização ================= */
  aplicarPrefs();
  aplicarImg($('#hero-img'), 'assets/images/hero.jpg', ARTES.hero);
  aplicarImg($('#marca-img'), 'assets/logos/prancheta.png', marcaSVG);
  $$('[data-img]').forEach((img) => aplicarImg(img, `assets/images/${img.dataset.img}.jpg`, ARTES[img.dataset.img]));

  iniciarAcessibilidade();
  carrossel.iniciar();
  iniciarJogos();
  iniciarClassificacao();
  iniciarPesquisa();
  iniciarFormularios();

  // O link de pular conteúdo não pode alterar o hash usado pelas rotas.
  $('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    $('#conteudo').focus();
    $('#conteudo').scrollIntoView();
  });
  // Clicar no link da tela atual apenas fecha o menu.
  $$('.navbar a').forEach((a) => a.addEventListener('click', fecharMenu));
  window.addEventListener('hashchange', () => navegar(true));
  navegar(false);
})();
