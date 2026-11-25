# Prancheta NBA

Plataforma web de estatísticas, classificação, jogos e elencos dos 30 times da NBA.

**Desenvolvimento de Interfaces — 2026**
Aluno: Lucas Agra de Oliveira Moraes · Professor: Prof. Dr. Felipe Batista da Silva

> Projeto acadêmico, sem vínculo oficial com a NBA. **Os dados numéricos são ilustrativos** (ver [Dados](#dados)).

## Como rodar

Não há instalação nem build: abra `index.html` no navegador.
A internet só é usada para as fontes (Google Fonts); sem ela, o site usa fontes do sistema.


## Estrutura

```
index.html        HTML semântico e as seções (telas) da aplicação
css/style.css     variáveis, temas (claro, escuro, alto contraste) e responsividade
js/data.js        30 times, jogadores, jogos e configuração
js/app.js         rotas, renderização, carrossel, filtros, formulários, acessibilidade
assets/logos/     escudos opcionais
assets/images/    fotos opcionais
```

## Telas e rotas

| Rota | Tela |
|---|---|
| `#inicio` | Hero, carrossel, boas-vindas e cartões explicativos |
| `#jogos` | Placares por quarto, filtro por data e status |
| `#classificacao` | Leste e Oeste, zonas de Playoffs e Play-In |
| `#jogadores` `#times` `#estatisticas` `#rankings` | Abas de pesquisa e comparador |
| `#time/lal` | Página de cada time (30), com as cores da franquia |
| `#jogador/lal/luka-doncic` | Perfil de cada jogador |
| `#login` `#criar-conta` | Acesso (simulado) |
| `#contato` `#privacidade` | Formulário de contato e política de privacidade |

## Requisitos do projeto

| Requisito | Onde está |
|---|---|
| Navbar fixa com alternância de tema | `.navbar`; na home ela fica abaixo do hero e fixa ao rolar |
| Carrossel | 4 slides, anterior/próximo, indicadores, pausar, setas do teclado |
| Cartões de jogadores e times | Pesquisa e página do time |
| Cartões explicativos | Home, “Entenda os números” |
| Abas de pesquisa | Filtros combinados, ordenação e contador de resultados |
| Comparação Head-to-Head | Aba Estatísticas |
| Contato com formulário | `#contato` |
| Botão de acessibilidade | Navbar |
| Login | `#login` |
| Rodapé | Mapa do site, privacidade, redes sociais |

## Acessibilidade (meta: WCAG 2.1 AA)

- Link “Pular para o conteúdo principal”, marcos semânticos e foco visível.
- Teclado: `Tab`, `Enter`, `Espaço`, `Esc`; setas, `Home` e `End` nas abas; setas no carrossel.
- ARIA: `aria-current`, `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-live`, `tablist`/`tab`/`tabpanel`.
- Zonas da classificação indicadas por letra, estilo de linha e legenda, não só por cor.
- Texto sobre as cores das franquias escolhido (preto ou branco) pelo cálculo de contraste.
- Modo claro/escuro, fonte de 87,5% a 130%, alto contraste e redução de animações, salvos em `localStorage`.
- Respeita `prefers-reduced-motion` e `prefers-color-scheme`.

**Ainda recomendado antes da entrega:** testar com um leitor de tela (NVDA ou VoiceOver) e rodar o Lighthouse ou o axe DevTools. A conformidade WCAG não foi certificada por essas ferramentas.

## Paleta

Azul `#003366` / `#002244` · Vermelho `#C9082A` · Branco · Cinzas `#F4F4F4` `#E0E0E0` `#6C757D` `#808080` · Terrosos `#B87333` `#8B4513` · CTA `#FFCC00` (hover `#E6B800`, texto preto).

O documento do projeto cita `#6B8E23` como cinza; esse código é verde-oliva e não foi usado. **Corrija também no texto do trabalho.**


## Dados

- **Nomes e times:** transcritos do documento “Elencos da NBA”.
- **Do protótipo no Canva:** classificação do Leste; campanhas de algumas equipes do Oeste; numeração e medidas de parte dos Lakers; médias e últimos jogos de Luka Dončić; datas de alguns jogos dos Lakers.
- **Ilustrativos (gerados):** demais estatísticas, medidas, idades, números de camisa, campanhas, placares e agenda. FG% de Luka Dončić também é ilustrativo.
- **Posições:** atribuídas manualmente, de forma aproximada.
- **Draft:** preenchido só para um grupo de jogadores conhecidos; confira antes de citar. Os demais aparecem como “Não informado”.
- Os jogos “AO VIVO” são estáticos; não há integração com API.

Para editar um jogador, altere a linha correspondente em `js/data.js`.

## Limitações

Não há servidor: login, cadastro, recuperação de senha e contato são simulações. Senhas não são armazenadas.
