import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/books/scan-isbn';
import { jest } from '@jest/globals';

interface MockResponse extends NextApiResponse {
    _getStatusCode(): number;
    _getData(): string;
}

const mockBookData = {
    isbn: '9784123456789',
    title: 'テスト書籍',
    author: 'テスト著者',
    publisher: 'テスト出版'
};

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            insert: jest.fn().mockResolvedValue({ data: mockBookData, error: null }),
            select: jest.fn().mockResolvedValue({ data: mockBookData, error: null }),
        })),
    })),
}));

describe('/api/books/scan-isbn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('正しいISBNコードで書籍情報を取得できること', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '9784123456789'
            },
        });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockBookData)
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(mockBookData);
    });

    it('不正なISBNコードの場合エラーを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: 'invalid-isbn'
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Invalid ISBN format'
        });
    });

    it('外部APIエラー時に適切なエラーレスポンスを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '9784123456789'
            },
        });

        global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Failed to fetch book data'
        });
    });

    it('POST以外のメソッドでアクセスした場合405エラーを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Method not allowed'
        });
    });

    it('バーコードデータが空の場合エラーを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: ''
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Barcode data is required'
        });
    });

    it('正しい形式のISBN-13を処理できること', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '9784123456789'
            },
        });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockBookData)
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toHaveProperty('isbn', '9784123456789');
    });

    it('正しい形式のISBN-10を処理できること', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '4123456789'
            },
        });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({...mockBookData, isbn: '4123456789'})
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toHaveProperty('isbn', '4123456789');
    });

    it('データベース保存エラー時に適切なエラーレスポンスを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '9784123456789'
            },
        });

        const mockSupabaseError = new Error('Database error');
        jest.mocked(createClient).mockImplementationOnce(() => ({
            from: jest.fn(() => ({
                insert: jest.fn().mockRejectedValueOnce(mockSupabaseError),
                select: jest.fn().mockRejectedValueOnce(mockSupabaseError),
            })),
        }));

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Failed to save book data'
        });
    });

    it('重複するISBNの場合既存データを返すこと', async () => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
            method: 'POST',
            body: {
                barcodeData: '9784123456789'
            },
        });

        jest.mocked(createClient).mockImplementationOnce(() => ({
            from: jest.fn(() => ({
                select: jest.fn().mockResolvedValueOnce({ data: [mockBookData], error: null }),
            })),
        }));

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(mockBookData);
    });
});