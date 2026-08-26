import { useEffect, useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
}

// Module-level singletons
let scriptLoadingPromise: Promise<boolean> | null = null;
// A session token improves autocomplete billing/quality; regenerated per session
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

function loadGoogleMaps(): Promise<boolean> {
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<boolean>((resolve) => {
    if (!API_KEY) {
      resolve(false);
      return;
    }
    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    // Load with the new Places library
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export function useGooglePlaces() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadGoogleMaps().then((loaded) => {
      if (!mounted) return;
      setIsAvailable(loaded && !!window.google?.maps?.places?.AutocompleteSuggestion);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getSuggestions = useCallback(async (input: string): Promise<PlacePrediction[]> => {
    if (!window.google?.maps?.places?.AutocompleteSuggestion || !input.trim()) return [];

    try {
      if (!sessionToken) {
        sessionToken = new window.google.maps.places.AutocompleteSessionToken();
      }

      const { suggestions } =
        await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
          includedRegionCodes: ['us'],
          sessionToken,
        });

      return suggestions
        .filter((s) => s.placePrediction)
        .map((s) => {
          const p = s.placePrediction!;
          return {
            placeId: p.placeId,
            description: p.text.toString(),
            mainText: p.mainText?.toString() ?? p.text.toString(),
            secondaryText: p.secondaryText?.toString() ?? '',
          };
        });
    } catch (err) {
      console.warn('[GooglePlaces] fetchAutocompleteSuggestions failed:', err);
      return [];
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<AddressComponents | null> => {
    if (!window.google?.maps?.places?.Place) return null;

    try {
      const place = new window.google.maps.places.Place({ id: placeId });
      await place.fetchFields({ fields: ['addressComponents'] });

      // Reset session token after a place is selected (per Google billing best practice)
      sessionToken = null;

      const components = place.addressComponents ?? [];
      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.longText ?? '';
      const getShort = (type: string) =>
        components.find((c) => c.types.includes(type))?.shortText ?? '';

      const streetNumber = get('street_number');
      const route = get('route');

      return {
        street: `${streetNumber} ${route}`.trim(),
        city: get('locality') || get('sublocality_level_1') || get('postal_town'),
        state: getShort('administrative_area_level_1'),
        zip: get('postal_code'),
      };
    } catch (err) {
      console.warn('[GooglePlaces] fetchFields failed:', err);
      return null;
    }
  }, []);

  return { isAvailable, getSuggestions, getPlaceDetails };
}
