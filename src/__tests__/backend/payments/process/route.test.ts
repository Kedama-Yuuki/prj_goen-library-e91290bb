import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import processPayments from '@/pages/api/payments/process';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('支払処理APIのテスト', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    data: null,
    error: null
  };

  const mockBankApiClient = {
    transferBulk: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockImplementation(() => mockSupabaseClient);
  });

  const mockPaymentRequests = [
    {
      id: '1',
      companyId: 'comp-1',
      amount: 10000,
      bankInfo: {
        bankName: 'テスト銀行',
        branchCode: '001',
        accountNumber: '1234567'
      }
    },
    {
      id: '2',
      companyId: 'comp-2',
      amount: 20000,
      bankInfo: {
        bankName: 'テスト銀行2',
        branchCode: '002',
        accountNumber: '7654321'
      }
    }
  ];

  it('正常な支払処理が実行できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: mockPaymentRequests
      }
    });

    mockSupabaseClient.data = { success: true };
    mockSupabaseClient.error = null;
    mockBankApiClient.transferBulk.mockResolvedValue({ success: true });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      processedCount: 2
    });
  });

  it('必須パラメータが不足している場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '支払いリクエストが指定されていません'
    });
  });

  it('Supabaseエラー時にエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: mockPaymentRequests
      }
    });

    mockSupabaseClient.error = { message: 'Database error' };

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データベース処理に失敗しました'
    });
  });

  it('銀行APIエラー時にエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: mockPaymentRequests
      }
    });

    mockSupabaseClient.data = { success: true };
    mockSupabaseClient.error = null;
    mockBankApiClient.transferBulk.mockRejectedValue(new Error('Bank API error'));

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: '振込処理に失敗しました'
    });
  });

  it('GET メソッドの場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('支払い金額が0以下の場合にエラーを返すこと', async () => {
    const invalidPaymentRequests = [{
      ...mockPaymentRequests[0],
      amount: -1000
    }];

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: invalidPaymentRequests
      }
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '無効な支払い金額が含まれています'
    });
  });

  it('銀行情報が不完全な場合にエラーを返すこと', async () => {
    const invalidPaymentRequests = [{
      ...mockPaymentRequests[0],
      bankInfo: {
        bankName: 'テスト銀行'
        // 必須の branchCode と accountNumber が欠落
      }
    }];

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: invalidPaymentRequests
      }
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '不完全な銀行情報が含まれています'
    });
  });

  it('一括処理の上限を超えた場合にエラーを返すこと', async () => {
    const tooManyRequests = Array(101).fill(mockPaymentRequests[0]);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: tooManyRequests
      }
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '一度に処理できる支払い件数を超えています'
    });
  });

  it('処理済みの支払いを含む場合にエラーを返すこと', async () => {
    mockSupabaseClient.select.mockImplementation(() => ({
      data: [{ id: mockPaymentRequests[0].id, status: '処理済' }],
      error: null
    }));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentRequests: mockPaymentRequests
      }
    });

    await processPayments(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '既に処理済みの支払いが含まれています'
    });
  });
});