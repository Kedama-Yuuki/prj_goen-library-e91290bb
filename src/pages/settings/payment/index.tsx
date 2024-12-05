import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { FiSave, FiCreditCard, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { supabase } from '@/supabase';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface PaymentSettings {
  billing_rate: number;
  payment_methods: string[];
  auto_withdrawal: boolean;
  withdrawal_date: number;
  bank_account: {
    bank_name: string;
    branch_name: string;
    account_type: string;
    account_number: string;
  };
}

const PaymentSettings: NextPage = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    billing_rate: 0,
    payment_methods: [],
    auto_withdrawal: false,
    withdrawal_date: 25,
    bank_account: {
      bank_name: '',
      branch_name: '',
      account_type: '普通',
      account_number: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data.payment_settings || settings);
      }
    } catch (err) {
      setError('設定の読み込みに失敗しました');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (settings.billing_rate < 0) {
        throw new Error('基本料金は0以上の数値を入力してください');
      }

      const { error } = await supabase
        .from('companies')
        .update({ payment_settings: settings })
        .eq('id', 1);

      if (error) throw error;

      toast.success('設定を保存しました');
    } catch (err: any) {
      toast.error(err.message || '設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    const newMethods = settings.payment_methods.includes(method)
      ? settings.payment_methods.filter(m => m !== method)
      : [...settings.payment_methods, method];
    setSettings({ ...settings, payment_methods: newMethods });
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">決済設定</h1>

          <div className="space-y-8">
            {/* 料金設定 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">料金設定</h2>
              <div className="flex items-center">
                <label htmlFor="billing_rate" className="mr-4">基本料金</label>
                <input
                  type="number"
                  id="billing_rate"
                  value={settings.billing_rate}
                  onChange={(e) => setSettings({ ...settings, billing_rate: Number(e.target.value) })}
                  className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2">円</span>
              </div>
            </div>

            {/* 決済方法設定 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">決済方法</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes('credit_card')}
                    onChange={() => handlePaymentMethodChange('credit_card')}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">クレジットカード</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes('bank_transfer')}
                    onChange={() => handlePaymentMethodChange('bank_transfer')}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">銀行振込</span>
                </label>
              </div>
            </div>

            {/* 自動引き落とし設定 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">自動引き落とし設定</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.auto_withdrawal}
                    onChange={(e) => setSettings({ ...settings, auto_withdrawal: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">自動引き落とし</span>
                </label>

                <div className="flex items-center">
                  <label htmlFor="withdrawal_date" className="mr-4">引き落とし日</label>
                  <input
                    type="number"
                    id="withdrawal_date"
                    value={settings.withdrawal_date}
                    onChange={(e) => setSettings({ ...settings, withdrawal_date: Number(e.target.value) })}
                    disabled={!settings.auto_withdrawal}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="ml-2">日</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">銀行名</label>
                    <input
                      type="text"
                      id="bank_name"
                      value={settings.bank_account.bank_name}
                      onChange={(e) => setSettings({
                        ...settings,
                        bank_account: { ...settings.bank_account, bank_name: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700">支店名</label>
                    <input
                      type="text"
                      id="branch_name"
                      value={settings.bank_account.branch_name}
                      onChange={(e) => setSettings({
                        ...settings,
                        bank_account: { ...settings.bank_account, branch_name: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">口座番号</label>
                    <input
                      type="text"
                      id="account_number"
                      value={settings.bank_account.account_number}
                      onChange={(e) => setSettings({
                        ...settings,
                        bank_account: { ...settings.bank_account, account_number: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;