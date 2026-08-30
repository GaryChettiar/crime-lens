import { baseApi } from "./baseApi";

export interface EvidenceBlobResult {
  url: string;
  contentType: string;
}

// Fallback for when neither the evidence record nor the blob response
// gives us a usable mime type (e.g. server returns application/octet-stream
// or omits Content-Type entirely).
function guessMimeFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
  };
  return ext ? map[ext] : undefined;
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
          url: `/storage/blob/`,
          params: { path: encodedPath },
          responseHandler: async (response: Response) => {
            const blob = await response.blob();
            // Strip params (e.g. "application/octet-stream; charset=binary")
            // and treat generic/placeholder values as "no answer" so we
            // fall through to guessing from the extension instead of
            // trusting a useless content type.
            const rawHeader = response.headers.get('Content-Type');
            const normalizedHeader = rawHeader?.split(';')[0].trim().toLowerCase();
            const isGeneric =
              !normalizedHeader ||
              normalizedHeader === 'application/octet-stream' ||
              normalizedHeader === 'binary/octet-stream';

            // Server doesn't reliably set Content-Type for this endpoint,
            // so fall back to guessing from the file extension when it's
            // missing or generic. blob.type inherits from the header too,
            // so it's just as unreliable — don't fall back to it.
            const contentType = !isGeneric
              ? (normalizedHeader as string)
              : guessMimeFromPath(objectPath) || rawHeader || blob.type;

            return {
              url: URL.createObjectURL(blob),
              contentType,
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