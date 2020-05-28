import fetch from "cross-fetch";
import { sign } from "./sign4";

const SERVICE = "appsync";
const METHOD = "POST";

export interface AppSyncSign4ClientOptions {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

export class AppSyncSign4Client {
  constructor(private options: AppSyncSign4ClientOptions) {}

  async request<D, V = {}>(query: string, variables?: V): Promise<D> {
    const body = JSON.stringify({
      query,
      variables,
    });

    const request = {
      method: METHOD,
      url: this.options.endpoint,
      body,
      service: SERVICE,
      region: this.options.region,
      headers: {
        accept: "*/*",
        "content-type": "application/json; charset=UTF-8",
      },
    };

    const { headers } = sign(request, {
      access_key: this.options.accessKeyId,
      secret_key: this.options.secretAccessKey,
      session_token: this.options.sessionToken,
    });

    const response = await fetch(this.options.endpoint, {
      method: METHOD,
      body,
      headers,
    });

    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(JSON.stringify(errors));
    }

    return data;
  }
}
