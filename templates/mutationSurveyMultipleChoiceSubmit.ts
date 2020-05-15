export const request = `
  $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
  $util.qr($ctx.stash.put("answerID", $ctx.args.answerID))
  {}
`;

export const response = `$util.toJson($ctx.result)`;
