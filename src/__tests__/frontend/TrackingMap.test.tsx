```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import TrackingMap from '@/pages/TrackingMap';
import userEvent from '@testing-library/user-event';

const mockTrackingInfo = {
  id: 'track-001',
  shipmentId: 'ship-001',
  currentLocation: {
    lat: 35.6812,
    lng: 139.7671,
    address: '東京都千代田区'
  },
  statusHistory: [
    {
      status: '集荷完了',
      timestamp: '2024-01-01T09:00:00Z',
      location: '東京都渋谷区'
    },
    {
      status: '配送中',
      timestamp: '2024-01-01T10:00:00Z', 
      location: '東京都新宿区'
    }
  ],
  estimatedDelivery: '2024-01-01T15:00:00Z',
  carrier: '〇〇運輸'
};

// Google Maps APIのモック
const mockMap = {
  setCenter: jest.fn(),
  setZoom: jest.fn(),
};

const mockMarker = {
  setPosition: jest.fn(),
  setMap: jest.fn(),
};

const mockInfoWindow = {
  setContent: jest.fn(),
  open: jest.fn(),
  close: jest.fn(),
};

global.google = {
  maps: {
    Map: jest.fn(() => mockMap),
    Marker: jest.fn(() => mockMarker),
    InfoWindow: jest.fn(() => mockInfoWindow),
    LatLng: jest.fn((lat, lng) => ({ lat, lng })),
  },
} as any;

describe('TrackingMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('配送追跡情報が正しく表示される', () => {
    render(<TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />);
    
    expect(screen.getByText('現在地: 東京都千代田区')).toBeInTheDocument();
    expect(screen.getByText('〇〇運輸')).toBeInTheDocument();
    expect(screen.getByText('配送状況: 配送中')).toBeInTheDocument();
  });

  it('ステータス履歴が表示される', () => {
    render(<TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />);
    
    mockTrackingInfo.statusHistory.forEach(history => {
      expect(screen.getByText(history.status)).toBeInTheDocument();
      expect(screen.getByText(history.location)).toBeInTheDocument();
    });
  });

  it('Google Mapが正しく初期化される', () => {
    render(<TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />);
    
    expect(global.google.maps.Map).toHaveBeenCalled();
    expect(global.google.maps.Marker).toHaveBeenCalled();
    expect(mockMap.setCenter).toHaveBeenCalledWith({
      lat: mockTrackingInfo.currentLocation.lat,
      lng: mockTrackingInfo.currentLocation.lng
    });
  });

  it('マーカークリックでInfoWindowが開く', async () => {
    render(<TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />);
    
    const markerClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    
    fireEvent(mockMarker, markerClickEvent);
    
    await waitFor(() => {
      expect(mockInfoWindow.setContent).toHaveBeenCalled();
      expect(mockInfoWindow.open).toHaveBeenCalled();
    });
  });

  it('更新ボタンクリックで位置情報が更新される', async () => {
    render(<TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />);
    
    const updateButton = screen.getByText('位置情報を更新');
    await userEvent.click(updateButton);
    
    expect(mockMarker.setPosition).toHaveBeenCalled();
    expect(mockMap.setCenter).toHaveBeenCalled();
  });

  it('配送状況が変更された時にマップが更新される', () => {
    const { rerender } = render(
      <TrackingMap trackingInfo={mockTrackingInfo} deliveryStatus="配送中" />
    );

    const updatedTrackingInfo = {
      ...mockTrackingInfo,
      currentLocation: {
        lat: 35.6895,
        lng: 139.6917,
        address: '東京都新宿区'
      }
    };

    rerender(
      <TrackingMap trackingInfo={updatedTrackingInfo} deliveryStatus="配達完了" />
    );

    expect(mockMarker.setPosition).toHaveBeenCalledWith({
      lat: updatedTrackingInfo.currentLocation.lat,
      lng: updatedTrackingInfo.currentLocation.lng
    });
    expect(screen.getByText('配送状況: 配達完了')).toBeInTheDocument();
  });

  it('エラー時にエラーメッセージが表示される', () => {
    const errorTrackingInfo = {
      ...mockTrackingInfo,
      error: 'データの取得に失敗しました'
    };

    render(<TrackingMap trackingInfo={errorTrackingInfo} deliveryStatus="エラー" />);
    
    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
  });
});
```