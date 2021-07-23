<img alt="OLX Monitor" src="assets/olx-monitor-banner.png"></img>

# OLX Monitor

Estava procurando um produto específico no OLX, e diariamente acessava minhas buscas salvas no aplicativo à procura de uma boa oportunidade. Um dia encontrei uma ótima oportunidade, mas quando entrei em contato com o vendedor já era tarde, ele já estava indo ao encontro do comprador e caso a a venda não desse certo tinham mais 3 pessoas na espera para comprar.

Vi nessa situação uma oportunidade para aprender um pouco sobre scrapping usando o `nodejs` para tentar não perder uma próxima oportunidade. Espero que você também consiga o mesmo.

## Instalação e configuração

Para utilizar esse script você precisa ter o `node` e o `npm` devidamente instalados, ter uma conta no [Telegram](https://telegram.org/), e idealmente um computador que fique ligado 27/7 para executar o script com um `cronjob`. Eu usei um Raspberry Pi 2 que consome pouca energia e já uso para outros fins. 

Se você já está familiarizado com a API do Telegram e já mexeu bom bots segue um passo-a-passo mais enxuto:

1. Clonar ou fazer download do repositório `git clone https://github.com/carmolim/olx-monitor.git`
2. Instalar as dependências com o comando `npm install`
3. Renomear o arquivo `example.env` para `.env` e incluir as informações do seu BOT e do seu grupo que irá receber as notificações
4. Incluir as URLs que você quer que sejam monitoradas no arquivo `config.js`
5. Executar o script usando o comando `node index.js`
6. Acompanhar o andamento do script no Terminal
7. Se correu tudo certo, dois novos arquivos foram criados o `ads.db` que é o banco de dados e o `scrapper.log` com os logs de execução do script
8. Agora é só configurar um `cronjob` para executar na frequência desejada e esperar as notificações (mais informações abaixo)

### Configuração do Telegram

Para você poder receber as notificações pelo Telegram você precisa ter algumas coisas, um bot que terá um token e um grupo que tenho bot com que você irá criar como participante.

#### Criar seu bot

Para conseguir o seu token você precisa criar o seu próprio bot. Eu pretendo fazer um tutorial, mas enquanto isso você pode usar esse [aqui](https://www.youtube.com/watch?v=4u9JQR0-Bgc&feature=youtu.be&t=88). O vídeo é longo mas você só precisa assistir até: 3:24. Com esse vídeo você irá conseguir obter o seu token.

#### Descobrindo seu CHAT ID

Depois de criar o seu bot, crie um grupo e convite o seu bot que você acabou de criar e també um outro bot, o `@idbot`, ele vai te ajudar a descobrir o `CHAT_ID` que precisamos para enviar a notificação. 

Depois de incluir o no grupo, basta digitar `/getgroupid@myidbot` e bot irá responder com o ID do chat. 

#### Editando seu ambiênte

Dentro do repositório tem um arquivo chamado `example.env`, você precisa renomea-lo para apenas `.env` e preencher as informações que você acabou de pegar. 

| Variável          | Exemplo                                |
| ----------------- | -------------------------------------- |
| TELEGRAM_TOKEN    | Token do seu bot gerado pelo BotFather |
| TELEGRAM_CHAT\_ID | ID do seu chat                         |

### O que deve ser monitorado?

Eu não sei o que você está procurando no OLX, mas você precisa dizer para o script. A forma mais fácil de fazer isso é entrar no site do OLX, fazer uma busca, colocar os filtros que você acha necessário e copiar o endereço que o OLX vai criar.

Você pode utilizar uma ou mais pesquisas, basta apenas incluir as `URLs` no arquivo `config.js` dentro da variável `URLs`

#### Exemplos

##### Apenas uma `URL`

```
config.urls = ['https://sp.olx.com.br/sao-paulo-e-regiao/centro/celulares/iphone?cond=1&cond=2&pe=1600&ps=600&q=iphone']
```

##### Várias `URLs`

Para usar várias `URLs` você só precisa separa-las por vírgula.

```
config.urls = [
    'https://sp.olx.com.br/sao-paulo-e-regiao/centro/celulares/iphone?cond=1&cond=2&pe=1600&ps=600&q=iphone',
    'https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/venda?bae=2&bas=1&gsp=1&pe=600000&ps=100000&se=6&ss=2',
]
```

#### Dica

Quando mais específica sua busca for mais eficiente o script será, se você só buscar por iPhone, no Brasil todo, você vai receber muitas notificações por dia, não vai ser muito legal.

### Executando o script

Agora você já está com tudo configurado, e se você seguiu todos os passos corretamente, basta acessar Terminal na pasta onde você configurou o script e roda o comando `node index.js`

Você poderá acompanhar o funcionamento do script pelo terminal e se tudo funcionar você irá reparar que dois novos arquivos apareceram dentro da sua pasta, o arquivo `ads.db` que é o banco de dados e o `scrapper.log` onde você pode acompanhar o registro do que aconteceu em cada execução do script. 

### Rodando automaticamente

Agora que está com tudo funcionando, você precisa configurar um `cronjob` que irá executar script no intervalo de tempo que você desejar.

A configuração do `cronjob` vai variar de acordo com a plataforma que você está utilizando, mas basicamente você precisa de algumas informações

* O `path` absoluto do script `index.js` que fica na pasta que onde você baixou o repositório. Se você estiver com o Terminal aberto na pasta, no Linux e no macOS você pode usar o comando `pwd` e ele irá retornar o `path` da pasta.
* `path` absoluto de onde está instalado o `node`. No Linux e no macOS você pode executar esse comando `which node` e ele vai retornar o `path` absoluto de onde está o executável.

Depois disso você pode executar o seguinte comando: `crontab -e` que irá abrir um editor onde você pode incluir uma nova linha seguindo essa estrutura.

O Terminal irá abrir o arquivo e para incluir ou colar um texto você deverá presionar a tecla `i` para ativar o modo de inserção de conteúdo.

`*/(intervalo em minutos) * * * * cd <path da pasta seu repositório> && <path do node> index.js`

A minha configuração ficou assim:

`*/5 * * * * cd /root/olx/ && /usr/local/bin/node index.js`

Depois que incluir a sua configuração você deverá precionar a tecla `ESC` e depois `:wq` e enter, esse comando irá salvar e fechar o editor de arquivos, e assim que você fizer isso o serviço `cron` irá reiniciar com a nova instrução. Você poderá verificar se o cron está fucionando corretamente analisando o conteúdo dos logs gerados no arquivo `scrapper.js`.

## Funcionamento

O funcionamamento do script é simples. Ele percorre um `array` de `URLs` copiadas do OLX, que já contém os filtros de preço mínimo, máximo e etc, encontra os anúncios dentro dessa página e inclui os anúncios encontrados em um banco de dados SQLite e também envia uma notificação para um BOT no Telegram. 

As entradas salvas no banco de dados são utilizadas posteriormente para detectar alterações nos preços, que também são notificadas através do Telegram.

Para rodar o script estou usando um `cronjob` que executa o script a cada 10 minutos.

## Considerações

- Esse script só funciona com a versão brasileira do OLX, nos outros países a interface é diferente e o scrapper não consegue puxar as informações necessárias para funcionar.

- No momento o script só puxa busca as informações presentes na primeira página de resultados. Num futuro penso em fazer uma alteração no `scrapper`para percorrer todas as páginas de resultado.
