import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import optimizeHandler from '@/pages/api/matching/optimize';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
}

describe('AIマッチング最適化API', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    data: null,
    error: null,
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockImplementation(() => mockSupabaseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockLendingData = [
    {
      id: '1',
      borrower_id: 'company1',
      book_id: 'book1',
      lending_date: '2024-01-01',
      return_date: '2024-01-15',
    },
    {
      id: '2',
      borrower_id: 'company2',
      book_id: 'book2',
      lending_date: '2024-01-02',
      return_date: '2024-01-16',
    },
  ];

  const mockCompanyData = [
    { id: 'company1', name: 'テスト企業A' },
    { id: 'company2', name: 'テスト企業B' },
  ];

  const mockBookData = [
    { id: 'book1', title: 'テスト書籍1', author: '著者1' },
    { id: 'book2', title: 'テスト書籍2', author: '著者2' },
  ];

  test('正常なリクエストで200とマッチング結果を返すこと', async () => {
    mockSupabaseClient.data = mockLendingData;
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('results');
    expect(Array.isArray(responseData.results)).toBe(true);
  });

  test('パラメータが不正な場合400エラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: -1,
        maxResults: 0,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
  });

  test('データベースエラー時に500エラーを返すこと', async () => {
    mockSupabaseClient.error = new Error('Database error');
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
  });

  test('GET メソッドで405エラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
  });

  test('マッチングスコアの計算が正しく行われること', async () => {
    mockSupabaseClient.data = mockLendingData;
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.results[0]).toHaveProperty('matchScore');
    expect(typeof responseData.results[0].matchScore).toBe('number');
    expect(responseData.results[0].matchScore).toBeGreaterThanOrEqual(0.8);
  });

  test('ページネーションパラメータが正しく処理されること', async () => {
    mockSupabaseClient.data = mockLendingData;
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 5,
        page: 2,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('currentPage', 2);
    expect(responseData).toHaveProperty('totalPages');
  });

  test('企業フィルターが正しく適用されること', async () => {
    mockSupabaseClient.data = mockLendingData;
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
        companyFilter: 'テスト企業A',
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.results.every((result: any) => 
      result.companyName.includes('テスト企業A')
    )).toBe(true);
  });

  test('推奨書籍が正しく含まれていること', async () => {
    mockSupabaseClient.data = mockLendingData;
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.results[0]).toHaveProperty('recommendedBooks');
    expect(Array.isArray(responseData.results[0].recommendedBooks)).toBe(true);
  });

  test('認証エラー時に401エラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        minScore: 0.8,
        maxResults: 10,
      },
      headers: {
        authorization: 'invalid-token',
      },
    });

    await optimizeHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
  });
});