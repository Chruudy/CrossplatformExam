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
    script.setAttribute('loading', 'lazy');
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

export const initializeMap = (mapElement: HTMLElement, lat: number, lng: number): void => {
  if (typeof window.google === 'undefined') {
    console.error('Google Maps API is not loaded.');
    return;
  }

  const mapOptions = {
    center: { lat, lng },
    zoom: 15,
  };
  const map = new window.google.maps.Map(mapElement, mapOptions);

  new window.google.maps.Marker({
    map,
    position: { lat, lng },
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

window.initMap = () => {
  console.log('Google Maps API initialized.');
};