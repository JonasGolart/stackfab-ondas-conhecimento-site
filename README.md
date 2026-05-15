# Ondas do Conhecimento

Projeto de extensão universitária (UTFPR & ARPA-PR) para fomentar o radioamadorismo e a tecnologia entre grupos escoteiros do Paraná.

## 🚀 Tecnologias
- **Frontend**: HTML5, Vanilla CSS, JavaScript (Bento Grid design)
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL (Coolify Infra)
- **Autenticação**: JWT (JSON Web Tokens)
- **Deploy**: Coolify (Docker)

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 20+
- PostgreSQL (ou container Docker)

### Passo a Passo
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` baseado no `.env.example`.
4. (Opcional) Crie o usuário admin inicial:
   ```bash
   node seed.js
   ```
5. Inicie o servidor:
   ```bash
   npm run dev
   ```

## 🔐 Variáveis de Ambiente
- `PORT`: Porta do servidor (default 3000)
- `DATABASE_URL`: String de conexão do PostgreSQL
- `JWT_SECRET`: Segredo para assinatura de tokens

## 🏗️ Estrutura do Projeto
O projeto segue os padrões StackFAB:
- `src/config`: Configurações de banco e ambiente.
- `src/controllers`: Lógica de negócio e handlers da API.
- `src/routes`: Definição de endpoints.
- `src/middlewares`: Segurança e interceptação de requests.

## 📄 Licença
Todos os direitos reservados à StackFAB e UTFPR.
