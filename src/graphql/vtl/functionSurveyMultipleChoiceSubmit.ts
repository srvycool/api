export const request = `
  {
    "version" : "2017-02-28",
    "operation" : "UpdateItem",
    "key" : {
      "node" : $util.dynamodb.toDynamoDBJson($ctx.stash.surveyID),
      "path" : $util.dynamodb.toDynamoDBJson("answer#$ctx.stash.answerID")
    },
    "update" : {
      "expression" : "ADD #votes :one",
      "expressionNames": {
        "#votes" : "votes"
      },
      "expressionValues": {
        ":one" : { "N": 1 }
      }
    }
  }
`;

export const response = `
  {}
`;
