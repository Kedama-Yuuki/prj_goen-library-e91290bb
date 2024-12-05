import { createMocks } from 'node-mocks-http';
import arrangeHandler from '@/pages/api/shipping/arrange';
import { createClient } from '@supabase/supabase-js';
import type { MockResponse } from 'node-mocks-http';

jest.mock('@supabase/supabase-js');

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

(createClient as jest.Mock).mockImplementation(() => mockSupabaseClient);

describe('配送手配APIのテスト', () => {
  const validShippingData = {
    lendingRecordId: 'abc-123',
    carrierId: 1,
    recipientName: 'テストユーザー',
    recipientAddress: '東京都渋谷区恵比寿',
    recipientZipCode: '150-0013',
    recipientPhone: '03-1234-5678',
    notes: 'テスト備考'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常な配送手配リクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData
    });

    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: { id: 'ship-123', tracking_number: '1234-5678-90' },
      error: null
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(200);
    expect(JSON.parse(response._getData())).toEqual({
      id: 'ship-123',
      trackingNumber: '1234-5678-90'
    });
  });

  it('必須パラメータが不足している場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lendingRecordId: 'abc-123'
      }
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(400);
    expect(JSON.parse(response._getData())).toEqual({
      error: '必須パラメータが不足しています'
    });
  });

  it('配送業者APIとの連携に失敗した場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData
    });

    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: null,
      error: new Error('配送業者APIエラー')
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(500);
    expect(JSON.parse(response._getData())).toEqual({
      error: '配送手配に失敗しました'
    });
  });

  it('POSTメソッド以外のリクエストを拒否すること', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(405);
    expect(JSON.parse(response._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('データベースへの保存が正常に行われること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData
    });

    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: {
        id: 'ship-123',
        tracking_number: '1234-5678-90',
        status: 'created'
      },
      error: null
    });

    await arrangeHandler(req, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('shipping_records');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      lending_record_id: 'abc-123',
      carrier_id: 1,
      recipient_name: 'テストユーザー',
      recipient_address: '東京都渋谷区恵比寿',
      recipient_zip_code: '150-0013',
      recipient_phone: '03-1234-5678',
      notes: 'テスト備考',
      status: 'pending'
    });
  });

  it('不正なZIPコードでエラーを返すこと', async () => {
    const invalidData = {
      ...validShippingData,
      recipientZipCode: '1234'
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(400);
    expect(JSON.parse(response._getData())).toEqual({
      error: '不正な郵便番号形式です'
    });
  });

  it('不正な電話番号でエラーを返すこと', async () => {
    const invalidData = {
      ...validShippingData,
      recipientPhone: '1234'
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(400);
    expect(JSON.parse(response._getData())).toEqual({
      error: '不正な電話番号形式です'
    });
  });

  it('認証エラーの場合401を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData,
      headers: {
        authorization: 'invalid-token'
      }
    });

    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: null,
      error: { message: '認証エラー', code: 'unauthorized' }
    });

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(401);
    expect(JSON.parse(response._getData())).toEqual({
      error: '認証に失敗しました'
    });
  });

  it('配送業者の在庫状況を確認できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData
    });

    mockSupabaseClient.select.mockResolvedValueOnce({
      data: { available: true },
      error: null
    });

    await arrangeHandler(req, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('carrier_availability');
    expect(mockSupabaseClient.select).toHaveBeenCalled();
  });

  it('トランザクションが正常にロールバックされること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validShippingData
    });

    mockSupabaseClient.insert.mockRejectedValueOnce(new Error('DB Error'));

    await arrangeHandler(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(500);
    expect(JSON.parse(response._getData())).toEqual({
      error: 'トランザクションに失敗しました'
    });
  });
});