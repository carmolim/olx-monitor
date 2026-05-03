<img alt="OLX Monitor" src="assets/olx-monitor-banner.png"></img>

# OLX Monitor

O **OLX Monitor** é um bot inteligente desenvolvido em Node.js para monitorar anúncios no OLX Brasil em tempo real. Ele não apenas avisa sobre novos anúncios, mas também realiza uma análise estatística completa do mercado para ajudar você a identificar as melhores oportunidades.

Este projeto é um fork aprimorado que agora suporta **comandos interativos via Telegram**, permitindo gerenciar suas buscas diretamente pelo chat, sem precisar editar arquivos de configuração manualmente.

## ✨ Funcionalidades Principais

-   **🤖 Comandos Interativos:** Gerencie suas buscas com `/add`, `/remove` e `/list` diretamente no Telegram.
-   **🔔 Menções Automáticas:** O bot salva quem adicionou a busca e marca a pessoa (`@username`) quando um novo anúncio é encontrado.
-   **📊 Inteligência de Mercado:** Calcula automaticamente média, mediana, moda e desvio padrão para cada busca.
-   **📈 Análise de Tendência:** Identifica se os preços estão subindo ou descendo nos últimos 30 dias (Algoritmo Theil-Sen).
-   **🟢 Selos de Qualidade:** Classifica anúncios como "Excelente Negócio", "Preço Justo" ou "Caro" baseando-se em dados reais.
-   **🐳 Pronto para Docker:** Fácil de rodar e manter com `docker-compose`.

## 🚀 Como usar (Comandos do Bot)

Diferente da versão original, agora você gerencia tudo pelo Telegram:

-   `+ /add [LINK_DA_BUSCA] [NOME_OPCIONAL]` - Começa a monitorar uma nova URL do OLX.
-   `- /remove` - Exibe botões interativos para remover uma busca ativa.
-   `📋 /list` - Lista todas as buscas que estão sendo monitoradas no chat atual.

> **Dica:** Ao usar o `/add`, o bot passará a te marcar em todos os novos anúncios encontrados para aquele link!

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js v20 ou superior (ou Docker)
- Um Bot no Telegram (criado via [@BotFather](https://t.me/botfather))

### 1. Preparando o Ambiente
1. Clone o repositório:
   ```bash
   git clone https://github.com/gsuzeda/olx-monitor.git
   cd olx-monitor
   ```
2. Configure as variáveis de ambiente:
   - Renomeie `src/.env.example` para `src/.env`.
   - Preencha o `TELEGRAM_TOKEN` com o token do seu bot.

### 2. Executando

#### Via Docker (Recomendado)
```bash
docker-compose up -d
```

#### Via Node.js
```bash
# Instale as dependências
npm install
cd src && npm install

# Inicie o monitor
npm start
```

## ⚙️ Configuração Adicional (`src/config.js`)

Você ainda pode ajustar o comportamento global no arquivo `src/config.js`:
- `interval`: Tempo de espera entre cada ciclo de varredura (em minutos).
- `dbFile`: Caminho do arquivo de banco de dados SQLite.

## 🧠 Como o Monitor Trabalha

O bot utiliza técnicas avançadas de Web Scraping e Estatística:
1. **Varredura:** Acessa as páginas do OLX buscando novos anúncios.
2. **Análise:** Filtra anúncios sem preço ou duplicados e gera métricas.
3. **Veredito:** Compara o preço do novo anúncio com a mediana do mercado. Se estiver significativamente abaixo, ele te avisa com um destaque especial!

---

## 📄 Licença e Autor

Originalmente criado por [Augusto Carmo](https://github.com/carmolim).
Mantido e aprimorado por **GabrielUzeda**.

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
