import * as cdk from "@aws-cdk/core";
import {
  GraphQLApi,
  FieldLogLevel,
  MappingTemplate,
  CfnFunctionConfiguration,
  CfnResolver,
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "@aws-cdk/aws-dynamodb";
import { RemovalPolicy } from "@aws-cdk/core";

export class ServerlessSurveyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const surveyTable = new Table(this, "SurveyTable", {
      partitionKey: {
        name: "node",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "path",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      serverSideEncryption: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new GraphQLApi(this, "ServerlessSurvey", {
      name: `ServerlessSurvey`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          apiKeyDesc: "API KEY",
        },
      },
      schemaDefinitionFile: "./schema.graphql",
    });

    const dataSource = api.addDynamoDbDataSource(
      "SurveyTableDataSoure",
      "",
      surveyTable
    );

    const functionSurveyByID = new CfnFunctionConfiguration(
      this,
      "FunctionSurveyByID",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyByID",
        requestMappingTemplate: `
          {
            "version" : "2017-02-28",
            "operation" : "GetItem",
            "key" : {
              "node" : $util.dynamodb.toDynamoDBJson($ctx.stash.surveyID),
              "path" : $util.dynamodb.toDynamoDBJson("survey")
            }
          }
        `,
        responseMappingTemplate: `
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
        `,
      }
    );

    functionSurveyByID.addDependsOn(api.schema);
    functionSurveyByID.addDependsOn(dataSource.ds);

    const functionSurveyMultipleChoiceSubmit = new CfnFunctionConfiguration(
      this,
      "FunctionSurveyMultipleChoiceSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyMultipleChoiceSubmit",
        requestMappingTemplate: `
          {
            "version" : "2017-02-28",
            "operation" : "UpdateItem",
            "key" : {
              "node" : $util.dynamodb.toDynamoDBJson($ctx.stash.surveyID),
              "path" : $util.dynamodb.toDynamoDBJson("answer#$ctx.stash.answerID")
            },
            "update" : {
              "expression" : "ADD #votes :one",
              "expressionNames": {
                "#votes" : "votes"
              },
              "expressionValues": {
                ":one" : { "N": 1 }
              }
            }
          }
        `,
        responseMappingTemplate: `
          #if ($ctx.error)
            $util.error($ctx.error.message, $ctx.error.type, null, $ctx.result.data.unprocessedKeys)
          #end
          {}
        `,
      }
    );

    functionSurveyMultipleChoiceSubmit.addDependsOn(api.schema);
    functionSurveyMultipleChoiceSubmit.addDependsOn(dataSource.ds);

    const functionSurveyTextareaSubmit = new CfnFunctionConfiguration(
      this,
      "FunctionSurveyTextareaSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyTextareaSubmit",
        requestMappingTemplate: `
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
        `,
        responseMappingTemplate: `
          #if ($ctx.error)
            $util.error($ctx.error.message, $ctx.error.type, null, $ctx.result.data.unprocessedKeys)
          #end
          {}
        `,
      }
    );

    functionSurveyTextareaSubmit.addDependsOn(api.schema);
    functionSurveyTextareaSubmit.addDependsOn(dataSource.ds);

    const resolverQuerySurvey = new CfnResolver(this, "ResolverQuerySurvey", {
      apiId: api.apiId,
      typeName: "Query",
      fieldName: "survey",
      kind: "PIPELINE",
      pipelineConfig: {
        functions: [functionSurveyByID.getAtt("FunctionId").toString()],
      },
      requestMappingTemplate: `
          $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
          {}
        `,
      responseMappingTemplate: `
          $util.toJson($ctx.result)
        `,
    });

    resolverQuerySurvey.addDependsOn(functionSurveyByID);
    resolverQuerySurvey.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyMultipleChoiceCreate",
      requestMappingTemplate: MappingTemplate.fromString(`
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
            "${surveyTable.tableName}": $utils.toJson($entities)
          }
        }
      `),
      responseMappingTemplate: MappingTemplate.fromString(`
        #if ($ctx.error)
          $util.error($ctx.error.message, $ctx.error.type, null, $ctx.result.data.unprocessedKeys)
        #end

        {
          "id": "$ctx.stash.node",
          "label": "$ctx.args.question"
        }
      `),
    });

    dataSource.createResolver({
      typeName: "SurveyMultipleChoice",
      fieldName: "answers",
      requestMappingTemplate: MappingTemplate.fromString(`
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
              ":path" : $util.dynamodb.toDynamoDBJson("answer#")
            }
          }
        }
      `),
      responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyTextareaCreate",
      requestMappingTemplate: MappingTemplate.fromString(`
        #set($node = $util.autoId())

        {
          "version" : "2017-02-28",
          "operation" : "PutItem",
          "key" : {
            "node" : $util.dynamodb.toDynamoDBJson($node),
            "path" : $util.dynamodb.toDynamoDBJson("survey")
          },
          "attributeValues" : {
            "id": $util.dynamodb.toDynamoDBJson($node), 
            "label": $util.dynamodb.toDynamoDBJson($ctx.args.question), 
            "surveyType": $util.dynamodb.toDynamoDBJson("TEXTAREA")
          }
        }
      `),
      responseMappingTemplate: MappingTemplate.fromString(`
        $utils.toJson($context.result)
      `),
    });

    const resolverSurveyMultipleChoiceSubmit = new CfnResolver(
      this,
      "ResolverSurveyMultipleChoiceSubmit",
      {
        apiId: api.apiId,
        typeName: "Mutation",
        fieldName: "surveyMultipleChoiceSubmit",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            functionSurveyMultipleChoiceSubmit.getAtt("FunctionId").toString(),
            functionSurveyByID.getAtt("FunctionId").toString(),
          ],
        },
        requestMappingTemplate: `
          $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
          $util.qr($ctx.stash.put("answerID", $ctx.args.answerID))
          {}
        `,
        responseMappingTemplate: `
          $util.toJson($ctx.result)
        `,
      }
    );

    resolverSurveyMultipleChoiceSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyMultipleChoiceSubmit.addDependsOn(
      functionSurveyMultipleChoiceSubmit
    );

    const resolverSurveyTextAreaSubmit = new CfnResolver(
      this,
      "ResolverSurveyTextareaSubmit",
      {
        apiId: api.apiId,
        typeName: "Mutation",
        fieldName: "surveyTextareaSubmit",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            functionSurveyTextareaSubmit.getAtt("FunctionId").toString(),
            functionSurveyByID.getAtt("FunctionId").toString(),
          ],
        },
        requestMappingTemplate: `
          $util.qr($ctx.stash.put("surveyID", $ctx.args.surveyID))
          $util.qr($ctx.stash.put("text", $ctx.args.text))
          {}
        `,
        responseMappingTemplate: `
          $util.toJson($ctx.result)
        `,
      }
    );

    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "SurveyTextarea",
      fieldName: "submissions",
      requestMappingTemplate: MappingTemplate.fromString(`
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
      `),
      responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
    });
  }
}
