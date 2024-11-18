// src/services/googleService.ts

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window.google !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyABoN3EsB_jyScms9laVjpwoUeFre5jmhU&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.setAttribute('loading', 'async');
    script.onload = () => {
      resolve();
    };
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });
};

export const initializeMap = (mapElement: HTMLElement, address: string): void => {
  if (typeof window.google === 'undefined') {
    console.error('Google Maps API is not loaded.');
    return;
  }

  const mapOptions = {
    center: { lat: 0, lng: 0 },
    zoom: 15,
  };
  const map = new window.google.maps.Map(mapElement, mapOptions);

  const geocoder = new window.google.maps.Geocoder();
  geocoder.geocode({ address }, (results, status) => {
    if (status === 'OK' && results && results[0]) {
      map.setCenter(results[0].geometry.location);
      new window.google.maps.Marker({
        map,
        position: results[0].geometry.location,
      });
    } else {
      console.error('Geocode was not successful for the following reason:', status);
    }
  });
};

export const geocodeAddress = (address: string): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google === 'undefined') {
      reject('Google Maps API is not loaded.');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        reject(`Geocode was not successful for the following reason: ${status}`);
      }
    });
  });
};

declare global {
  interface Window {
    initMap: () => void;
  }
}

window.initMap = () => {};