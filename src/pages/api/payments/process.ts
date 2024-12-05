import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import axios from 'axios';

const BANK_API_ENDPOINT = 'https://api.bankservice.example.com/v1/transfers';
const MAX_BATCH_SIZE = 100;

type BankInfo = {
  bankName: string;
  branchCode: string;
  accountNumber: string;
};

type PaymentRequest = {
  id: string;
  companyId: string;
  amount: number;
  bankInfo: BankInfo;
};

type BankTransferRequest = {
  recipientName: string;
  bankName: string;
  branchCode: string;
  accountNumber: string;
  amount: number;
  description: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentRequests } = req.body as { paymentRequests: PaymentRequest[] };

    if (!paymentRequests || !Array.isArray(paymentRequests)) {
      return res.status(400).json({ error: '支払いリクエストが指定されていません' });
    }

    if (paymentRequests.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: '一度に処理できる支払い件数を超えています' });
    }

    // バリデーション
    for (const request of paymentRequests) {
      if (request.amount <= 0) {
        return res.status(400).json({ error: '無効な支払い金額が含まれています' });
      }

      const { bankInfo } = request;
      if (!bankInfo.bankName || !bankInfo.branchCode || !bankInfo.accountNumber) {
        return res.status(400).json({ error: '不完全な銀行情報が含まれています' });
      }
    }

    // 処理済みの支払いチェック
    const { data: existingPayments, error: checkError } = await supabase
      .from('billing_records')
      .select('id, status')
      .in('id', paymentRequests.map(req => req.id))
      .eq('status', '処理済');

    if (checkError) {
      throw new Error('データベース検証に失敗しました');
    }

    if (existingPayments && existingPayments.length > 0) {
      return res.status(400).json({ error: '既に処理済みの支払いが含まれています' });
    }

    // 会社情報の取得
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', paymentRequests.map(req => req.companyId));

    if (companyError) {
      throw new Error('会社情報の取得に失敗しました');
    }

    // 銀行APIへの送信データ準備
    const transferRequests: BankTransferRequest[] = paymentRequests.map(request => {
      const company = companies?.find(c => c.id === request.companyId);
      return {
        recipientName: company?.name || '',
        bankName: request.bankInfo.bankName,
        branchCode: request.bankInfo.branchCode,
        accountNumber: request.bankInfo.accountNumber,
        amount: request.amount,
        description: `利用料支払い - ${new Date().toISOString().split('T')[0]}`
      };
    });

    // 銀行APIへの一括振込リクエスト
    try {
      await axios.post(BANK_API_ENDPOINT, {
        transfers: transferRequests
      });
    } catch (error) {
      throw new Error('振込処理に失敗しました');
    }

    // 支払い状態の更新
    const { error: updateError } = await supabase
      .from('billing_records')
      .update({ 
        status: '処理済',
        actual_payment_date: new Date().toISOString()
      })
      .in('id', paymentRequests.map(req => req.id));

    if (updateError) {
      throw new Error('支払い状態の更新に失敗しました');
    }

    return res.status(200).json({
      success: true,
      processedCount: paymentRequests.length
    });

  } catch (error) {
    console.error('支払処理エラー:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'データベース処理に失敗しました'
    });
  }
}