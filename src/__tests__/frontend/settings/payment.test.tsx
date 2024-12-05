```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentSettings from '@/pages/settings/payment';
import '@testing-library/jest-dom';

// モックの定義
const mockPaymentSettings = {
  billing_rate: 100,
  payment_methods: ['credit_card', 'bank_transfer'],
  auto_withdrawal: true,
  withdrawal_date: 25,
  bank_account: {
    bank_name: 'テスト銀行',
    branch_name: 'テスト支店',
    account_type: '普通',
    account_number: '1234567'
  }
};

jest.mock('axios');

describe('PaymentSettings', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: mockPaymentSettings
    });
  });

  test('初期表示時に設定データが読み込まれること', async () => {
    render(<PaymentSettings />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト銀行')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });
  });

  test('料金設定の変更が正しく保存されること', async () => {
    render(<PaymentSettings />);
    
    const rateInput = await screen.findByLabelText('基本料金');
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '200');

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    expect(axios.post).toHaveBeenCalledWith('/api/settings/payment', expect.objectContaining({
      billing_rate: 200
    }));
  });

  test('決済方法の選択が正しく機能すること', async () => {
    render(<PaymentSettings />);

    const creditCardCheckbox = await screen.findByLabelText('クレジットカード');
    const bankTransferCheckbox = screen.getByLabelText('銀行振込');

    await userEvent.click(creditCardCheckbox);
    
    expect(creditCardCheckbox).not.toBeChecked();
    expect(bankTransferCheckbox).toBeChecked();
  });

  test('自動引き落とし設定の切り替えが正しく機能すること', async () => {
    render(<PaymentSettings />);

    const autoWithdrawalToggle = await screen.findByLabelText('自動引き落とし');
    await userEvent.click(autoWithdrawalToggle);

    const withdrawalDateInput = screen.getByLabelText('引き落とし日');
    expect(withdrawalDateInput).toBeDisabled();
  });

  test('銀行口座情報の入力が正しく機能すること', async () => {
    render(<PaymentSettings />);

    const bankNameInput = await screen.findByLabelText('銀行名');
    const branchNameInput = screen.getByLabelText('支店名');
    const accountNumberInput = screen.getByLabelText('口座番号');

    await userEvent.clear(bankNameInput);
    await userEvent.type(bankNameInput, '新規銀行');
    await userEvent.clear(branchNameInput);
    await userEvent.type(branchNameInput, '新規支店');
    await userEvent.clear(accountNumberInput);
    await userEvent.type(accountNumberInput, '7654321');

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    expect(axios.post).toHaveBeenCalledWith('/api/settings/payment', expect.objectContaining({
      bank_account: {
        bank_name: '新規銀行',
        branch_name: '新規支店',
        account_number: '7654321'
      }
    }));
  });

  test('入力値バリデーションが正しく機能すること', async () => {
    render(<PaymentSettings />);

    const rateInput = await screen.findByLabelText('基本料金');
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '-100');

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    expect(screen.getByText('基本料金は0以上の数値を入力してください')).toBeInTheDocument();
  });

  test('保存失敗時にエラーメッセージが表示されること', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('保存に失敗しました'));
    
    render(<PaymentSettings />);

    const saveButton = await screen.findByText('設定を保存');
    await userEvent.click(saveButton);

    expect(screen.getByText('設定の保存に失敗しました')).toBeInTheDocument();
  });

  test('設定変更後に確認メッセージが表示されること', async () => {
    render(<PaymentSettings />);

    const rateInput = await screen.findByLabelText('基本料金');
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '300');

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument();
    });
  });
});
```