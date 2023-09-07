const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");


const app = express();

const ENQUETES_TABLE = process.env.ENQUETES_TABLE;
const PROX_ID_TABLE = process.env.PROX_ID_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

var proxEnqueteId = 0;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Votação de Enquetes',
      version: '1.0.0',
      description: 'API de Votação de enquetes em tempo real',
    },
  },
  apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Enquete:
 *       type: object
 *       properties:
 *         enqueteId:
 *           type: string
 *           description: ID da enquete
 *         enqueteNome:
 *           type: string
 *           description: Nome/pergunta da enquete
 *         enqueteQuantVotosSim:
 *           type: integer
 *           description: Quantidade de votos Sim da enquete
 *         enqueteQuantVotosNao:
 *           type: integer
 *           description: Quantidade de votos Nao da enquete
 *     EnqueteDto:
 *       type: object
 *       properties:
 *         enqueteNomeInsert:
 *           type: string
 *           description: Nome/pergunta da enquete que se quer cadastrar
 */

/**
 * @swagger
 * /enquetes:
 *   get:
 *     summary: Retorna todos as enquetes cadastradas.
 *     responses:
 *       200:
 *         description: Lista de enquetes.
 *       500:
 *         description: Erro ao recuperar a lista de enquetes.
 *   post:
 *     summary: Cria uma nova enquete.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnqueteDto'
 *     responses:
 *       200:
 *         description: Enquete cadastrada com sucesso.
 *       500:
 *         description: Erro ao cadastrar a enquete.
 */

/**
 * @swagger
 * /enquetes/{id}:
 *   get:
 *     summary: Recupera uma enquete existente.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da enquete a ser recuperada.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Enquete recuperada com sucesso.
 *       404:
 *         description: Enquete náo encontrada.
 *       500:
 *         description: Erro ao recuperar a enquete.
 */

/**
 * @swagger
 * /enquetes/votarsim/{id}:
 *   patch:
 *     summary: Votar Sim para uma enquete existente.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da enquete a ser votado Sim.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Voto Sim aplicado na enquete com sucesso.
 *       404:
 *         description: Enquete náo encontrada para votar Sim nela.
 *       500:
 *         description: Erro ao votar Sim para a enquete.
 */

/**
 * @swagger
 * /enquetes/votarnao/{id}:
 *   patch:
 *     summary: Votar Nao para uma enquete existente.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da enquete a ser votado Nao.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Voto Nao aplicado na enquete com sucesso.
 *       404:
 *         description: Enquete náo encontrada para votar Nao nela.
 *       500:
 *         description: Erro ao votar Nao para a enquete.
 */

