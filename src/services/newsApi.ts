/**
 * News API — RTK Query service for the Flask news backend.
 *
 * This is a STANDALONE API (not injected into baseApi) because
 * the news backend runs on a separate Flask server at 127.0.0.1:5000.
 * Vite proxies /news-api → http://127.0.0.1:5000 in dev.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { NewsArticle, ScrapeResponse } from '@/features/intelligence/types';

export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/news-api',
  }),
  tagTypes: ['News'],
  endpoints: (builder) => ({
    /**
     * Fetch all stored news articles from the Flask backend.
     * Returns up to 100 articles sorted by newest first.
     */
    getNews: builder.query<NewsArticle[], void>({
      query: () => '/api/news',
      providesTags: ['News'],
    }),

    /**
     * Trigger a fresh scrape of RSS feeds.
     * Returns the count of fetched and newly inserted articles.
     */
    triggerScrape: builder.mutation<ScrapeResponse, void>({
      query: () => ({
        url: '/api/scrape',
        method: 'POST',
      }),
      invalidatesTags: ['News'],
    }),
  }),
});

export const {
  useGetNewsQuery,
  useTriggerScrapeMutation,
} = newsApi;

/**
 * Generate the full export URL for CSV download.
 */
export function getExportUrl(): string {
  return '/news-api/api/export';
}
