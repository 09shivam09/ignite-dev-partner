import { Map, Marker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface VendorMapProps {
  vendors: Array<{
    id: string;
    business_name: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

export const VendorMap = ({ vendors, center, zoom = 12 }: VendorMapProps) => {
  const defaultCenter = center || { lat: 28.6139, lng: 77.2090 }; // Delhi as default

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Map view unavailable</p>
          <p className="text-sm text-muted-foreground mt-2">
            Configure Google Maps API key to enable map features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {vendors.map((vendor) => {
          if (!vendor.location) return null;
          
          return (
            <Marker
              key={vendor.id}
              position={{
                lat: vendor.location.latitude,
                lng: vendor.location.longitude,
              }}
              title={vendor.business_name}
            />
          );
        })}
      </Map>
    </div>
  );
};