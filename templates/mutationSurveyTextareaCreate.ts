export const request = `
  #set($node = $util.autoId())

  {
    "version" : "2017-02-28",
    "operation" : "PutItem",
    "key" : {
      "node" : $util.dynamodb.toDynamoDBJson($node),
      "path" : $util.dynamodb.toDynamoDBJson("survey")
    },
    "attributeValues" : {
      "id": $util.dynamodb.toDynamoDBJson($node), 
      "label": $util.dynamodb.toDynamoDBJson($ctx.args.question), 
      "surveyType": $util.dynamodb.toDynamoDBJson("TEXTAREA")
    }
  }
`;

export const response = `$utils.toJson($context.result)`;
