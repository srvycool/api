export const request = (tableName: string) => `
  $util.qr($ctx.stash.put("node", $util.autoId()))

  #set($entities = [])
  $util.qr($entities.add($util.dynamodb.toMapValues({ "node": "$ctx.stash.node", "path": "survey", "id": "$ctx.stash.node", "label": "$ctx.args.question", "surveyType": "MULTIPLE_CHOICE" })))

  #foreach($answer in $ctx.args.answers)
    #set($answerID = $util.autoId())
    $util.qr($entities.add($util.dynamodb.toMapValues({ "node": "$ctx.stash.node", "path": "answer#$answerID", "id": "$answerID", "label": "$answer", "votes": 0 })))
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
  #if ($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type, null, $ctx.result.data.unprocessedKeys)
  #end

  {
    "id": "$ctx.stash.node",
    "label": "$ctx.args.question"
  }
`;
