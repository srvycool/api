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

import * as functionSurveyByIDTpl from "../templates/function.surveyByID";
import * as functionSurveyMultipleChoiceSubmitTpl from "../templates/function.surveyMultipleChoiceSubmit";
import * as functionSurveyTextareaSubmitTpl from "../templates/function.surveyTextareaSubmit";
import * as querySurveyTpl from "../templates/query.survey";
import * as mutationSurveyMultipleChoiceCreateTpl from "../templates/mutation.surveyMultipleChoiceCreate";
import * as mutationSurveyMultipleChoiceSubmitTpl from "../templates/mutation.surveyMultipleChoiceSubmit";
import * as mutationSurveyTextareaSubmitTpl from "../templates/mutation.surveyTextareaSubmit";
import * as mutationSurveyTextareaCreateTpl from "../templates/mutation.surveyTextareaCreate";
import * as surveyMultipleChoiceAnswersTpl from "../templates/surveyMultipleChoice.answers";
import * as surveyTextareaSubmissionTpl from "../templates/surveyTextarea.submissions";

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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
        requestMappingTemplate: functionSurveyByIDTpl.request,
        responseMappingTemplate: functionSurveyByIDTpl.response,
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
        requestMappingTemplate: functionSurveyMultipleChoiceSubmitTpl.request,
        responseMappingTemplate: functionSurveyMultipleChoiceSubmitTpl.response,
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
        requestMappingTemplate: functionSurveyTextareaSubmitTpl.request,
        responseMappingTemplate: functionSurveyTextareaSubmitTpl.response,
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
      requestMappingTemplate: querySurveyTpl.request,
      responseMappingTemplate: querySurveyTpl.response,
    });

    resolverQuerySurvey.addDependsOn(functionSurveyByID);
    resolverQuerySurvey.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyMultipleChoiceCreate",
      requestMappingTemplate: MappingTemplate.fromString(
        mutationSurveyMultipleChoiceCreateTpl.request(surveyTable.tableName)
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        mutationSurveyMultipleChoiceCreateTpl.response
      ),
    });

    dataSource.createResolver({
      typeName: "SurveyMultipleChoice",
      fieldName: "answers",
      requestMappingTemplate: MappingTemplate.fromString(
        surveyMultipleChoiceAnswersTpl.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        surveyMultipleChoiceAnswersTpl.response
      ),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyTextareaCreate",
      requestMappingTemplate: MappingTemplate.fromString(
        mutationSurveyTextareaCreateTpl.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        mutationSurveyTextareaCreateTpl.response
      ),
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
        requestMappingTemplate: mutationSurveyMultipleChoiceSubmitTpl.request,
        responseMappingTemplate: mutationSurveyMultipleChoiceSubmitTpl.response,
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
        requestMappingTemplate: mutationSurveyTextareaSubmitTpl.request,
        responseMappingTemplate: mutationSurveyTextareaSubmitTpl.response,
      }
    );

    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "SurveyTextarea",
      fieldName: "submissions",
      requestMappingTemplate: MappingTemplate.fromString(
        surveyTextareaSubmissionTpl.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        surveyTextareaSubmissionTpl.response
      ),
    });
  }
}
