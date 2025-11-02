let map;
let userMarker;
let currentUser;
let markers = [];
let places = []; // Will be generated dynamically

async function initMap() {
  // Fetch API key from server
  const configResponse = await fetch('/api/config');
  const config = await configResponse.json();
  const apiKey = config.googleMapsApiKey;

  // Load Google Maps script dynamically
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMapCallback`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function initMapCallback() {
  const storedUser = JSON.parse(localStorage.getItem("userProfile"));
  if (!storedUser) {
    alert("Please log in first!");
    window.location.href = "/login.html";
    return;
  }
  currentUser = storedUser;

  // Initialize map
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 17.4375, lng: 78.4917 },
  });

  // Set default user marker initially
  const defaultLoc = { lat: 17.4375, lng: 78.4917 };
  userMarker = new google.maps.Marker({
    position: defaultLoc,
    map,
    title: "Default location",
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    }
  });

  // Fetch places from database first
  fetchPlaces().then(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          map.setCenter(loc);
          userMarker.setPosition(loc);
          userMarker.setTitle("You are here");
          // Generate places near user location
          generatePlaces(loc.lat, loc.lng);
        },
        (error) => {
          console.warn("Geolocation failed:", error);
          alert("Couldn't get your location. Using default location.");
          // Generate places near default location
          generatePlaces(defaultLoc.lat, defaultLoc.lng);
        }
      );
    } else {
      alert("Geolocation not supported. Using default location.");
      // Generate places near default location
      generatePlaces(defaultLoc.lat, defaultLoc.lng);
    }
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      showPlaces(type);
    });
  });

  // Search functionality
  document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("customSearch").value.toLowerCase();
    searchPlaces(query);
  });

  document.getElementById("customSearch").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.toLowerCase();
      searchPlaces(query);
    }
  });
}

// Function to fetch places from database
async function fetchPlaces() {
  try {
    const response = await fetch('/api/places');
    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }
    places = await response.json();
    console.log('Places loaded from database:', places.length);
  } catch (error) {
    console.error('Error fetching places:', error);
    // Fallback to empty array if database fails
    places = [];
  }
}

// Function to generate places within ~5km of user location
function generatePlaces(userLat, userLng) {
  // Adjust each place's location to be randomly distributed around the user's live location
  places = places.map(place => {
    // Generate random offsets within ~5km to keep places close and hopefully on land
    const latOffset = (Math.random() - 0.5) * 0.09; // ~5km in lat
    const lngOffset = (Math.random() - 0.5) * 0.09; // ~5km in lng
    return {
      ...place,
      lat: userLat + latOffset,
      lng: userLng + lngOffset
    };
  });
}

// Function to show places based on type + user roles + distance
function showPlaces(type) {
  clearMarkers();

  const userRoles = currentUser.roles || [];
  console.log("User roles:", userRoles);
  console.log("Filtering for type:", type);

  if (!userMarker) {
    alert("User location not ready yet!");
    return;
  }

  const userLoc = userMarker.getPosition();
  console.log("User location:", userLoc.lat(), userLoc.lng());

  const filtered = places.filter(p => {
    const distance = haversineDistance(userLoc.lat(), userLoc.lng(), p.lat, p.lng);
    let matchesRole = false;

    // Custom logic based on user roles
    if (userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("employee")) {
      // Only handicapped: show only handicapped places
      matchesRole = p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("student") && !userRoles.includes("handicapped") && !userRoles.includes("employee")) {
      // Woman and student: show woman or student places, but not handicapped
      matchesRole = (p.tags.includes("woman") || p.tags.includes("student")) && !p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("employee") && !userRoles.includes("handicapped") && !userRoles.includes("student")) {
      // Woman and employee: show woman or employee places, but not handicapped
      matchesRole = (p.tags.includes("woman") || p.tags.includes("employee")) && !p.tags.includes("handicapped");
    } else if (userRoles.includes("student") && userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("employee")) {
      // Student and handicapped: show student or handicapped places
      matchesRole = p.tags.includes("student") || p.tags.includes("handicapped");
    } else if (userRoles.includes("employee") && userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("student")) {
      // Employee and handicapped: show employee or handicapped places
      matchesRole = p.tags.includes("employee") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("employee") && userRoles.includes("handicapped") && !userRoles.includes("student")) {
      // Woman, employee, handicapped: show woman, employee, or handicapped places
      matchesRole = p.tags.includes("woman") || p.tags.includes("employee") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("student") && userRoles.includes("handicapped") && !userRoles.includes("employee")) {
      // Woman, student, handicapped: show woman, student, or handicapped places
      matchesRole = p.tags.includes("woman") || p.tags.includes("student") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("employee") && !userRoles.includes("handicapped")) {
      // Only woman: show woman places, not handicapped
      matchesRole = p.tags.includes("woman") && !p.tags.includes("handicapped");
    } else if (userRoles.includes("student") && !userRoles.includes("woman") && !userRoles.includes("employee") && !userRoles.includes("handicapped")) {
      // Only student: show student places, not handicapped
      matchesRole = p.tags.includes("student") && !p.tags.includes("handicapped");
    } else if (userRoles.includes("employee") && !userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("handicapped")) {
      // Only employee: show employee places, not handicapped
      matchesRole = p.tags.includes("employee") && !p.tags.includes("handicapped");
    } else {
      // Fallback: any matching tag
      matchesRole = p.tags.some(tag => userRoles.includes(tag));
    }

    console.log(`Place: ${p.name}, Type: ${p.type}, Tags: ${p.tags}, Distance: ${distance}, Matches Role: ${matchesRole}, Type Match: ${p.type === type}`);
    return p.type === type && matchesRole && distance <= 10; // within 10 km
  });

  console.log("Filtered places:", filtered);

  if (filtered.length === 0) {
    alert("No matching places found near you!");
  }

  filtered.forEach(place => {
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      title: place.name,
    });

    const fullStars = Math.floor(place.rating);
    const halfStar = place.rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    const starsHtml = '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
    const reviewsHtml = place.reviews.map(review => `<li><strong>${review.user}:</strong> ${review.comment}</li>`).join('');
    const distance = haversineDistance(userLoc.lat(), userLoc.lng(), place.lat, place.lng).toFixed(2);
    const info = new google.maps.InfoWindow({
      content: `<h3>${place.name}</h3><p>${place.description}</p><p><strong>Rating:</strong> ${starsHtml} (${place.rating}/5)</p><p><strong>Distance:</strong> ${distance} km</p><p><strong>Reviews:</strong></p><ul>${reviewsHtml}</ul>`,
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);
  });
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

// Function to search places by name or description
function searchPlaces(query) {
  clearMarkers();

  if (!query.trim()) {
    alert("Please enter a search term!");
    return;
  }

  const userRoles = currentUser.roles || [];
  console.log("User roles:", userRoles);
  console.log("Searching for:", query);

  if (!userMarker) {
    alert("User location not ready yet!");
    return;
  }

  const userLoc = userMarker.getPosition();
  console.log("User location:", userLoc.lat(), userLoc.lng());

  const filtered = places.filter(p => {
    const distance = haversineDistance(userLoc.lat(), userLoc.lng(), p.lat, p.lng);
    let matchesRole = false;

    // Custom logic based on user roles (same as showPlaces)
    if (userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("employee")) {
      matchesRole = p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("student") && !userRoles.includes("handicapped") && !userRoles.includes("employee")) {
      matchesRole = (p.tags.includes("woman") || p.tags.includes("student")) && !p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("employee") && !userRoles.includes("handicapped") && !userRoles.includes("student")) {
      matchesRole = (p.tags.includes("woman") || p.tags.includes("employee")) && !p.tags.includes("handicapped");
    } else if (userRoles.includes("student") && userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("employee")) {
      matchesRole = p.tags.includes("student") || p.tags.includes("handicapped");
    } else if (userRoles.includes("employee") && userRoles.includes("handicapped") && !userRoles.includes("woman") && !userRoles.includes("student")) {
      matchesRole = p.tags.includes("employee") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("employee") && userRoles.includes("handicapped") && !userRoles.includes("student")) {
      matchesRole = p.tags.includes("woman") || p.tags.includes("employee") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && userRoles.includes("student") && userRoles.includes("handicapped") && !userRoles.includes("employee")) {
      matchesRole = p.tags.includes("woman") || p.tags.includes("student") || p.tags.includes("handicapped");
    } else if (userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("employee") && !userRoles.includes("handicapped")) {
      matchesRole = p.tags.includes("woman") && !p.tags.includes("handicapped");
    } else if (userRoles.includes("student") && !userRoles.includes("woman") && !userRoles.includes("employee") && !userRoles.includes("handicapped")) {
      matchesRole = p.tags.includes("student") && !p.tags.includes("handicapped");
    } else if (userRoles.includes("employee") && !userRoles.includes("woman") && !userRoles.includes("student") && !userRoles.includes("handicapped")) {
      matchesRole = p.tags.includes("employee") && !p.tags.includes("handicapped");
    } else {
      matchesRole = p.tags.some(tag => userRoles.includes(tag));
    }

    // Check if name or description contains the query
    const matchesSearch = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);

    console.log(`Place: ${p.name}, Matches Search: ${matchesSearch}, Matches Role: ${matchesRole}, Distance: ${distance}`);
    return matchesSearch && matchesRole && distance <= 10; // within 10 km
  });

  console.log("Search results:", filtered);

  if (filtered.length === 0) {
    alert("No matching places found for your search!");
  }

  filtered.forEach(place => {
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      title: place.name,
    });

    const fullStars = Math.floor(place.rating);
    const halfStar = place.rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    const starsHtml = '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
    const reviewsHtml = place.reviews.map(review => `<li><strong>${review.user}:</strong> ${review.comment}</li>`).join('');
    const distance = haversineDistance(userLoc.lat(), userLoc.lng(), place.lat, place.lng).toFixed(2);
    const info = new google.maps.InfoWindow({
      content: `<h3>${place.name}</h3><p>${place.description}</p><p><strong>Rating:</strong> ${starsHtml} (${place.rating}/5)</p><p><strong>Distance:</strong> ${distance} km</p><p><strong>Reviews:</strong></p><ul>${reviewsHtml}</ul>`,
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);
  });
}

// Distance calculation in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Call initMap when the script loads
initMap();
