import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function generateNotificationTemplate(bookTitle: string, dueDate: string) {
  try {
    const prompt = `
      書籍「${bookTitle}」の返却期限（${dueDate}）が近づいていることを通知するメールの本文を作成してください。
      丁寧でビジネスライクな文面にしてください。
    `;
    const response = await getLlmModelAndGenerateContent('Gemini', 'メール文面生成', prompt);
    return response || `
      いつもご利用ありがとうございます。
      
      貸出中の書籍「${bookTitle}」の返却期限（${dueDate}）が近づいております。
      お手数ですが、期限内にご返却いただきますようお願いいたします。
      
      ※返却期限を過ぎますと、追加料金が発生する場合がございます。
      
      ご不明な点がございましたら、お気軽にお問い合わせください。
    `;
  } catch (error) {
    return `
      いつもご利用ありがとうございます。
      
      貸出中の書籍「${bookTitle}」の返却期限（${dueDate}）が近づいております。
      お手数ですが、期限内にご返却いただきますようお願いいたします。
      
      ※返却期限を過ぎますと、追加料金が発生する場合がございます。
      
      ご不明な点がございましたら、お気軽にお問い合わせください。
    `;
  }
}

async function sendNotificationEmail(to: string, bookTitle: string, dueDate: string) {
  const mailContent = await generateNotificationTemplate(bookTitle, dueDate);
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: to,
    subject: `【返却期限のお知らせ】書籍「${bookTitle}」の返却期限が近づいています`,
    html: mailContent,
  };

  await transporter.sendMail(mailOptions);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '許可されていないメソッドです' });
  }

  const { days, lendingIds } = req.body;

  if (!days && !lendingIds) {
    return res.status(400).json({ success: false, error: '必須パラメータが不足しています' });
  }

  try {
    let query = supabase
      .from('lending_records')
      .select(`
        *,
        book:books(*),
        borrower:companies(*)
      `)
      .eq('status', '貸出中');

    if (lendingIds) {
      query = query.in('id', lendingIds);
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      query = query.lte('return_due_date', targetDate.toISOString());
    }

    const { data: lendingRecords, error } = await query;

    if (error) {
      throw new Error('データベースの取得に失敗しました');
    }

    if (!lendingRecords || lendingRecords.length === 0) {
      return res.status(200).json({ success: true, notifiedCount: 0 });
    }

    for (const record of lendingRecords) {
      try {
        await sendNotificationEmail(
          record.borrower.contact.email,
          record.book.title,
          new Date(record.return_due_date).toLocaleDateString()
        );
      } catch (error) {
        console.error('メール送信エラー:', error);
        throw new Error('メール送信に失敗しました');
      }
    }

    return res.status(200).json({
      success: true,
      notifiedCount: lendingRecords.length
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'エラーが発生しました'
    });
  }
}