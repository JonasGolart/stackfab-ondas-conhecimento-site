# 🤖 Painel de Controle de IA (GEMINI)

> [!IMPORTANT] DIRETRIZ CRÍTICA DE OPERAÇÃO
> Este projeto faz parte do ecossistema **StackFAB**. Todo agente de IA (Antigravity, Cline, etc.) deve, obrigatoriamente, seguir os protocolos abaixo antes de sugerir ou executar qualquer alteração:

## 🧭 Bússola de Contexto
1. **Padrões de Projeto**: Consulte `E:\STACKFAB\Armazem\03 - Padroes de Projeto\Padroes de Projeto.md`. Siga a estrutura de pastas e convenções de código ali descritas.
2. **Credenciais**: NUNCA crie chaves novas sem verificar `E:\STACKFAB\Armazem\01 - Credenciais\Credenciais.md`.
3. **Histórico**: Leia o arquivo `PROGRESS.md` na raiz deste projeto para entender o que já foi feito e evitar retrabalho.

## 🔒 Regras de Segurança
- Jamais inclua valores reais de senhas, tokens ou chaves privadas no código ou no GitHub.
- Use sempre o arquivo `.env` (que está no `.gitignore`) para segredos.
- O conteúdo da pasta `Armazem` é estritamente confidencial e nunca deve ser sincronizado com repositórios públicos.

## 🔄 Sincronização e Deploy
- **Git**: Commits devem seguir o padrão *Conventional Commits*.
- **Push**: Sempre realize o push para o GitHub após alterações críticas usando a ferramenta `gh`.
- **Deploy**: O deploy é realizado via API do Coolify (detalhes no Armazém).

---
*Este arquivo serve como memória central e sistema de controle para agentes de IA.*
*Última atualização: 2026-05-15 por Antigravity AI.*

[CURRENT_LOCKS]: NONE
[MESSAGES / HANDOVER]: Refatoração visual completa da Área de Membros, Login, Portal e Redefinição de Senha para o novo tema claro premium baseado em Bege Linho, Areia Claro e Marrom Terroso, com destaques elegantes em verde esmeralda. Corrigido de forma definitiva o bug de gravação física de materiais no servidor alterando o Multer para usar caminhos absolutos robustos com __dirname e adicionando a criação dinâmica resiliente da coluna "category" na inicialização da tabela. O seed administrativo agora configura explicitamente o papel de 'admin' para jonas@gmail.com, resolvendo redirecionamentos impróprios. Tudo homologado com sucesso absoluto localmente e sincronizado no GitHub remoto!

**[Update - 2026-05-20]**: Incorporadas 329 novas questões (oriundas do simulado extraído do FalconsDX) ao arquivo `assets/banco_questoes.json`. Todas as categorias foram normalizadas e separadas rigorosamente em `Legislação`, `Técnica e Ética` e `Eletrônica`. Alterações submetidas no Github.

**[Update - 2026-05-30]**: Implementadas melhorias completas no painel admin e formulário de inscrição:
1. **Campo "Grupo Escoteiro" (texto livre)** adicionado à ficha de inscrição individual em `index.html` e `script.js` — campo obrigatório, capturado no backend e salvo na coluna `scout_group` (TEXT) da tabela `users` (migration segura com `IF NOT EXISTS` em `server.js`).
2. **Dashboard Admin reescrito** (`dashboard.html`): 4 KPI cards (grupos, participantes, individuais, cidades), tabela de inscrições com badges Grupo/Individual e botão "Ver detalhes", Drawer lateral de detalhes com dados completos + lista de usuários individuais vinculados.
3. **Seção de Estatísticas** com 4 gráficos Chart.js (CDN, sem npm): pizza de distribuição, barras top grupos, barras horizontais por cidade, linha de evolução temporal.
4. **Backend**: novos endpoints `GET /api/admin/inscriptions/stats` e `GET /api/admin/users` em `inscriptionController.js` e `api.js`.

**[Update - 2026-06-17]**: Implementados ajustes e correções avançadas na responsividade da Landing Page (`index.html` / `styles.css`) para dispositivos móveis e tablets, melhorando o enquadramento de textos longos (clamp font-size), otimizando o espaçamento da tela (paddings variáveis no `:root`) e reduzindo a altura das animações SVG para melhor navegação. Alterações "commitadas" e enviadas ao Github.

**[Update - 2026-06-17] (Part 2)**: Corrigido o bug da responsividade na "Área de Membros" (dashboard.html e portal.html) onde a sidebar estava sobrepondo ou quebrando o layout em dispositivos móveis. Adicionado menu hamburguer (drawer off-canvas) com animação suave e overlay de escurecimento, fechando automaticamente ao realizar alguma ação na tela. Alterações "commitadas" e enviadas ao Github.

**[Update - 2026-08-20]**: Implementado o Simulado Especial de Fim de Curso e Quadro de Notas:
1. **Modal Informativo com Agendamento Estrito**: Renderizado no `portal.html` exclusivamente entre a 01:00 AM do dia 22 de Agosto de 2026 e 23:59 do mesmo dia.
2. **Simulado Especial Padrão Oficial (`simulado.html`)**: Exatamente 20 questões padrão (7 Técnica e Ética, 7 Legislação e 6 Eletrônica) sem revelação de gabarito imediato durante a resolução. O resultado, total de acertos e gabarito detalhado são emitidos após o encerramento.
3. **Persistência Backend & Tabela `simulado_grades` (`server.js`, `simuladoController.js`, `api.js`)**: Registro das submissões e notas com índice e suporte a auditoria.
4. **Quadro de Notas no Admin Dashboard (`dashboard.html`)**: Nova seção de gerenciamento com 4 cartões KPI (total de avaliações, aprovados, taxa de aprovação %, média de acertos), tabela dinâmica por participante e exportação completa em CSV.
