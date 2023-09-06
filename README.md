# Trabalho Final Disciplina Arquitetura Backend

## Backend em AWS Lambda Serverless

Integrantes do grupo:

* Luiz Gabriel Santos Fernandes;
* Raife Ferreira Paiva;
* Renan Carlos Silva Braz Tafner.

Aplicação já hospedada utilizando o site do Serverless e a AWS Lambda no link:

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com

Endpoints:

Para recuperar todos as enquetes (GET):

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com/enquetes

Para recuperar uma enquete específica (GET):

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com/enquetes/1

Onde "1" é o ID da enquete que se quer recuperar.

Para inserir uma enquete (POST):

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com/enquetes

Mandando um JSON com o parâmetro "enqueteNomeInsert" especificado.

Exemplo:

```
{
    "enqueteNomeInsert":"Pelé foi o maior jogador da história?"
}
```

Para votar "Sim" em uma enquete (PATCH):

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com/enquetes/votarsim/1

Onde "1" é o ID da enquete em que se quer votar "Sim".

Para votar "Não" em uma enquete (PATCH):

https://2knh0oc42g.execute-api.us-east-1.amazonaws.com/enquetes/votarnao/2

Onde "1" é o ID da enquete em que se quer votar "Não".
