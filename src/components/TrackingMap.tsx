import { useEffect, useRef, useState } from 'react';
import { FaTruck, FaMapMarkerAlt, FaHistory, FaSync } from 'react-icons/fa';

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type StatusHistory = {
  status: string;
  timestamp: string;
  location: string;
};

type TrackingType = {
  id: string;
  shipmentId: string;
  currentLocation: Location;
  statusHistory: StatusHistory[];
  estimatedDelivery: string;
  carrier: string;
  error?: string;
};

type Props = {
  trackingInfo: TrackingType;
  deliveryStatus: string;
};

const TrackingMap = ({ trackingInfo, deliveryStatus }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center: {
          lat: trackingInfo.currentLocation.lat,
          lng: trackingInfo.currentLocation.lng
        },
        zoom: 15
      });

      const newMarker = new google.maps.Marker({
        position: {
          lat: trackingInfo.currentLocation.lat,
          lng: trackingInfo.currentLocation.lng
        },
        map: newMap,
        title: 'Current Location'
      });

      const newInfoWindow = new google.maps.InfoWindow();

      newMarker.addListener('click', () => {
        newInfoWindow.setContent(`
          <div class="p-2">
            <h3 class="font-bold">${trackingInfo.carrier}</h3>
            <p>${trackingInfo.currentLocation.address}</p>
            <p>ステータス: ${deliveryStatus}</p>
          </div>
        `);
        newInfoWindow.open(newMap, newMarker);
      });

      setMap(newMap);
      setMarker(newMarker);
      setInfoWindow(newInfoWindow);
    }
  }, []);

  useEffect(() => {
    if (marker && map) {
      const position = {
        lat: trackingInfo.currentLocation.lat,
        lng: trackingInfo.currentLocation.lng
      };
      marker.setPosition(position);
      map.setCenter(position);
    }
  }, [trackingInfo.currentLocation]);

  const handleUpdateLocation = () => {
    if (marker && map) {
      const position = {
        lat: trackingInfo.currentLocation.lat,
        lng: trackingInfo.currentLocation.lng
      };
      marker.setPosition(position);
      map.setCenter(position);
    }
  };

  if (trackingInfo.error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {trackingInfo.error}
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaTruck className="text-blue-600" />
                {trackingInfo.carrier}
              </h2>
              <p className="text-gray-600 flex items-center gap-2 mt-2">
                <FaMapMarkerAlt />
                現在地: {trackingInfo.currentLocation.address}
              </p>
              <p className="text-gray-600">配送状況: {deliveryStatus}</p>
            </div>
            <button
              onClick={handleUpdateLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaSync /> 位置情報を更新
            </button>
          </div>
          <div ref={mapRef} className="w-full h-[400px] rounded-lg mb-4" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <FaHistory className="text-blue-600" />
            配送履歴
          </h3>
          <div className="space-y-4">
            {trackingInfo.statusHistory.map((history, index) => (
              <div key={index} className="flex items-start gap-4 border-l-2 border-blue-600 pl-4">
                <div>
                  <p className="font-semibold">{history.status}</p>
                  <p className="text-gray-600">{history.location}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(history.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;