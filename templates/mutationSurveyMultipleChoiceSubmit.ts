export const request = `
  $util.qr($ctx.stash.put("surveyID", $ctx.arguments.surveyID))
  $util.qr($ctx.stash.put("answerID", $ctx.arguments.answerID))
  {}
`;

export const response = `$util.toJson($ctx.result)`;
