export const request = `
  $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
  $util.qr($ctx.stash.put("text", $ctx.args.text))
  {}
`;

export const response = `$util.toJson($ctx.result)`;
