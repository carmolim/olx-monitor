<img alt="OLX Monitor" src="assets/olx-monitor-banner.png"></img>

# OLX Monitor

Estava procurando um produto específico no OLX, e diariamente acessava minhas buscas salvas no aplicativo à procura de uma boa oportunidade. Um dia encontrei uma ótima oportunidade, mas quando entrei em contato com o vendedor já era tarde, ele já estava indo ao encontro do comprador e caso a a venda não desse certo tinham mais 3 pessoas na espera para comprar.

Vi nessa situação uma oportunidade para aprender um pouco sobre scrapping usando o `nodejs` para tentar não perder uma próxima oportunidade. Espero que você também consiga o mesmo.

## Instalação e configuração

Para utilizar esse script você precisa ter o `node` e o `npm` devidamente instalados, ter uma conta no [Telegram](https://telegram.org/), e idealmente um computador que fique ligado 27/7 para executar o script continuamente. Eu usei um Raspberry Pi 2 que consome pouca energia e já uso para outros fins, mas você pode usar um VPS, ou um sevidor gratuito da Oracle.

Se você já está familiarizado com a API do Telegram e já mexeu bom bots segue um passo-a-passo mais enxuto:

### Usando Node

1. Clonar ou fazer download do repositório `git clone https://github.com/carmolim/olx-monitor.git`
1. Acessar a pasta onde os arquivos js se encontram `cd src`
1. Instalar as dependências com o comando `npm install`
1. Renomear o arquivo `example.env` para `.env` e incluir as informações do seu BOT e do seu grupo que irá receber as notificações
1. Incluir as URLs que você quer que sejam monitoradas no arquivo `config.js`
1. Definir qual o intervalo que você quer que as buscas sejam feitas no arquivo `config.js`
1. Executar o script usando o comando `node index.js`
1. Acompanhar o andamento do script no Terminal
1. Se correu tudo certo, dois novos arquivos foram criados dentro da pasta `data`: `ads.db` que é o banco de dados e o `scrapper.log` com os logs de execução do script

### Usando docker-compose

Se você quiser utiliar o Docker para não ter que instalar o Node e nem as dependências diretamente na sua máquina siga os seguintes passos

1. Realize os passos 1 a 7 do guia usando Node
2. Na primeira vez que você for rodar é preciso buildar a imagem rodando o comando `docker-compose build`
3. Nas próximas vezes só é necessário rodar o comando `docker-compose up`


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

Recomendo utilizar filtros bem específicos para não gerar resultados com muitos itens. Como esse script irá varrer todos os resultados encontrados, pode ser possível que não seja possível passar por todos os resultados dentro do intervalo definido, isso pode fazer com que o Olx perceba uma quantidade alta de chamadas do seu IP e faça algum bloqueio. Isso nunca me aconteceu, mas pode acontecer.

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

## Funcionamento

O funcionamamento do script é simples. Ele percorre um `array` de `URLs` copiadas do OLX, que já contém os filtros de preço mínimo, máximo e etc, encontra os anúncios dentro dessa página e inclui os anúncios encontrados em um banco de dados SQLite e também envia uma notificação para um BOT no Telegram. 

As entradas salvas no banco de dados são utilizadas posteriormente para detectar alterações nos preços, que também são notificadas através do Telegram.


## Considerações

- Esse script só funciona com a versão brasileira do OLX, nos outros países a interface é diferente e o scrapper não consegue puxar as informações necessárias para funcionar. Porém a adaptação para outros países deve ser consideravalmente fácil de fazer. As alterações deverão ser feitas no arquivo `Scraper.js`
