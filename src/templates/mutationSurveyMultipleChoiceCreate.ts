export const request = (tableName: string): string => `
  #set($ctx.stash = {})
  $util.qr($ctx.stash.put("node", $util.autoId()))

  #set($entities = [])
  $util.qr($entities.add($util.dynamodb.toMap({ "node": "$ctx.stash.node", "path": "survey", "id": "$ctx.stash.node", "label": "$ctx.arguments.question", "surveyType": "MULTIPLE_CHOICE" }).M))

  #foreach($answer in $ctx.arguments.answers)
    #set($answerID = $util.autoId())
    $util.qr($entities.add($util.dynamodb.toMap({ "node": "$ctx.stash.node", "path": "answer#$answerID", "id": "$answerID", "label": "$answer", "votes": 0 }).M))
  #end

  {
    "version" : "2018-05-29",
    "operation" : "BatchPutItem",
    "tables" : {
      "${tableName}": $utils.toJson($entities)
    }
  }
`;

export const response = `
  {
    "id": "$ctx.stash.node",
    "label": "$ctx.arguments.question"
  }
`;
