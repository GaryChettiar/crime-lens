import { baseApi } from './baseApi';

export interface AiChatRequest {
  message: string;
}

export interface AiChatCrimeRecord {
  ROWID?: string;
  id?: string;
  crime_number?: string;
  crimeNumber?: string;
  title?: string;
  status?: string;
  crime_occured_date_time?: string;
  occurredAt?: string;
  [key: string]: unknown;
}

export interface AiChatApiResponse {
  success?: boolean;
  data?: {
    type?: 'business' | 'casual' | 'error' | string;
    classification?: {
      intentType?: string;
      districtName?: string;
      fromYear?: string;
      toYear?: string;
      [key: string]: unknown;
    };
    toolResult?: {
      district?: string;
      districtId?: string;
      dateRange?: {
        from?: string;
        to?: string;
      };
      totalRecords?: number;
      crimes?: AiChatCrimeRecord[];
      pagination?: {
        page?: number;
        pageSize?: number;
        total?: number;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    response?: {
      type?: 'business' | 'casual' | 'error' | string;
      summary?: string;
      district?: string;
      dateRange?: {
        from?: string;
        to?: string;
      };
      crimeCount?: number;
      crimes?: AiChatCrimeRecord[];
      reply?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const aiChatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendAiChatMessage: builder.mutation<AiChatApiResponse, AiChatRequest>({
      query: ({ message }) => ({
        url: '/ai/chat',
        method: 'POST',
        body: { message },
      }),
    }),
  }),
});

export const { useSendAiChatMessageMutation } = aiChatApi;
