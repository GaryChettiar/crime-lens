import { baseApi } from "./baseApi";

export interface EvidenceBlobResult {
  url: string;
  contentType: string;
}

export const storageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvidenceBlob: builder.query<EvidenceBlobResult, string>({
      query: (objectPath: string) => {
        // Encode each path segment individually so slashes in the
        // Stratus path survive but special characters in filenames don't break the URL
        const encodedPath = objectPath
          .replace(/^\/+/, '')
          .split('/')
          .map(encodeURIComponent)
          .join('/');

        return {
          url: `/storage/blob/${encodedPath}`,
          responseHandler: async (response: Response) => {
            const blob = await response.blob();
            return {
              url: URL.createObjectURL(blob),
              contentType: response.headers.get('Content-Type') || blob.type,
            };
          },
          cache: 'no-cache',
        };
      },
      // Blob object URLs leak memory if never revoked — clean up when the
      // query result is evicted from the RTK Query cache.
      async onCacheEntryAdded(_arg, { cacheDataLoaded, cacheEntryRemoved }) {
        try {
          const { data } = await cacheDataLoaded;
          await cacheEntryRemoved;
          URL.revokeObjectURL(data.url);
        } catch {
          // query never resolved — nothing to revoke
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetEvidenceBlobQuery } = storageApi;