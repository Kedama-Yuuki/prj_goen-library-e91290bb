import { createMocks } from 'node-mocks-http';
import type { NextApiRequest } from 'next';
import type { MockResponse } from 'node-mocks-http';
import generateReport from '@/pages/api/analytics/generate-report';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

const mockLendingData = [
  {
    id: '1',
    book_id: 'book-1',
    borrower_id: 'user-1',
    lending_date: '2024-01-01',
    return_due_date: '2024-01-15',
    actual_return_date: '2024-01-14',
    status: '返却済'
  },
  {
    id: '2',
    book_id: 'book-2',
    borrower_id: 'user-2',
    lending_date: '2024-02-01',
    return_due_date: '2024-02-15',
    actual_return_date: null,
    status: '貸出中'
  }
];

const mockBooksData = [
  {
    id: 'book-1',
    title: '人工知能入門',
    genre: 'テクノロジー',
    status: '利用可能'
  },
  {
    id: 'book-2',
    title: 'リーダーシップ論',
    genre: 'ビジネス',
    status: '貸出中'
  }
];

describe('利用統計分析APIのテスト', () => {
  let req: NextApiRequest;
  let res: MockResponse<any>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    const { req: request, res: response } = createMocks({
      method: 'GET',
    });
    req = request;
    res = response;

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      data: null,
      error: null
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('正常な期間指定での統計データ取得', async () => {
    req.query = {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    };

    mockSupabaseClient.data = {
      lending_records: mockLendingData,
      books: mockBooksData
    };

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('lendingStats');
    expect(responseData).toHaveProperty('bookStats');
    expect(responseData.lendingStats.totalLending).toBeDefined();
    expect(responseData.bookStats.totalBooks).toBeDefined();
  });

  it('期間パラメータが不正な場合のエラー処理', async () => {
    req.query = {
      startDate: 'invalid-date',
      endDate: '2024-03-31'
    };

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '不正な日付形式です'
    });
  });

  it('データベースエラー時のエラー処理', async () => {
    req.query = {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    };

    mockSupabaseClient.error = new Error('データベースエラー');

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データの取得に失敗しました'
    });
  });

  it('期間指定なしでの全期間データ取得', async () => {
    mockSupabaseClient.data = {
      lending_records: mockLendingData,
      books: mockBooksData
    };

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.lendingStats).toBeDefined();
    expect(responseData.bookStats).toBeDefined();
  });

  it('データが空の場合の処理', async () => {
    mockSupabaseClient.data = {
      lending_records: [],
      books: []
    };

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.lendingStats.totalLending).toBe(0);
    expect(responseData.bookStats.totalBooks).toBe(0);
  });

  it('不正なHTTPメソッドの処理', async () => {
    const { req: postReq, res: postRes } = createMocks({
      method: 'POST',
    });

    await generateReport(postReq, postRes);

    expect(postRes._getStatusCode()).toBe(405);
    expect(JSON.parse(postRes._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('集計データの正確性確認', async () => {
    req.query = {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    };

    mockSupabaseClient.data = {
      lending_records: mockLendingData,
      books: mockBooksData
    };

    await generateReport(req, res);

    const responseData = JSON.parse(res._getData());
    expect(responseData.lendingStats.totalLending).toBe(2);
    expect(responseData.bookStats.totalBooks).toBe(2);
    expect(responseData.lendingStats.averageDuration).toBeDefined();
    expect(responseData.bookStats.activeBooks).toBeDefined();
  });

  it('認証エラー時の処理', async () => {
    mockSupabaseClient.error = {
      message: '認証エラー',
      status: 401
    };

    await generateReport(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: '認証に失敗しました'
    });
  });

  it('月別トレンドデータの生成確認', async () => {
    req.query = {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    };

    mockSupabaseClient.data = {
      lending_records: mockLendingData,
      books: mockBooksData
    };

    await generateReport(req, res);

    const responseData = JSON.parse(res._getData());
    expect(responseData.lendingStats.monthlyTrends).toBeDefined();
    expect(Array.isArray(responseData.lendingStats.monthlyTrends)).toBe(true);
    expect(responseData.lendingStats.monthlyTrends.length).toBeGreaterThan(0);
  });
});