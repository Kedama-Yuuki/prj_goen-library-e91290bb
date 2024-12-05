import { createMocks } from 'node-mocks-http';
import type { MockResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import generateRecommendations from '@/pages/api/recommend/generate';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('AIレコメンド処理 API', () => {
  let mockReq: NextApiRequest;
  let mockRes: MockResponse<NextApiResponse>;
  
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    data: null,
    error: null,
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    const { req, res } = createMocks({
      method: 'GET',
    });
    mockReq = req;
    mockRes = res;
  });

  test('正常なレコメンド結果を返却する', async () => {
    const mockLendingHistory = [
      { book_id: '1', category: 'business' },
      { book_id: '2', category: 'technology' }
    ];
    
    const mockCompanyInfo = {
      id: 'company-1',
      type: 'manufacturing',
      size: 'medium'
    };

    const mockRecommendations = {
      business: [
        { id: '1', title: 'ビジネス書1' },
        { id: '2', title: 'ビジネス書2' }
      ],
      technology: [
        { id: '3', title: '技術書1' },
        { id: '4', title: '技術書2' }
      ]
    };

    mockSupabaseClient.data = mockLendingHistory;
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: mockLendingHistory, error: null })
    }));

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: [mockCompanyInfo], error: null })
    }));

    await generateRecommendations(mockReq, mockRes);

    expect(mockRes._getStatusCode()).toBe(200);
    expect(JSON.parse(mockRes._getData())).toEqual(
      expect.objectContaining({
        recommendations: expect.any(Object),
        categories: expect.any(Array)
      })
    );
  });

  test('企業IDが未指定の場合はエラーを返す', async () => {
    mockReq.headers = {};

    await generateRecommendations(mockReq, mockRes);

    expect(mockRes._getStatusCode()).toBe(400);
    expect(JSON.parse(mockRes._getData())).toEqual({
      error: '企業IDが指定されていません'
    });
  });

  test('利用履歴データの取得に失敗した場合はエラーを返す', async () => {
    mockReq.headers = { 'x-company-id': 'company-1' };
    
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: null, error: new Error('データベースエラー') })
    }));

    await generateRecommendations(mockReq, mockRes);

    expect(mockRes._getStatusCode()).toBe(500);
    expect(JSON.parse(mockRes._getData())).toEqual({
      error: '利用履歴の取得に失敗しました'
    });
  });

  test('企業情報の取得に失敗した場合はエラーを返す', async () => {
    mockReq.headers = { 'x-company-id': 'company-1' };
    
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    }));

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: null, error: new Error('データベースエラー') })
    }));

    await generateRecommendations(mockReq, mockRes);

    expect(mockRes._getStatusCode()).toBe(500);
    expect(JSON.parse(mockRes._getData())).toEqual({
      error: '企業情報の取得に失敗しました'
    });
  });

  test('利用履歴が存在しない場合はデフォルトレコメンドを返す', async () => {
    mockReq.headers = { 'x-company-id': 'company-1' };
    
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    }));

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ 
        data: [{
          id: 'company-1',
          type: 'manufacturing',
          size: 'medium'
        }],
        error: null
      })
    }));

    await generateRecommendations(mockReq, mockRes);

    expect(mockRes._getStatusCode()).toBe(200);
    expect(JSON.parse(mockRes._getData())).toEqual(
      expect.objectContaining({
        recommendations: expect.any(Object),
        categories: expect.any(Array)
      })
    );
  });

  test('カテゴリーフィルターが指定された場合は該当カテゴリーのみ返す', async () => {
    mockReq.headers = { 'x-company-id': 'company-1' };
    mockReq.query = { category: 'business' };

    const mockLendingHistory = [
      { book_id: '1', category: 'business' }
    ];

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: mockLendingHistory, error: null })
    }));

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ 
        data: [{
          id: 'company-1',
          type: 'manufacturing',
          size: 'medium'
        }],
        error: null
      })
    }));

    await generateRecommendations(mockReq, mockRes);

    const response = JSON.parse(mockRes._getData());
    expect(mockRes._getStatusCode()).toBe(200);
    expect(response.recommendations).toHaveProperty('business');
    expect(response.recommendations).not.toHaveProperty('technology');
  });

  test('レコメンド数の上限が指定された場合は指定数まで返す', async () => {
    mockReq.headers = { 'x-company-id': 'company-1' };
    mockReq.query = { limit: '1' };

    const mockLendingHistory = [
      { book_id: '1', category: 'business' },
      { book_id: '2', category: 'business' }
    ];

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ data: mockLendingHistory, error: null })
    }));

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue({ 
        data: [{
          id: 'company-1',
          type: 'manufacturing',
          size: 'medium'
        }],
        error: null
      })
    }));

    await generateRecommendations(mockReq, mockRes);

    const response = JSON.parse(mockRes._getData());
    expect(mockRes._getStatusCode()).toBe(200);
    expect(Object.values(response.recommendations.business)).toHaveLength(1);
  });
});