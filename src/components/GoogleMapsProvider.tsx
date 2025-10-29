import { APIProvider } from "@vis.gl/react-google-maps";
import { ReactNode } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export const GoogleMapsProvider = ({ children }: { children: ReactNode }) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found. Map features will be disabled.");
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {children}
    </APIProvider>
  );
};