# Orquestra: Sistema de Gestão de Entregas

## Descrição
Orquestra é um sistema de gestão de entregas completo, projetado para otimizar as operações de distribuidoras e empresas de logística. Ele oferece funcionalidades robustas para gerentes e motoristas, permitindo o controle de clientes, produtos, estoque, pedidos, finanças e frota de veículos. O sistema é construído com foco na experiência do usuário e na eficiência operacional.

## Funcionalidades

### Gerenciamento de Pedidos
- Criação e visualização de pedidos.
- Atribuição de pedidos a motoristas.
- Acompanhamento do status do pedido (pendente, atribuído, em andamento, concluído).
- Registro de custos de viagem e pagamentos (dinheiro, PIX).
- Processamento de devoluções de produtos.

### Gestão de Clientes
- Cadastro e visualização de clientes.
- Histórico de pedidos e transações financeiras por cliente.
- Controle de saldo devedor/credor do cliente.

### Controle de Produtos e Estoque
- Cadastro detalhado de produtos (nome, descrição, preço de custo, preço de venda, estoque).
- Visualização do inventário e valor total em estoque.
- Registro de movimentações de estoque (entradas, saídas, ajustes).
- Cálculo de lucratividade por produto.

### Gestão Financeira
- Controle de caixa diário (abertura, fechamento, depósitos, retiradas).
- Registro e acompanhamento de custos operacionais por categoria.
- Relatórios financeiros detalhados (faturamento, fluxo de caixa, lucratividade).

### Gestão de Motoristas e Frota
- Cadastro de motoristas e controle de disponibilidade.
- Gerenciamento de veículos da frota (placa, modelo, marca, ano, status, manutenções).

### Autenticação e Perfis de Usuário
- Sistema de login e registro.
- Separação de acesso por perfis: Gerente e Motorista.

## Tecnologias Utilizadas
- **Frontend:**
    - [React](https://react.dev/)
    - [TypeScript](https://www.typescriptlang.org/)
    - [Vite](https://vitejs.dev/) (Ferramenta de build)
    - [Tailwind CSS](https://tailwindcss.com/) (Framework CSS)
    - [React Router DOM](https://reactrouter.com/en/main) (Roteamento)
    - [Lucide React](https://lucide.dev/icons/) (Ícones)
    - [Chart.js](https://www.chartjs.org/) & [React Chart.js 2](https://react-chartjs-2.js.org/) (Gráficos para relatórios)
    - [qrcode.react](https://www.npmjs.com/package/qrcode.react) (Geração de QR Code para PIX)
- **Armazenamento de Dados:**
    - [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via [idb](https://www.npmjs.com/package/idb) para persistência de dados local no navegador)
    - `uuid` (Geração de IDs únicos)

## Instalação

Para configurar e executar o projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd orquestra
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:5173`.

## Uso

### Acessando o Sistema
Ao iniciar o aplicativo, você será redirecionado para a tela de login.

-   **Usuário Padrão (Gerente):**
    -   **Email:** `admin@orquestra.com`
    -   **Senha:** `admin123` (Esta senha é um hash simples para demonstração. Em um ambiente de produção, use um sistema de autenticação robusto.)

Você também pode criar novas contas de gerente ou motorista através da tela de registro.

### Navegação
-   **Gerentes:** Terão acesso completo ao dashboard, gerenciamento de pedidos, clientes, produtos, estoque, finanças e veículos.
-   **Motoristas:** Terão acesso a um dashboard simplificado com suas entregas atribuídas e histórico.

Explore as diferentes seções do sistema para gerenciar suas operações.

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AuthLayout.tsx   # Layout para páginas de autenticação
│   ├── Layout.tsx       # Layout principal da aplicação
│   ├── OrderCard.tsx    # Componente para exibir pedidos
│   └── PixQRCode.tsx    # Componente para gerar QR Code PIX
├── context/             # Contextos React para gerenciamento de estado
│   ├── AuthContext.tsx  # Contexto de autenticação
│   ├── CashContext.tsx  # Contexto do caixa
│   ├── CostContext.tsx  # Contexto de custos
│   ├── CustomerContext.tsx # Contexto de clientes
│   ├── DriverContext.tsx   # Contexto de motoristas
│   ├── OrderContext.tsx    # Contexto de pedidos
│   ├── PaymentContext.tsx  # Contexto de pagamentos
│   ├── ProductContext.tsx  # Contexto de produtos
│   └── VehicleContext.tsx  # Contexto de veículos
├── lib/                 # Bibliotecas e utilitários
│   ├── database.ts      # Configuração do IndexedDB
│   ├── localAuth.ts     # Sistema de autenticação local
│   └── supabase.ts      # Configuração do Supabase (opcional)
├── pages/               # Páginas da aplicação
│   ├── driver/          # Páginas específicas do motorista
│   └── manager/         # Páginas específicas do gerente
├── types/               # Definições de tipos TypeScript
└── App.tsx              # Componente principal da aplicação
```

## Contribuição

Contribuições são bem-vindas! Se você deseja contribuir para o projeto, por favor, siga estas etapas:

1.  Faça um fork do repositório.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça suas alterações e commit (`git commit -m 'feat: Adiciona nova funcionalidade'`).
4.  Envie para a branch original (`git push origin feature/sua-feature`).
5.  Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido por:** Joao Pedro Aguiar Martins  
**Versão:** 1.0.0  
**Sistema:** Orquestra
