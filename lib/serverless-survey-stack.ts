import * as cdk from "@aws-cdk/core";
import {
  GraphqlApi,
  FieldLogLevel,
  MappingTemplate,
  CfnFunctionConfiguration,
  CfnResolver,
  AuthorizationType, Schema
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "@aws-cdk/aws-dynamodb";
import * as templates from "../templates";
import { Expiration } from "@aws-cdk/core";

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

    const api = new GraphqlApi(this, "ServerlessSurvey", {
      name: `ServerlessSurvey`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: Schema.fromAsset("./schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.IAM
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: Expiration.after(cdk.Duration.days(365))
            }
          }
        ]
      }
    });

    const dataSource = api.addDynamoDbDataSource(
      "SurveyTableDataSoure",
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
        requestMappingTemplate: templates.functionSurveyByID.request,
        responseMappingTemplate: templates.functionSurveyByID.response,
      }
    );

    api.addSchemaDependency(functionSurveyByID);
    functionSurveyByID.addDependsOn(dataSource.ds);

    const functionSurveyMultipleChoiceSubmit = new CfnFunctionConfiguration(
      this,
      "FunctionSurveyMultipleChoiceSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyMultipleChoiceSubmit",
        requestMappingTemplate:
          templates.functionSurveyMultipleChoiceSubmit.request,
        responseMappingTemplate:
          templates.functionSurveyMultipleChoiceSubmit.response,
      }
    );

    api.addSchemaDependency(functionSurveyMultipleChoiceSubmit);
    functionSurveyMultipleChoiceSubmit.addDependsOn(dataSource.ds);

    const functionSurveyTextareaSubmit = new CfnFunctionConfiguration(
      this,
      "FunctionSurveyTextareaSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyTextareaSubmit",
        requestMappingTemplate: templates.functionSurveyTextareaSubmit.request,
        responseMappingTemplate:
          templates.functionSurveyTextareaSubmit.response,
      }
    );

    api.addSchemaDependency(functionSurveyTextareaSubmit);
    functionSurveyTextareaSubmit.addDependsOn(dataSource.ds);

    const resolverQuerySurvey = new CfnResolver(this, "ResolverQuerySurvey", {
      apiId: api.apiId,
      typeName: "Query",
      fieldName: "survey",
      kind: "PIPELINE",
      pipelineConfig: {
        functions: [functionSurveyByID.getAtt("FunctionId").toString()],
      },
      requestMappingTemplate: templates.querySurvey.request,
      responseMappingTemplate: templates.querySurvey.response,
    });

    resolverQuerySurvey.addDependsOn(functionSurveyByID);
    resolverQuerySurvey.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyMultipleChoiceCreate",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.request(
          surveyTable.tableName
        )
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.response
      ),
    });

    dataSource.createResolver({
      typeName: "SurveyMultipleChoice",
      fieldName: "answers",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.response
      ),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyTextareaCreate",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.response
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
        requestMappingTemplate:
          templates.mutationSurveyMultipleChoiceSubmit.request,
        responseMappingTemplate:
          templates.mutationSurveyMultipleChoiceSubmit.response,
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
        requestMappingTemplate: templates.mutationSurveyTextareaSubmit.request,
        responseMappingTemplate:
          templates.mutationSurveyTextareaSubmit.response,
      }
    );

    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "SurveyTextarea",
      fieldName: "submissions",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.surveyTextareaSubmission.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.surveyTextareaSubmission.response
      ),
    });

    new cdk.CfnOutput(this, "GraphQLEndpoint", {
      value: api.graphqlUrl,
    });
  }
}