app.get("/enquetes/:enquetesId", async function (req, res) {
  const params = {
    TableName: ENQUETES_TABLE,
    Key: {
      enqueteId: req.params.enquetesId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { enqueteId, enqueteNome,enqueteQuantVotosSim,enqueteQuantVotosNao } = Item;
      res.json({ enqueteId, enqueteNome,enqueteQuantVotosSim,enqueteQuantVotosNao});
    } else {
      res
        .status(404)
        .json({ error: "Náo foi possível achar a enquete de id " +enqueteId });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível recuperar a enquete : " + error });
  }
});


app.post("/enquetes", async function (req, res) {
  const { enqueteNomeInsert } = req.body;

  enquetesVotosSimAux = 0;
  enquetesVotosNaoAux = 0;

  const paramsProxId = {
    TableName: PROX_ID_TABLE,
    Key: {
      table: ENQUETES_TABLE,
    },
  };


var proxEnqueteIdAux;

try{
const { Item } = await dynamoDbClient.send(new GetCommand(paramsProxId));

if (Item) {
  const { table, proxId } = Item;

  proxEnqueteIdAux = proxId + 1;

  const paramsProxIdAux = {
    TableName: PROX_ID_TABLE,
    Key: {
      table: ENQUETES_TABLE,
    },
    UpdateExpression:
        'set proxId = :proxEnqueteIdAux',
    ExpressionAttributeValues: {
        ':proxEnqueteIdAux': proxEnqueteIdAux,
    },
    ReturnValues: "ALL_NEW"
};

await dynamoDbClient.send(new UpdateCommand(paramsProxIdAux));


}else{

  proxEnqueteIdAux = 1;

  const paramsProxIdAux2 = {
    TableName: PROX_ID_TABLE,
    Item: {
      table: ENQUETES_TABLE,
      proxId: proxEnqueteIdAux,
    },
  };

  await dynamoDbClient.send(new PutCommand(paramsProxIdAux2));

}


}catch(error){
  console.log(error);
  res.status(500).json({ erro: "Não foi possível gerar o novo id para a enquete nova : " + error });
}


  const params = {
    TableName: ENQUETES_TABLE,
    Item: {
      enqueteId: proxEnqueteIdAux + '',
      enqueteNome: enqueteNomeInsert,
      enqueteQuantVotosSim : enquetesVotosSimAux,
      enqueteQuantVotosNao : enquetesVotosNaoAux,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ enqueteId:proxEnqueteIdAux, 
      enqueteNome:enqueteNomeInsert,
      enqueteQuantVotosSim:enquetesVotosSimAux,
      enqueteQuantVotosNao : enquetesVotosNaoAux,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível criar a enquete : " + error });
  }
});



app.get("/enquetes", async function (req, res) {

  try {

  const command = new ScanCommand({
    ProjectionExpression: "enqueteId, enqueteNome,enqueteQuantVotosSim,enqueteQuantVotosNao",
    TableName: ENQUETES_TABLE,
  });

  const scanResults = [];

  const response = await dynamoDbClient.send(command);
  response.Items.forEach(function (enquete) {
    scanResults.push(enquete);
  });

  res.json(scanResults);

}catch(error){
  console.log(error);
  res.status(500).json({ erro: "Não foi possível recuperar as enquetes : " + error });
}

});


app.patch("/enquetes/votarsim/:enquetesId", async function (req, res) {

  enqueteIdVoto = req.params.enquetesId;

  const params = {
    TableName: ENQUETES_TABLE,
    Key: {
      enqueteId: enqueteIdVoto,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { enqueteId, enqueteNome,enqueteQuantVotosSim,enqueteQuantVotosNao } = Item;
      

      var enqueteQuantVotosSimAux = enqueteQuantVotosSim + 1;

      const paramsAux = {
        TableName: ENQUETES_TABLE,
        Key: {
          enqueteId: enqueteId,
        },
        UpdateExpression:
            'set enqueteQuantVotosSim = :enqueteQuantVotosSimAux',
        ExpressionAttributeValues: {
            ':enqueteQuantVotosSimAux': enqueteQuantVotosSimAux,
        },
        ReturnValues: "ALL_NEW"
    };

    await dynamoDbClient.send(new UpdateCommand(paramsAux));


      res.json({ enqueteId, enqueteNome,
        enqueteQuantVotosSim: enqueteQuantVotosSimAux,
        enqueteQuantVotosNao: enqueteQuantVotosNao,
      });
    } else {
      res
        .status(404)
        .json({ error: "Náo foi possível achar a enquete com o id " + enqueteIdVoto +" para votar SIM nela" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível votar SIM na enquete de id " + enqueteIdVoto +" : " + error });
  }


});




app.patch("/enquetes/votarnao/:enquetesId", async function (req, res) {

  enqueteIdVoto = req.params.enquetesId;

  const params = {
    TableName: ENQUETES_TABLE,
    Key: {
      enqueteId: enqueteIdVoto,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { enqueteId, enqueteNome,enqueteQuantVotosSim ,enqueteQuantVotosNao } = Item;
      

      var enqueteQuantVotosNaoAux = enqueteQuantVotosNao + 1;

      const paramsAux = {
        TableName: ENQUETES_TABLE,
        Key: {
          enqueteId: enqueteId,
        },
        UpdateExpression:
            'set enqueteQuantVotosNao = :enqueteQuantVotosNaoAux',
        ExpressionAttributeValues: {
            ':enqueteQuantVotosNaoAux': enqueteQuantVotosNaoAux,
        },
        ReturnValues: "ALL_NEW"
    };

    await dynamoDbClient.send(new UpdateCommand(paramsAux));


      res.json({ enqueteId, enqueteNome,
        enqueteQuantVotosSim: enqueteQuantVotosSim,
        enqueteQuantVotosNao:enqueteQuantVotosNaoAux,
      });
    } else {
      res
        .status(404)
        .json({ error: "Náo foi possível achar a enquete com o id " + enqueteIdVoto +" para votar NÃO nela" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível votar NÃO na enquete de id " + enqueteIdVoto +" : " + error });
  }


});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
