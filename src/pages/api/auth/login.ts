import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '@/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { companyId, password } = req.body;

    if (!companyId || !password) {
      return res.status(400).json({ message: '企業IDとパスワードは必須です' });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return res.status(401).json({
        message: '企業IDまたはパスワードが正しくありません',
      });
    }

    const isValidPassword = await bcrypt.compare(password, company.password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: '企業IDまたはパスワードが正しくありません',
      });
    }

    if (company.status !== 'active') {
      return res.status(403).json({
        message: 'アカウントが無効化されています',
      });
    }

    const token = jwt.sign(
      { companyId: company.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ token });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
}