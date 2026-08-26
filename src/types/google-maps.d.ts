// Minimal type declarations for the new Google Maps Places API (2025+)
declare namespace google.maps.places {
  class AutocompleteSessionToken {}

  class AutocompleteSuggestion {
    static fetchAutocompleteSuggestions(request: {
      input: string;
      includedPrimaryTypes?: string[];
      includedRegionCodes?: string[];
      sessionToken?: AutocompleteSessionToken;
    }): Promise<{ suggestions: Suggestion[] }>;
  }

  interface Suggestion {
    placePrediction: PlacePrediction | null;
  }

  interface PlacePrediction {
    placeId: string;
    text: { toString(): string };
    mainText?: { toString(): string };
    secondaryText?: { toString(): string };
  }

  class Place {
    constructor(options: { id: string });
    addressComponents?: AddressComponent[];
    fetchFields(request: { fields: string[] }): Promise<void>;
  }

  interface AddressComponent {
    longText: string;
    shortText: string;
    types: string[];
  }
}

interface Window {
  google?: {
    maps?: {
      places?: {
        AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
        AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
        Place: typeof google.maps.places.Place;
      };
    };
  };
}
