export const request = `
  #set($submissionID = $util.autoId())

  {
    "version" : "2017-02-28",
    "operation" : "PutItem",
    "key" : {
      "node" : $util.dynamodb.toDynamoDBJson($ctx.stash.surveyID),
      "path" : $util.dynamodb.toDynamoDBJson("submission#$submissionID")
    },
    "attributeValues" : {
      "id": $util.dynamodb.toDynamoDBJson($submissionID),
      "text": $util.dynamodb.toDynamoDBJson($ctx.stash.text)
    }
  }
`;

export const response = `
  {}
`;
