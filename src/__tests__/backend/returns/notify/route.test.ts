import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import returnNotifyHandler from '@/pages/api/returns/notify';
import nodemailer from 'nodemailer';

jest.mock('@supabase/supabase-js');
jest.mock('nodemailer');

const mockLendingRecords = [
  {
    id: '1',
    book_id: 'book-1',
    borrower_id: 'user-1',
    lending_date: '2024-01-01',
    return_due_date: '2024-02-01',
    status: '貸出中',
    book: {
      title: 'テスト書籍1'
    },
    borrower: {
      name: 'テストユーザー1',
      email: 'test1@example.com'
    }
  },
  {
    id: '2',
    book_id: 'book-2',
    borrower_id: 'user-2',
    lending_date: '2024-01-15',
    return_due_date: '2024-02-15',
    status: '貸出中',
    book: {
      title: 'テスト書籍2'
    },
    borrower: {
      name: 'テストユーザー2',
      email: 'test2@example.com'
    }
  }
];

const mockSendMail = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail
});

describe('返却期限通知処理 API', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      data: mockLendingRecords,
      error: null
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  test('返却期限が近い貸出書籍の通知が正常に送信される', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        days: 7
      }
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: mockLendingRecords,
      error: null
    });

    mockSendMail.mockResolvedValue({ messageId: 'test-id' });

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      notifiedCount: 2
    });

    expect(mockSendMail).toHaveBeenCalledTimes(2);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test1@example.com',
      subject: expect.stringContaining('返却期限が近づいています'),
      html: expect.stringContaining('テスト書籍1')
    }));
  });

  test('特定の貸出IDのみに対して通知を送信する', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lendingIds: ['1']
      }
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: [mockLendingRecords[0]],
      error: null
    });

    mockSendMail.mockResolvedValue({ messageId: 'test-id' });

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      notifiedCount: 1
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test1@example.com'
    }));
  });

  test('データベースエラー時に適切なエラーレスポンスを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        days: 7
      }
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'データベースの取得に失敗しました'
    });
  });

  test('メール送信エラー時に適切なエラーレスポンスを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        days: 7
      }
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: mockLendingRecords,
      error: null
    });

    mockSendMail.mockRejectedValue(new Error('Mail sending failed'));

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'メール送信に失敗しました'
    });
  });

  test('無効なリクエストメソッドの場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: '許可されていないメソッドです'
    });
  });

  test('必須パラメータが不足している場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await returnNotifyHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: '必須パラメータが不足しています'
    });
  });
});