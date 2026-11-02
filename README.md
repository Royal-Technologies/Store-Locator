# Royal Store - Modern Store Locator

A modern, high-performance, and 100% free **Store & Showroom Locator** built with **Leaflet.js** and **OpenStreetMap**. It provides interactive locations, contact information, turn-by-turn directions, and live GPS search for all [Royal Store](https://www.navanafurniture.com/dealer-showrooms/) flagship showrooms, dealer outlets, and corporate offices across Bangladesh.

No paid Google Maps API key or third-party paid services required — completely free and open-source.

---

## 🌟 Key Features

1. **100% Free OpenStreetMap Integration (Zero API Key & No Watermarks):**
   - **OpenStreetMap Standard**: Official high-precision street map (default).
   - **OpenStreetMap (HOT Style)**: High-contrast, vibrant Humanitarian style.
   - **Satellite Imagery (Esri)**: High-resolution aerial imagery.
   - **Topographic Map (OpenTopo)**: Topographic terrain view.

2. **Complete Showroom Network (30 Locations across Bangladesh):**
   - **Flagship Showrooms**: Panthapath, Uttara, Kazipara, Kakrail, Rampura, Agrabad (Chattogram), Rajshahi.
   - **Corporate Head Office**: Gulshan-2, Dhaka.
   - **22 Authorized Dealer Showrooms**: Madaripur, Patuakhali, Jatrabari, Faridpur, Dinajpur, Thakurgaon, Sirajganj, Panchagarh, Nilphamari, Kurigram, Kushtia, Konabari (Gazipur), Khulna, Rangpur, Mymensingh, Sylhet, Gopalganj, Jhenaidah, Feni, Savar, Cox's Bazar, Barishal.

3. **Smart Search & Filters:**
   - **Instant Live Search**: Search by name, area, district, division, contact person, or phone number.
   - **Division Filter Dropdown**: Filter by Dhaka, Chattogram, Rajshahi, Rangpur, Khulna, Barishal, Sylhet, Mymensingh.
   - **Category Pills**: Filter by All Stores, Flagship Showrooms, Dealer Outlets, and Corporate Office.
   - **"Near Me" GPS Geolocation**: Finds your location and sorts showrooms by distance in km, with an interactive radius slider (5 km - 150 km).
   - **Marker Clustering**: Uses Leaflet.markercluster to group markers smoothly when zoomed out.

4. **Interactive Cards & Actions:**
   - 📞 **Direct Dial**: Click to call showroom managers directly.
   - 🧭 **Google Maps Turn-by-Turn Directions**: Launches Google Maps navigation from the user's location to the store.
   - 🎯 **View on Map**: Smooth fly-to zoom animation and marker pulse highlight.
   - ⏱️ **Opening Hours & Status**: Displays daily store timings and operating status.

---

## 📁 Project Structure

```
D:\laragon\www\Github\Store Locator\
│
├── index.html                  # Main Web Application (open directly in browser)
├── css/
│   └── style.css               # Modern, responsive UI & typography stylesheet
├── js/
│   ├── app.js                  # Map logic, instant search, geolocation & filters
│   └── stores-data.js          # Geo-data & contact details for all 30 showrooms
├── stores.json                 # Standard JSON showroom dataset
├── stores.geojson              # GIS GeoJSON dataset
├── generate_stores_data.py     # Python data scraper & updater
└── README.md                   # Documentation
```

---

## 🚀 How to Run

### Method 1: Direct File Open (No Server Needed)
Simply double-click [`index.html`](file:///D:/laragon/www/Github/Store%20Locator/index.html) to open it in any browser (Chrome, Edge, Firefox, Safari).

### Method 2: Via Laragon Localhost
If Laragon is running, visit:
[http://localhost/Github/Store%20Locator/](http://localhost/Github/Store%20Locator/)


---

## 👨‍💻 Developed By

**[Royal Technologies](https://www.royaltechbd.com/)**  
Innovating modern web, GIS, and smart software solutions.  
🌐 Website: [https://www.royaltechbd.com/](https://www.royaltechbd.com/)
