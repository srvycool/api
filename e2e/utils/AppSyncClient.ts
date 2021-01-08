import fetch from 'cross-fetch';

export interface AppSyncClientOptions {
  endpoint: string;
}

export class AppSyncClient {
  constructor(private options: AppSyncClientOptions) {}

  async request<D, V = Record<string, unknown>>(
    query: string,
    variables?: V
  ): Promise<D> {
    const body = JSON.stringify({
      query,
      variables,
    });

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json; charset=UTF-8',
      },
      body,
    });

    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(JSON.stringify(errors));
    }

    return data;
  }
}
