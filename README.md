# 🥗 NutriGlass

NutriGlass is a modern nutrition tracking application designed to help users monitor calories, protein, carbohydrates, and fats with ease.

The application provides intelligent food search by combining:

- 📚 Curated local food database
- 👤 User-created custom foods
- 🌎 Open Food Facts integration

This allows users to quickly find nutritional information for both homemade and packaged foods.

---

## ✨ Features

### 🍎 Smart Food Search
Search foods from multiple sources:

1. Local nutrition database
2. Custom foods created by users
3. Open Food Facts global database

### 📊 Nutrition Tracking

Track:

- Calories
- Protein
- Carbohydrates
- Fat

### 👤 Custom Foods

Create and save your own foods with custom nutritional values.

### ⚡ Fast Search Ranking

Results are automatically ranked by relevance:

- Exact matches first
- User foods prioritized
- Local database prioritized
- Online results merged automatically

### 🌐 Online Food Lookup

Uses the Open Food Facts API to fetch nutrition information for thousands of packaged food products worldwide.

---

## 🏗️ Architecture

```text
User Search
      │
      ▼
FoodSearchApi
      │
      ├── Custom Foods (Local Storage)
      │
      ├── Local Food Database
      │
      └── Open Food Facts API
                │
                ▼
         Merged Results
```

---

## 📂 Project Structure

```text
NUTRIGLASS/
│
├── foodData.js          # Local food database
├── database.js          # User data & custom foods
├── FoodSearchApi.js     # Search engine
│
├── components/
├── pages/
├── styles/
│
└── README.md
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/dev-aryansingh/NUTRIGLASS.git
cd NUTRIGLASS
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

or

```bash
npm start
```

---

## 🔍 How Food Search Works

When a user searches for food:

1. Search custom foods
2. Search local database
3. Fetch online foods from Open Food Facts
4. Remove duplicates
5. Sort results by relevance

This provides fast results while still giving access to a huge online food catalog.

---

## 🌎 Open Food Facts Integration

NutriGlass integrates with:

https://world.openfoodfacts.org

Features:

- Product search
- Nutrition facts
- Calories per 100g
- Protein, carbs, fat
- Serving size detection
- Brand information

---

## 📈 Future Roadmap

- Barcode scanner
- Meal planning
- Daily nutrition goals
- Weight tracking
- Water intake tracker
- Workout integration
- Progress analytics
- AI-powered diet recommendations

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

## 👨‍💻 Developer

Aryan Singh

GitHub:
https://github.com/dev-aryansingh

---

## 📄 License

This project is licensed under the MIT License.

---

### Built with ❤️ for healthier living.
