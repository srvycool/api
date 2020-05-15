export const request = `
  {
    "version" : "2017-02-28",
    "operation" : "GetItem",
    "key" : {
      "node" : $util.dynamodb.toDynamoDBJson($ctx.stash.surveyID),
      "path" : $util.dynamodb.toDynamoDBJson("survey")
    }
  }
`;

export const response = `
  #if ($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type, null, $ctx.result.data.unprocessedKeys)
  #end

  #set($typeMapping = {})
  $util.qr($typeMapping.put('MULTIPLE_CHOICE', 'SurveyMultipleChoice'))
  $util.qr($typeMapping.put('TEXTAREA', 'SurveyTextarea'))

  {
    "__typename": "$typeMapping[$ctx.result.surveyType]",
    "id": "$ctx.result.id",
    "label": "$ctx.result.label"
  }
`;
