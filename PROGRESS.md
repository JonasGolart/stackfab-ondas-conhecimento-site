# 📝 Progresso do Projeto: Ondas do Conhecimento

## 🗓️ Última Atualização: 2026-05-19
**Responsável**: Antigravity AI

---

### ✅ Concluído
- [x] Criação da interface visual premium (Bento Grid)
- [x] Implementação de animações via Intersection Observer
- [x] Atualização da identidade visual (UTFPR, ARPA-PR e Escoteiros do Paraná)
- [x] Criação do Backend Node.js/Express
- [x] Integração com PostgreSQL (Tabelas de inscrições e usuários)
- [x] Área de Membros com autenticação JWT
- [x] Dashboard funcional para listagem de inscrições
- [x] Refatoração para Padrões de Projeto StackFAB (src/ structure)
- [x] Criação de scripts de semente (seed) e Dockerfile Node.js
- [x] Adicionar funcionalidade de exportação de inscrições em CSV com suporte a acentuação em português (UTF-8 BOM)
- [x] Implementar sistema completo de recuperação de senha por e-mail integrado ao Resend (com fallback local seguro)
- [x] Configuração de variáveis de ambiente de produção (DATABASE_URL, JWT_SECRET) na VPS do Coolify
- [x] Resolução do bug de conexão com o banco de dados (erro 500 no login de produção)
- [x] Habilitar salvamento de materiais (PDFs) no Dashboard com loader e bloqueio de submissão duplicada
- [x] Sistema de Toast Notifications nativo e Modais de Confirmação estilizados no Dashboard
- [x] Sistema de Categorias Dinâmicas (Tabela no DB, API routes, Controllers e Gestão CRUD no Dashboard)
- [x] Filtros interativos de categorias com efeitos de transição fluida no Portal do Participante

- [x] Sincronização com repositório GitHub oficial e Git push automatizado
- [x] Refatoração completa do layout da Área de Membros (dashboard, login, portal, reset-password) para tema claro premium (areia, bege linho e marrom terroso), removendo as cores escuras/azuis
- [x] Correção de contraste e legibilidade do botão "Ver PDF" do Portal do Participante
- [x] Correção definitiva do upload de arquivos de materiais com caminhos absolutos do Multer, criação de pastas e resiliência de banco
- [x] Correção do seed administrativo garantindo a role 'admin' de jonas@gmail.com para controle de acesso
- [x] Implementação do Workflow de Aprovação de Inscrições: Status de aprovação, envio condicional do Token de Acesso apenas após aprovação do admin
- [x] Integração com Telegram Bot para Notificações ao Admin de novas solicitações
- [x] Botões de Aprovar e Recusar/Excluir inscrições silenciosamente no Dashboard
- [x] Ocultar/Excluir aba de inscrição por grupos, mantendo apenas fluxo unificado de inscrição individual
- [x] Bloqueio de login e reset de senha para usuários com status 'pending'
- [x] Ajustes avançados e correções na responsividade da Landing Page para celulares e tablets (enquadramento e paddings)
- [x] Correção de layout e usabilidade da sidebar na Área de Membros (dashboard.html e portal.html) para dispositivos móveis com menu hamburguer e overlay.
- [x] Implementação do Simulado Especial de Fim de Curso no Portal do Participante com 20 questões oficiais (7 Ética, 7 Legislação, 6 Eletrônica), gabarito detalhado apenas no final e modal informativo restrito à janela de 22 de Agosto de 2026 (01:00 às 23:59).
- [x] Criação do Quadro de Notas no Dashboard Admin com KPIs de aprovação, listagem detalhada por aluno e exportação em formato CSV.
- [x] Criação da tabela `simulado_grades` e endpoints autenticados `/api/simulados/submit`, `/api/simulados/my-grade` e `/api/admin/simulados/grades`.
- [x] Restauração da janela de data e horário do Simulado Especial (22 de Agosto de 2026 das 01:00 às 23:59:59), mantendo os demais modos de simulados (Legislação, Técnica/Ética, Eletrônica e Completo) permanentemente abertos para treino.

### 📋 Próximos Passos
1. Acompanhar a sincronização do deploy contínuo automático no painel do Coolify.
2. Monitorar o envio das notas do simulado especial pelos alunos.

---
*Log gerado automaticamente conforme padrões StackFAB.*
