import { createMocks } from 'node-mocks-http';
import type { MockResponse } from 'node-mocks-http';
import generateInvoice from '@/pages/api/billing/generate-invoice';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

jest.mock('@supabase/supabase-js');
jest.mock('nodemailer');
jest.mock('pdfkit');

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  between: jest.fn().mockReturnThis(),
  data: null,
  error: null,
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
};

const mockTransporter = {
  sendMail: jest.fn(),
};

describe('月次請求書生成処理 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  const mockUsageData = [
    {
      company_id: 'company-1',
      usage_fee: 45000,
      shipping_fee: 5000,
      total_books: 10,
    },
    {
      company_id: 'company-2',
      usage_fee: 28000,
      shipping_fee: 2000,
      total_books: 5,
    }
  ];

  it('正常な請求書生成処理が実行できること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(response._getData());
    expect(responseData.message).toBe('請求書の生成が完了しました');
    expect(responseData.invoices).toHaveLength(2);
  });

  it('請求対象月のバリデーションが機能すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: 'invalid-date'
      },
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(400);
    expect(JSON.parse(response._getData())).toEqual({
      error: '請求対象月の形式が不正です'
    });
  });

  it('データベースエラー時に適切なエラーレスポンスを返すこと', async () => {
    mockSupabaseClient.data = null;
    mockSupabaseClient.error = new Error('データベースエラー');

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(500);
    expect(JSON.parse(response._getData())).toEqual({
      error: 'データベースの処理中にエラーが発生しました'
    });
  });

  it('PDFファイルが正しく生成されること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    expect(PDFDocument).toHaveBeenCalled();
  });

  it('メール送信が正しく実行されること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        subject: expect.stringContaining('2024年1月分請求書'),
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('invoice'),
            content: expect.any(Buffer)
          })
        ])
      })
    );
  });

  it('GET メソッドでアクセスした場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    expect(response._getStatusCode()).toBe(405);
    expect(JSON.parse(response._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('請求書番号が正しく採番されること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    const responseData = JSON.parse(response._getData());
    
    responseData.invoices.forEach((invoice: any) => {
      expect(invoice.invoiceNumber).toMatch(/INV-202401-\d{4}/);
    });
  });

  it('料金計算が正しく行われること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    const response = res as MockResponse;
    const responseData = JSON.parse(response._getData());
    
    expect(responseData.invoices[0].totalAmount).toBe(50000);
    expect(responseData.invoices[1].totalAmount).toBe(30000);
  });

  it('請求書レコードが正しくデータベースに保存されること', async () => {
    mockSupabaseClient.data = mockUsageData;
    mockSupabaseClient.error = null;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        billingMonth: '2024-01'
      },
    });

    await generateInvoice(req, res);

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company_id: 'company-1',
          billing_month: '2024-01',
          amount: 50000,
          status: '未払い'
        }),
        expect.objectContaining({
          company_id: 'company-2',
          billing_month: '2024-01',
          amount: 30000,
          status: '未払い'
        })
      ])
    );
  });
});