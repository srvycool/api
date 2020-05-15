export const request = `
  {
    "version" : "2017-02-28",
    "operation" : "Query",
    "query" : {
      "expression": "#node = :node AND begins_with(#path, :path)",
      "expressionNames" : {
        "#node": "node",
        "#path": "path"
      },
      "expressionValues" : {
        ":node" : $util.dynamodb.toDynamoDBJson($ctx.source.id),
        ":path" : $util.dynamodb.toDynamoDBJson("submission#")
      }
    }
  }
`;

export const response = `$util.toJson($ctx.result.items)`;
