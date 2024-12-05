import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import autoPaymentHandler from '@/pages/api/billing/auto-payment';
import { createClient } from '@supabase/supabase-js';

interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
};

const mockBankApiClient = {
  requestWithdrawal: jest.fn(),
  getTransactionStatus: jest.fn(),
};

jest.mock('@/lib/bankApi', () => ({
  BankApiClient: jest.fn().mockImplementation(() => mockBankApiClient),
}));

describe('自動引き落とし処理 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  test('正常な引き落とし処理が実行されること', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'test-company',
        amount: 10000,
        withdrawalDate: '2024-01-25'
      },
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [{
        id: 'test-company',
        bank_account: {
          bank_name: 'テスト銀行',
          branch_name: 'テスト支店',
          account_number: '1234567'
        }
      }],
      error: null
    });

    mockBankApiClient.requestWithdrawal.mockResolvedValueOnce({
      transactionId: 'tx-123',
      status: 'success'
    });

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      transactionId: 'tx-123'
    });
  });

  test('存在しない企業IDの場合はエラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'non-existent',
        amount: 10000,
        withdrawalDate: '2024-01-25'
      },
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [],
      error: null
    });

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: '対象企業が見つかりません'
    });
  });

  test('必須パラメータが不足している場合はエラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'test-company'
      },
    });

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '必須パラメータが不足しています'
    });
  });

  test('銀行APIエラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'test-company',
        amount: 10000,
        withdrawalDate: '2024-01-25'
      },
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [{
        id: 'test-company',
        bank_account: {
          bank_name: 'テスト銀行',
          branch_name: 'テスト支店',
          account_number: '1234567'
        }
      }],
      error: null
    });

    mockBankApiClient.requestWithdrawal.mockRejectedValueOnce(
      new Error('銀行APIエラー')
    );

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: '引き落とし処理に失敗しました'
    });
  });

  test('データベースエラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'test-company',
        amount: 10000,
        withdrawalDate: '2024-01-25'
      },
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: null,
      error: new Error('データベースエラー')
    });

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データベースエラーが発生しました'
    });
  });

  test('POSTメソッド以外のリクエストを拒否すること', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
    });

    await autoPaymentHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  test('引き落とし結果が正しく記録されること', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        companyId: 'test-company',
        amount: 10000,
        withdrawalDate: '2024-01-25'
      },
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [{
        id: 'test-company',
        bank_account: {
          bank_name: 'テスト銀行',
          branch_name: 'テスト支店',
          account_number: '1234567'
        }
      }],
      error: null
    });

    mockBankApiClient.requestWithdrawal.mockResolvedValueOnce({
      transactionId: 'tx-123',
      status: 'success'
    });

    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: { id: 'record-123' },
      error: null
    });

    await autoPaymentHandler(req, res);

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      company_id: 'test-company',
      amount: 10000,
      transaction_id: 'tx-123',
      status: 'completed',
      withdrawal_date: '2024-01-25'
    });
  });
});