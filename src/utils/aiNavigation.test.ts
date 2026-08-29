import { describe, expect, it, vi } from 'vitest';

import { normalizeAiChatResponse } from './aiChatParser';
import { applyAiNavigation } from './aiNavigation';

describe('normalizeAiChatResponse', () => {
  it('extracts business navigation metadata from backend result payloads', () => {
    const response = {
      success: true,
      data: {
        type: 'business',
        summary: 'Found crimes for Bangalore Urban',
        result: {
          crimes: [{ ROWID: '1', title: 'Theft', status: 'open' }],
          navigation: {
            route: '/entities/crimes',
            filters: {
              district: 'Bangalore Urban',
              startDate: '2025-01-01',
              endDate: '2025-12-31',
              crimeType: 'theft',
            },
          },
        },
      },
    };

    const normalized = normalizeAiChatResponse(response);

    expect(normalized.type).toBe('business');
    expect(normalized.summary).toBe('Found crimes for Bangalore Urban');
    expect(normalized.navigation).toMatchObject({
      route: '/entities/crimes',
      filters: {
        district: 'Bangalore Urban',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        crimeType: 'theft',
      },
    });
  });

  it('keeps casual responses without navigation', () => {
    const response = {
      success: true,
      data: {
        type: 'casual',
        message: 'How can I help?',
      },
    };

    const normalized = normalizeAiChatResponse(response);

    expect(normalized.type).toBe('casual');
    expect(normalized.navigation).toBeUndefined();
    expect(normalized.reply).toBe('How can I help?');
  });
});

describe('applyAiNavigation', () => {
  it('navigates to the canonical route and applies filters', () => {
    const navigate = vi.fn();
    const dispatch = vi.fn();

    applyAiNavigation(
      {
        route: '/entities/crimes',
        filters: {
          district: 'Bangalore Urban',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          crimeType: 'theft',
        },
      },
      navigate,
      dispatch,
    );

    expect(navigate).toHaveBeenCalledWith('/entities/crimes');
    expect(dispatch).toHaveBeenCalled();
  });

  it('replaces dynamic route segments with entity ids', () => {
    const navigate = vi.fn();
    const dispatch = vi.fn();

    applyAiNavigation(
      {
        route: '/entities/criminals/:criminalId',
        filters: { criminalId: 'ROWID-123' },
      },
      navigate,
      dispatch,
    );

    expect(navigate).toHaveBeenCalledWith('/entities/criminals/ROWID-123');
  });

  it('ignores unknown routes', () => {
    const navigate = vi.fn();

    const result = applyAiNavigation({ route: '/not-real' }, navigate);

    expect(result).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});
