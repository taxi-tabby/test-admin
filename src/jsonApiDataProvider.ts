import { DataProvider, GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, CreateParams, UpdateParams, UpdateManyParams, DeleteParams, DeleteManyParams } from 'react-admin';

// JSON API 스펙 타입 정의
interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
  links?: Record<string, string>;
  meta?: Record<string, any>;
}

interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  meta?: {
    total?: number;
    count?: number;
    'page-count'?: number;
    [key: string]: any;
  };
  links?: {
    self?: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
  jsonapi?: {
    version: string;
  };
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
  meta?: Record<string, any>;
}

interface JsonApiErrorResponse {
  errors: JsonApiError[];
  meta?: Record<string, any>;
  jsonapi?: {
    version: string;
  };
}

// HTTP 클라이언트 팩토리 (JSON API 스펙 준수)
const createJsonApiHttpClient = () => async (url: string, options: RequestInit = {}): Promise<JsonApiResponse> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      // 인증이 필요한 경우
      // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers,
    },
    ...options,
  });

  const responseData = await response.json();

  if (!response.ok) {
    // JSON API 에러 응답 처리
    const errorResponse = responseData as JsonApiErrorResponse;
    const error = errorResponse.errors?.[0];
    throw new Error(error?.detail || error?.title || `HTTP ${response.status}: ${response.statusText}`);
  }

  return responseData as JsonApiResponse;
};

// JSON API 리소스를 React Admin 형식으로 변환
const transformJsonApiResource = (resource: JsonApiResource): any => ({
  id: resource.id,
  ...resource.attributes,
  // relationships가 있다면 포함
  ...(resource.relationships && { relationships: resource.relationships }),
  // meta 정보가 있다면 포함
  ...(resource.meta && { meta: resource.meta }),
});

// React Admin 데이터를 JSON API 형식으로 변환
const transformToJsonApiResource = (type: string, data: any, id?: string) => ({
  data: {
    type,
    ...(id && { id }),
    attributes: Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== 'id' && key !== 'relationships' && key !== 'meta')
    ),
    ...(data.relationships && { relationships: data.relationships }),
    ...(data.meta && { meta: data.meta }),
  }
});

