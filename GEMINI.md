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
[MESSAGES / HANDOVER]: Implementada a exportação CSV de inscritos no Painel Admin com suporte a UTF-8 BOM e o sistema de recuperação de senha por e-mail integrado ao Resend (com fallback local seguro). O banco foi migrado dinamicamente e os arquivos foram pushados para a branch main.
