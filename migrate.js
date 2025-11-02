const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('./places.db');


db.run(`CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT NOT NULL,
  description TEXT NOT NULL,
  rating REAL NOT NULL,
  reviews TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL
)`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table created successfully.');
  }
});

const basePlaces = [
  // Cafes
  { name: "Cafe Bloom", type: "cafe", tags: ["woman", "student"], description: "A cozy women-friendly café near college with Wi-Fi.", rating: 4.5, reviews: [{ user: "Priya", comment: "Great atmosphere and friendly staff!" }, { user: "Ravi", comment: "Perfect for studying." }] },
  { name: "TechPark Cafe", type: "cafe", tags: ["employee"], description: "Popular among office employees; serves breakfast and coffee.", rating: 4.0, reviews: [{ user: "Arjun", comment: "Quick service and good coffee." }] },
  { name: "Women's Brew", type: "cafe", tags: ["woman"], description: "Exclusive café for women with comfortable seating.", rating: 4.8, reviews: [{ user: "Anjali", comment: "Safe and welcoming space." }, { user: "Kavita", comment: "Love the ambiance." }] },
  { name: "Student Corner Cafe", type: "cafe", tags: ["student"], description: "Quiet study-friendly café for students.", rating: 4.2, reviews: [{ user: "Vikram", comment: "Ideal for late-night studying." }] },
  { name: "Office Grind", type: "cafe", tags: ["employee"], description: "Quick coffee spot for busy professionals.", rating: 3.9, reviews: [{ user: "Sneha", comment: "Fast and convenient." }] },
  // Restaurants
  { name: "Student Dine", type: "restaurant", tags: ["student"], description: "Affordable meals and study-friendly space for students.", rating: 4.1, reviews: [{ user: "Rahul", comment: "Cheap and tasty food." }] },
  { name: "Family Feast", type: "restaurant", tags: ["woman", "employee"], description: "Family-oriented restaurant with diverse menu.", rating: 4.3, reviews: [{ user: "Meera", comment: "Great for family dinners." }, { user: "Suresh", comment: "Varied menu options." }] },
  { name: "Quick Bite", type: "restaurant", tags: ["student", "employee"], description: "Fast food joint popular among students and employees.", rating: 3.8, reviews: [{ user: "Pooja", comment: "Quick and affordable." }] },
  { name: "Elegant Eats", type: "restaurant", tags: ["woman"], description: "Upscale dining for women and families.", rating: 4.6, reviews: [{ user: "Amit", comment: "Elegant and delicious." }] },
  { name: "Budget Bites", type: "restaurant", tags: ["student"], description: "Cheap and cheerful meals for students.", rating: 4.0, reviews: [{ user: "Neha", comment: "Budget-friendly and good." }] },
  // Hospitals
  { name: "City Hospital", type: "hospital", tags: ["handicapped", "woman"], description: "24x7 multi-speciality hospital with wheelchair access.", rating: 4.4, reviews: [{ user: "Deepak", comment: "Excellent care and accessibility." }] },
  { name: "General Clinic", type: "hospital", tags: ["handicapped"], description: "Accessible clinic with ramps and facilities for handicapped.", rating: 4.2, reviews: [{ user: "Sunita", comment: "Very accessible and helpful." }] },
  { name: "Women's Health Center", type: "hospital", tags: ["woman"], description: "Specialized in women's health services.", rating: 4.7, reviews: [{ user: "Rajesh", comment: "Specialized and caring staff." }] },
  { name: "Emergency Care", type: "hospital", tags: ["handicapped"], description: "Emergency hospital with full accessibility.", rating: 4.1, reviews: [{ user: "Kiran", comment: "Reliable emergency services." }] },
  { name: "Community Hospital", type: "hospital", tags: ["woman", "handicapped"], description: "Community-focused hospital with inclusive facilities.", rating: 4.5, reviews: [{ user: "Lata", comment: "Inclusive and community-oriented." }] },
  // Shops
  { name: "Smart Shop", type: "shop", tags: ["employee", "student"], description: "Small shop selling office and student supplies.", rating: 3.9, reviews: [{ user: "Mohan", comment: "Convenient for supplies." }] },
  { name: "Ladies First Salon", type: "shop", tags: ["woman"], description: "Salon exclusively for women — safe and hygienic.", rating: 4.3, reviews: [{ user: "Rekha", comment: "Safe and professional service." }] },
  { name: "Student Supplies", type: "shop", tags: ["student"], description: "Affordable stationery and supplies for students.", rating: 4.0, reviews: [{ user: "Vijay", comment: "Affordable and student-focused." }] },
  { name: "Office Essentials", type: "shop", tags: ["employee"], description: "Professional supplies and gadgets.", rating: 4.1, reviews: [{ user: "Geeta", comment: "Good selection for professionals." }] },
  { name: "Fashion Hub", type: "shop", tags: ["woman"], description: "Trendy clothing and accessories for women.", rating: 4.4, reviews: [{ user: "Anil", comment: "Trendy and stylish." }] },
  { name: "Accessible Mart", type: "shop", tags: ["handicapped"], description: "Shop with ramps and accessible aisles.", rating: 4.2, reviews: [{ user: "Sanjay", comment: "Fully accessible and convenient." }] }
];

db.serialize(() => {

  basePlaces.forEach(place => {
    const latOffset = (Math.random() - 0.5) * 0.054;
    const lngOffset = (Math.random() - 0.5) * 0.054;
    const lat = 17.4375 + latOffset;
    const lng = 78.4917 + lngOffset;

    db.run(`INSERT INTO places (name, type, tags, description, rating, reviews, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [place.name, place.type, JSON.stringify(place.tags), place.description, place.rating, JSON.stringify(place.reviews), lat, lng],
      function(err) {
        if (err) {
          console.error('Error inserting place:', err.message);
        } else {
          console.log(`Inserted ${place.name}`);
        }
      });
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database migration completed.');
  }
});