// JSON API 스펙 준수 Data Provider 팩토리 함수
export const createJsonApiDataProvider = (apiUrl: string): DataProvider => {
  const jsonApiHttpClient = createJsonApiHttpClient();

  return {
    // 목록 조회 (GET /resources)
    getList: async (resource: string, params: GetListParams) => {
      const { page = 1, perPage = 10 } = params.pagination || {};
      const { field = 'id', order = 'ASC' } = params.sort || {};
      
      const query = new URLSearchParams();
      
      // JSON API 스펙 페이지네이션
      query.append('page[number]', page.toString());
      query.append('page[size]', perPage.toString());
      
      // JSON API 스펙 정렬
      const sortField = order === 'ASC' ? field : `-${field}`;
      query.append('sort', sortField);
      
      // JSON API 스펙 필터링
      Object.entries(params.filter || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(`filter[${key}]`, value.toString());
        }
      });

      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const json = await jsonApiHttpClient(url);
        
        let data: JsonApiResource[];
        if (Array.isArray(json.data)) {
          data = json.data;
        } else {
          data = [json.data];
        }
        
        return {
          data: data.map(transformJsonApiResource) as any[],
          total: json.meta?.total || json.meta?.count || data.length,
        };
      } catch (error) {
        console.error('getList error:', error);
        return { data: [], total: 0 };
      }
    },

    // 단일 항목 조회 (GET /resources/123)
    getOne: async (resource: string, params: GetOneParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      
      try {
        const json = await jsonApiHttpClient(url);
        
        if (Array.isArray(json.data)) {
          throw new Error('Expected single resource, got array');
        }
        
        return {
          data: transformJsonApiResource(json.data) as any,
        };
      } catch (error) {
        console.error('getOne error:', error);
        throw error;
      }
    },

    // 여러 항목 조회 (GET /resources?filter[id]=1,2,3)
    getMany: async (resource: string, params: GetManyParams) => {
      const query = new URLSearchParams();
      query.append('filter[id]', params.ids.join(','));
      
      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const json = await jsonApiHttpClient(url);
        
        let data: JsonApiResource[];
        if (Array.isArray(json.data)) {
          data = json.data;
        } else {
          data = [json.data];
        }
        
        return {
          data: data.map(transformJsonApiResource) as any[],
        };
      } catch (error) {
        console.error('getMany error:', error);
        return { data: [] };
      }
    },

    // 참조 관련 여러 항목 조회 (GET /resources?filter[target_id]=123)
    getManyReference: async (resource: string, params: GetManyReferenceParams) => {
      const { page = 1, perPage = 10 } = params.pagination || {};
      const { field = 'id', order = 'ASC' } = params.sort || {};
      
      const query = new URLSearchParams();
      
      // 페이지네이션
      query.append('page[number]', page.toString());
      query.append('page[size]', perPage.toString());
      
      // 정렬
      const sortField = order === 'ASC' ? field : `-${field}`;
      query.append('sort', sortField);
      
      // 타겟 필터
      query.append(`filter[${params.target}]`, params.id.toString());
      
      // 추가 필터
      Object.entries(params.filter || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(`filter[${key}]`, value.toString());
        }
      });

      const url = `${apiUrl}/${resource}?${query}`;
      
      try {
        const json = await jsonApiHttpClient(url);
        
        let data: JsonApiResource[];
        if (Array.isArray(json.data)) {
          data = json.data;
        } else {
          data = [json.data];
        }
        
        return {
          data: data.map(transformJsonApiResource) as any[],
          total: json.meta?.total || json.meta?.count || data.length,
        };
      } catch (error) {
        console.error('getManyReference error:', error);
        return { data: [], total: 0 };
      }
    },

    // 생성 (POST /resources)
    create: async (resource: string, params: CreateParams) => {
      const url = `${apiUrl}/${resource}`;
      const body = transformToJsonApiResource(resource, params.data);
      
      try {
        const json = await jsonApiHttpClient(url, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        
        if (Array.isArray(json.data)) {
          throw new Error('Expected single resource, got array');
        }
        
        return {
          data: transformJsonApiResource(json.data) as any,
        };
      } catch (error) {
        console.error('create error:', error);
        throw error;
      }
    },

    // 수정 (PATCH /resources/123)
    update: async (resource: string, params: UpdateParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      const body = transformToJsonApiResource(resource, params.data, params.id.toString());
      
      try {
        const json = await jsonApiHttpClient(url, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        
        if (Array.isArray(json.data)) {
          throw new Error('Expected single resource, got array');
        }
        
        return {
          data: transformJsonApiResource(json.data) as any,
        };
      } catch (error) {
        console.error('update error:', error);
        throw error;
      }
    },

    // 여러 항목 수정 (여러 PATCH 요청)
    updateMany: async (resource: string, params: UpdateManyParams) => {
      try {
        const promises = params.ids.map(id => {
          const url = `${apiUrl}/${resource}/${id}`;
          const body = transformToJsonApiResource(resource, params.data, id.toString());
          
          return jsonApiHttpClient(url, {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
        });
        
        await Promise.all(promises);
        return { data: params.ids };
      } catch (error) {
        console.error('updateMany error:', error);
        throw error;
      }
    },

    // 삭제 (DELETE /resources/123)
    delete: async (resource: string, params: DeleteParams) => {
      const url = `${apiUrl}/${resource}/${params.id}`;
      
      try {
        await jsonApiHttpClient(url, {
          method: 'DELETE',
        });
        
        return {
          data: params.previousData || { id: params.id },
        };
      } catch (error) {
        console.error('delete error:', error);
        throw error;
      }
    },

    // 여러 항목 삭제 (여러 DELETE 요청)
    deleteMany: async (resource: string, params: DeleteManyParams) => {
      try {
        const promises = params.ids.map(id =>
          jsonApiHttpClient(`${apiUrl}/${resource}/${id}`, {
            method: 'DELETE',
          })
        );
        
        await Promise.all(promises);
        return { data: params.ids };
      } catch (error) {
        console.error('deleteMany error:', error);
        throw error;
      }
    },
  };
};

// 로깅이 포함된 JSON API Data Provider 팩토리 함수
export const createJsonApiDataProviderWithLogging = (apiUrl: string): DataProvider => {
  const baseProvider = createJsonApiDataProvider(apiUrl);
  
  return {
    ...baseProvider,
    
    getList: async (resource: string, params: GetListParams) => {
      console.log(`[JSON API] getList ${resource}:`, params);
      const result = await baseProvider.getList(resource, params);
      console.log(`[JSON API] getList ${resource} result:`, result);
      return result;
    },
    
    getOne: async (resource: string, params: GetOneParams) => {
      console.log(`[JSON API] getOne ${resource}/${params.id}`);
      const result = await baseProvider.getOne(resource, params);
      console.log(`[JSON API] getOne ${resource}/${params.id} result:`, result);
      return result;
    },
    
    create: async (resource: string, params: CreateParams) => {
      console.log(`[JSON API] create ${resource}:`, params.data);
      const result = await baseProvider.create(resource, params);
      console.log(`[JSON API] create ${resource} result:`, result);
      return result;
    },
    
    update: async (resource: string, params: UpdateParams) => {
      console.log(`[JSON API] update ${resource}/${params.id}:`, params.data);
      const result = await baseProvider.update(resource, params);
      console.log(`[JSON API] update ${resource}/${params.id} result:`, result);
      return result;
    },
    
    delete: async (resource: string, params: DeleteParams) => {
      console.log(`[JSON API] delete ${resource}/${params.id}`);
      const result = await baseProvider.delete(resource, params);
      console.log(`[JSON API] delete ${resource}/${params.id} result:`, result);
      return result;
    },
  };
};

