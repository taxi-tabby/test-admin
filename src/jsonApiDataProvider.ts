import type { 
  DataProvider, 
  GetListParams, 
  GetOneParams, 
  GetManyParams, 
  GetManyReferenceParams, 
  CreateParams, 
  UpdateParams, 
  UpdateManyParams, 
  DeleteParams, 
  DeleteManyParams,
  Identifier
} from 'react-admin';

// JSON API 스펙 타입 정의
interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, unknown>;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  meta?: {
    total?: number;
    count?: number;
    'page-count'?: number;
    [key: string]: unknown;
  };
  links?: {
    self?: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
  jsonapi?: { version: string };
}

interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  meta?: Record<string, unknown>;
}

interface JsonApiErrorResponse {
  errors: JsonApiError[];
  meta?: Record<string, unknown>;
  jsonapi?: { version: string };
}

// 유틸리티 함수들
const buildQueryString = (params: Record<string, string>): string => 
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

const ensureArray = <T>(data: T | T[]): T[] => Array.isArray(data) ? data : [data];

const createHttpClient = () => {
  const defaultHeaders = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
  };

  return async (url: string, options: RequestInit = {}): Promise<JsonApiResponse> => {
    const response = await fetch(url, {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorResponse = responseData as JsonApiErrorResponse;
      const error = errorResponse.errors?.[0];
      throw new Error(error?.detail || error?.title || `HTTP ${response.status}: ${response.statusText}`);
    }

    return responseData;
  };
};

// 리소스 변환 함수들
const transformFromJsonApi = (resource: JsonApiResource): any => ({
  id: resource.id,
  ...resource.attributes,
  ...(resource.relationships && { relationships: resource.relationships }),
  ...(resource.meta && { meta: resource.meta }),
});

const transformToJsonApi = (type: string, data: any, id?: string) => ({
  data: {
    type,
    ...(id && { id }),
    attributes: Object.fromEntries(
      Object.entries(data).filter(([key]) => !['id', 'relationships', 'meta'].includes(key))
    ),
    ...(data.relationships && { relationships: data.relationships }),
    ...(data.meta && { meta: data.meta }),
  },
});

// 쿼리 빌더 클래스
class JsonApiQueryBuilder {
  private params: Record<string, string> = {};

  paginate(page: number, perPage: number): this {
    this.params['page[number]'] = page.toString();
    this.params['page[size]'] = perPage.toString();
    return this;
  }

  sort(field: string, order: 'ASC' | 'DESC'): this {
    this.params.sort = order === 'ASC' ? field : `-${field}`;
    return this;
  }

  filter(filters: Record<string, unknown>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        this.params[`filter[${key}]`] = value.toString();
      }
    });
    return this;
  }

  filterBy(key: string, value: string | string[]): this {
    this.params[`filter[${key}]`] = Array.isArray(value) ? value.join(',') : value;
    return this;
  }

  build(): string {
    return buildQueryString(this.params);
  }
}

// JSON API 스펙 준수 Data Provider
export const createJsonApiDataProvider = (apiUrl: string): DataProvider => {
  const httpClient = createHttpClient();

  const handleResponse = async (response: JsonApiResponse): Promise<any> => {
    const dataArray = ensureArray(response.data);
    return {
      data: dataArray.map(transformFromJsonApi),
      total: response.meta?.total || response.meta?.count || dataArray.length,
    };
  };

  const handleSingleResponse = (response: JsonApiResponse): any => {
    if (Array.isArray(response.data)) {
      throw new Error('Expected single resource, got array');
    }
    return { data: transformFromJsonApi(response.data) };
  };

  return {
    getList: async (resource: string, params: GetListParams) => {
      const { page = 1, perPage = 10 } = params.pagination || {};
      const { field = 'id', order = 'ASC' } = params.sort || {};
      
      const query = new JsonApiQueryBuilder()
        .paginate(page, perPage)
        .sort(field, order)
        .filter(params.filter || {})
        .build();

      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const response = await httpClient(url);
        return handleResponse(response);
      } catch (error) {
        console.error('getList error:', error);
        return { data: [], total: 0 };
      }
    },

    getOne: async (resource: string, params: GetOneParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      const response = await httpClient(url);
      return handleSingleResponse(response);
    },

    getMany: async (resource: string, params: GetManyParams) => {
      const query = new JsonApiQueryBuilder()
        .filterBy('id', params.ids.map(String))
        .build();
      
      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const response = await httpClient(url);
        return { data: ensureArray(response.data).map(transformFromJsonApi) };
      } catch (error) {
        console.error('getMany error:', error);
        return { data: [] };
      }
    },

    getManyReference: async (resource: string, params: GetManyReferenceParams) => {
      const { page = 1, perPage = 10 } = params.pagination || {};
      const { field = 'id', order = 'ASC' } = params.sort || {};
      
      const query = new JsonApiQueryBuilder()
        .paginate(page, perPage)
        .sort(field, order)
        .filterBy(params.target, params.id.toString())
        .filter(params.filter || {})
        .build();

      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const response = await httpClient(url);
        return handleResponse(response);
      } catch (error) {
        console.error('getManyReference error:', error);
        return { data: [], total: 0 };
      }
    },

    create: async (resource: string, params: CreateParams) => {
      const url = `${apiUrl}/${resource}`;
      const body = transformToJsonApi(resource, params.data);
      
      const response = await httpClient(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      return handleSingleResponse(response);
    },

    update: async (resource: string, params: UpdateParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      const body = transformToJsonApi(resource, params.data, params.id.toString());
      
      const response = await httpClient(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      
      return handleSingleResponse(response);
    },

    updateMany: async (resource: string, params: UpdateManyParams) => {
      const promises = params.ids.map((id: string | number) => {
        const url = `${apiUrl}/${resource}/${id}`;
        const body = transformToJsonApi(resource, params.data, id.toString());
        
        return httpClient(url, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      });
      
      await Promise.all(promises);
      return { data: params.ids };
    },

    delete: async (resource: string, params: DeleteParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      
      await httpClient(url, { method: 'DELETE' });
      
      return {
        data: params.previousData || { id: params.id },
      };
    },

    deleteMany: async (resource: string, params: DeleteManyParams) => {
      const promises = params.ids.map((id: string | number) =>
        httpClient(`${apiUrl}/${resource}/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(promises);
      return { data: params.ids };
    },
  };
};

// 로깅 데코레이터를 사용한 Data Provider
export const createJsonApiDataProviderWithLogging = (apiUrl: string): DataProvider => {
  const baseProvider = createJsonApiDataProvider(apiUrl);
  
  const withLogging = <T extends (...args: any[]) => Promise<any>>(
    method: T, 
    methodName: string
  ): T => {
    return (async (...args: Parameters<T>) => {
      console.log(`[JSON API] ${methodName}:`, args);
      const result = await method(...args);
      console.log(`[JSON API] ${methodName} result:`, result);
      return result;
    }) as T;
  };
  
  return {
    ...baseProvider,
    getList: withLogging(baseProvider.getList, 'getList'),
    getOne: withLogging(baseProvider.getOne, 'getOne'),
    getMany: withLogging(baseProvider.getMany, 'getMany'),
    getManyReference: withLogging(baseProvider.getManyReference, 'getManyReference'),
    create: withLogging(baseProvider.create, 'create'),
    update: withLogging(baseProvider.update, 'update'),
    updateMany: withLogging(baseProvider.updateMany, 'updateMany'),
    delete: withLogging(baseProvider.delete, 'delete'),
    deleteMany: withLogging(baseProvider.deleteMany, 'deleteMany'),
  };
};

