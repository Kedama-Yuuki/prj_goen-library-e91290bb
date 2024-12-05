import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/supabase';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

interface BankAccount {
  bank_name: string;
  branch_name: string;
  account_type: string;
  account_number: string;
}

interface Company {
  id: string;
  bank_account: BankAccount;
}

interface WithdrawalRequest {
  companyId: string;
  amount: number;
  withdrawalDate: string;
}

const BANK_API_ENDPOINT = 'https://api.bank-example.com/v1';

class BankApiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BANK_API_KEY || '';
  }

  async requestWithdrawal(bankAccount: BankAccount, amount: number): Promise<{ transactionId: string; status: string }> {
    try {
      const response = await axios.post(
        `${BANK_API_ENDPOINT}/withdrawal`,
        {
          bankName: bankAccount.bank_name,
          branchName: bankAccount.branch_name,
          accountType: bankAccount.account_type,
          accountNumber: bankAccount.account_number,
          amount: amount
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('銀行APIでエラーが発生しました');
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, amount, withdrawalDate } = req.body as WithdrawalRequest;

  if (!companyId || !amount || !withdrawalDate) {
    return res.status(400).json({ error: '必須パラメータが不足しています' });
  }

  try {
    // 企業情報の取得
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, bank_account')
      .eq('id', companyId);

    if (fetchError) {
      throw new Error('データベースエラーが発生しました');
    }

    if (!companies || companies.length === 0) {
      return res.status(404).json({ error: '対象企業が見つかりません' });
    }

    const company = companies[0];
    const bankApiClient = new BankApiClient();

    // 引き落とし処理の実行
    const withdrawalResult = await bankApiClient.requestWithdrawal(
      company.bank_account,
      amount
    );

    // 処理結果の記録
    const { error: insertError } = await supabase
      .from('billing_records')
      .insert({
        company_id: companyId,
        amount: amount,
        transaction_id: withdrawalResult.transactionId,
        status: 'completed',
        withdrawal_date: withdrawalDate
      });

    if (insertError) {
      throw new Error('処理結果の記録に失敗しました');
    }

    return res.status(200).json({
      success: true,
      transactionId: withdrawalResult.transactionId
    });

  } catch (error) {
    console.error('自動引き落とし処理でエラーが発生:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: '引き落とし処理に失敗しました' });
  }
}