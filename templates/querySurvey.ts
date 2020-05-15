export const request = `
  $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
  {}
`;

export const response = `
  $util.toJson($ctx.result)
`;
