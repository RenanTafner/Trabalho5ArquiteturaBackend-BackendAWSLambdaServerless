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
      const { enqueteId, enqueteNome,enqueteQuantVotos } = Item;
      res.json({ enqueteId, enqueteNome,enqueteQuantVotos});
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

  enquetesVotosAux = 0;


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
      enqueteQuantVotos : enquetesVotosAux,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ enqueteId:proxEnqueteIdAux, 
      enqueteNome:enqueteNomeInsert,
      enqueteQuantVotos:enquetesVotosAux});
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível criar a enquete : " + error });
  }
});



app.get("/enquetes", async function (req, res) {

  try {

  const command = new ScanCommand({
    ProjectionExpression: "enqueteId, enqueteNome,enqueteQuantVotos",
    TableName: ENQUETES_TABLE,
  });

  const scanResults = [];

  const response = await dynamoDbClient.send(command);
  response.Items.forEach(function (enquete) {
    scanResults.push(enquete);
  });

  res.json({ results:scanResults});

}catch(error){
  console.log(error);
  res.status(500).json({ erro: "Não foi possível recuperar as enquetes : " + error });
}

});


app.patch("/enquetes/votar/:enquetesId", async function (req, res) {

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
      const { enqueteId, enqueteNome,enqueteQuantVotos } = Item;
      

      var enqueteQuantVotosAux = enqueteQuantVotos + 1;

      const paramsAux = {
        TableName: ENQUETES_TABLE,
        Key: {
          enqueteId: enqueteId,
        },
        UpdateExpression:
            'set enqueteQuantVotos = :enqueteQuantVotosAux',
        ExpressionAttributeValues: {
            ':enqueteQuantVotosAux': enqueteQuantVotosAux,
        },
        ReturnValues: "ALL_NEW"
    };

    await dynamoDbClient.send(new UpdateCommand(paramsAux));


      res.json({ enqueteId, enqueteNome,
        enqueteQuantVotos: enqueteQuantVotosAux});
    } else {
      res
        .status(404)
        .json({ error: "Náo foi possível achar a enquete com o id " + enqueteIdVoto +" para votar nela" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Não foi possível votar na enquete de id " + enqueteIdVoto +" : " + error });
  }


});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
