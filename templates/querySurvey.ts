export const request = `
  $util.qr($ctx.stash.put("surveyID", $ctx.args.id))
  {}
`;

export const response = `
  $util.toJson($ctx.result)
`;
