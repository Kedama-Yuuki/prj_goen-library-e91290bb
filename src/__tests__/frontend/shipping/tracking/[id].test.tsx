```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ShippingTracking from '@/pages/shipping/tracking/[id]';
import userEvent from '@testing-library/user-event';

// モックデータ
const mockTrackingData = {
  id: "12345",
  trackingNumber: "TN123456789",
  status: "配送中",
  currentLocation: {
    lat: 35.6762,
    lng: 139.6503
  },
  estimatedArrival: "2024-01-20T15:00:00",
  history: [
    {
      timestamp: "2024-01-19T10:00:00",
      location: "東京配送センター",
      status: "発送完了"
    },
    {
      timestamp: "2024-01-19T14:00:00", 
      location: "横浜中継所",
      status: "配送中"
    }
  ]
};

// コンポーネントのモック
jest.mock('@/components/Header', () => {
  return function DummyHeader() {
    return <div data-testid="header">ヘッダー</div>
  }
});

jest.mock('@/components/Sidebar', () => {
  return function DummySidebar() {
    return <div data-testid="sidebar">サイドバー</div>
  }
});

jest.mock('@/components/TrackingMap', () => {
  return function DummyTrackingMap({ trackingInfo, deliveryStatus }) {
    return (
      <div data-testid="tracking-map">
        配送マップ
        <div>ステータス: {deliveryStatus}</div>
      </div>
    )
  }
});

// API呼び出しのモック
jest.mock('axios');

describe('配送状況確認画面', () => {
  beforeEach(() => {
    global.axios.get.mockResolvedValue({ data: mockTrackingData });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('初期表示時に配送情報を取得して表示すること', async () => {
    render(<ShippingTracking id="12345" />);

    // ローディング表示の確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // データ取得後の表示確認
    await waitFor(() => {
      expect(screen.getByText('配送状況確認')).toBeInTheDocument();
      expect(screen.getByText('追跡番号：TN123456789')).toBeInTheDocument();
      expect(screen.getByText('ステータス: 配送中')).toBeInTheDocument();
    });
  });

  it('配送履歴が正しく表示されること', async () => {
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      expect(screen.getByText('東京配送センター')).toBeInTheDocument();
      expect(screen.getByText('横浜中継所')).toBeInTheDocument();
    });
  });

  it('更新ボタンクリックで配送情報が再取得されること', async () => {
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      expect(screen.getByText('配送状況確認')).toBeInTheDocument();
    });

    const updateButton = screen.getByText('更新');
    await userEvent.click(updateButton);

    expect(global.axios.get).toHaveBeenCalledTimes(2);
  });

  it('エラー発生時にエラーメッセージが表示されること', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      expect(screen.getByText('配送情報の取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('共通コンポーネントが正しく表示されること', async () => {
    render(<ShippingTracking id="12345" />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('tracking-map')).toBeInTheDocument();
  });

  it('地図コンポーネントに正しいpropsが渡されること', async () => {
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      const mapComponent = screen.getByTestId('tracking-map');
      expect(mapComponent).toHaveTextContent('ステータス: 配送中');
    });
  });

  it('到着予定時刻が正しくフォーマットされて表示されること', async () => {
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      expect(screen.getByText('到着予定: 2024年1月20日 15:00')).toBeInTheDocument();
    });
  });

  it('履歴の時刻が正しくフォーマットされて表示されること', async () => {
    render(<ShippingTracking id="12345" />);

    await waitFor(() => {
      expect(screen.getByText('2024年1月19日 10:00')).toBeInTheDocument();
      expect(screen.getByText('2024年1月19日 14:00')).toBeInTheDocument();
    });
  });
});
```