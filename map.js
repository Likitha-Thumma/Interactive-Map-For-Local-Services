let map, service;
let placesData = [];
let markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 }, // Default to India center
    zoom: 13,
  });

  // Get current user location and search nearby places
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(userLocation);
        new google.maps.Marker({ map, position: userLocation, title: "You are here" });

        service = new google.maps.places.PlacesService(map);
        fetchPlaces(userLocation);
      },
      () => {
        // Fallback if location is blocked
        service = new google.maps.places.PlacesService(map);
        fetchPlaces(map.getCenter());
      }
    );
  } else {
    service = new google.maps.places.PlacesService(map);
    fetchPlaces(map.getCenter());
  }

  initializeSearchBox();
  initializeFilterListeners();
}

// Fetch places of each category and accumulate them in placesData
function fetchPlaces(location) {
  placesData = [];
  const categories = [
    "restaurant",
    "cafe",
    "store",
    "hospital",
    "library",
    "grocery_or_supermarket",
  ];

  let promises = categories.map(
    (category) =>
      new Promise((resolve) => {
        let request = {
          location,
          radius: 1500,
          type: category,
        };
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            placesData = placesData.concat(results);
          }
          resolve();
        });
      })
  );

  Promise.all(promises).then(() => renderMarkers());
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

// Render markers based on current filters and user profile
function renderMarkers() {
  clearMarkers();

  // Get selected categories from UI
  const selectedCategories = Array.from(document.querySelectorAll(".filter-category:checked")).map(
    (el) => el.value
  );

  // Get user profile roles from localStorage (example)
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || { roles: [] };
  const userRoles = new Set(userProfile.roles);

  // Filter places by category and user role (basic example)
  const filteredPlaces = placesData.filter((place) => {
    // Category filter
    if (!place.types.some((type) => selectedCategories.includes(type))) {
      return false;
    }

    // Example heuristic for user role filtering:
    if (userRoles.has("student")) {
      // Only place types student might like
      if (!place.types.includes("cafe") && !place.types.includes("library") && !place.name.toLowerCase().includes("wifi")) {
        return false;
      }
    }

    if (userRoles.has("woman")) {
      // Example: prioritize hospitals and police_station (if you searched them) or well-lit places
      // Since police_station might not be fetched, just an example here
      // Add your own heuristics
    }

    if (userRoles.has("handicapped")) {
      if (!place.wheelchairAccessibleEntrance) {
        return false;
      }
    }

    return true;
  });

  // Add markers for filtered places
  filteredPlaces.forEach((place) => {
    const marker = new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${place.name}</strong><br>${place.vicinity ?? ""}`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });
}

// Initialize search box for autocomplete
function initializeSearchBox() {
  const input = document.getElementById("customSearch");
  const searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    if (!places.length) return;
    const place = places[0];
    if (!place.geometry) return;

    map.setCenter(place.geometry.location);
    map.setZoom(15);

    clearMarkers();

    const marker = new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name,
    });

    markers.push(marker);
  });
}

// Event listeners for categories filter checkboxes
function initializeFilterListeners() {
  document.querySelectorAll(".filter-category").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      renderMarkers();
    });
  });
}
