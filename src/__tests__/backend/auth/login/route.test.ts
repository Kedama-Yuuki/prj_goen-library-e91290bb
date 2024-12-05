import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import loginHandler from '@/pages/api/auth/login';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('ログイン認証APIのテスト', () => {
  let req: NextApiRequest;
  let res: NextApiResponse;
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    const { req: request, res: response } = createMocks({
      method: 'POST',
    });
    req = request;
    res = response;
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('正常なログインリクエストを処理する', async () => {
    const hashedPassword = 'hashedPassword123';
    const mockCompany = {
      id: 'test-company-id',
      password: hashedPassword,
      status: 'active',
    };

    req.body = {
      companyId: 'test-company',
      password: 'correct-password',
    };

    mockSupabase.single.mockResolvedValue({ data: mockCompany });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

    await loginHandler(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith('companies');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-company');
    expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', hashedPassword);
    expect(jwt.sign).toHaveBeenCalledWith(
      { companyId: mockCompany.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      token: 'fake-jwt-token',
    });
  });

  it('企業IDが存在しない場合エラーを返す', async () => {
    req.body = {
      companyId: 'non-existent-company',
      password: 'any-password',
    };

    mockSupabase.single.mockResolvedValue({ data: null });

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: '企業IDまたはパスワードが正しくありません',
    });
  });

  it('パスワードが一致しない場合エラーを返す', async () => {
    const mockCompany = {
      id: 'test-company-id',
      password: 'hashedPassword123',
      status: 'active',
    };

    req.body = {
      companyId: 'test-company',
      password: 'wrong-password',
    };

    mockSupabase.single.mockResolvedValue({ data: mockCompany });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: '企業IDまたはパスワードが正しくありません',
    });
  });

  it('必須パラメータが不足している場合エラーを返す', async () => {
    req.body = {
      companyId: 'test-company',
    };

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: '企業IDとパスワードは必須です',
    });
  });

  it('アカウントが無効状態の場合エラーを返す', async () => {
    const mockCompany = {
      id: 'test-company-id',
      password: 'hashedPassword123',
      status: 'inactive',
    };

    req.body = {
      companyId: 'test-company',
      password: 'correct-password',
    };

    mockSupabase.single.mockResolvedValue({ data: mockCompany });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'アカウントが無効化されています',
    });
  });

  it('データベースエラーの場合適切なエラーを返す', async () => {
    req.body = {
      companyId: 'test-company',
      password: 'test-password',
    };

    mockSupabase.single.mockRejectedValue(new Error('Database error'));

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'サーバーエラーが発生しました',
    });
  });

  it('POSTメソッド以外のリクエストを拒否する', async () => {
    const { req: request, res: response } = createMocks({
      method: 'GET',
    });

    await loginHandler(request, response);

    expect(response._getStatusCode()).toBe(405);
    expect(JSON.parse(response._getData())).toEqual({
      message: 'Method Not Allowed',
    });
  });
});