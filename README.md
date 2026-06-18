# 📊 BigQuery Release Notes Explorer & Tweet Sharer

A modern, responsive, and visually stunning web application built with **Python Flask** (backend) and **Vanilla HTML, CSS, and JavaScript** (frontend). 

It dynamically fetches the Google Cloud BigQuery Release Notes feed, parses individual updates into structured groups, sorts them by type (Features, Announcements, Issues, Deprecations), and includes a character-limited X/Twitter composer to instantly share updates.

---

## ✨ Features

- **Automated RSS Parsing**: Fetches the live Google Cloud BigQuery Atom feed and structures raw HTML contents by sub-headings (`<h3>` elements) to separate daily updates.
- **Premium Dark Mode UI**: A dashboard designed with HSL-tailored colors, glassmorphism, responsive panels, clean typography (**Outfit** and **Plus Jakarta Sans**), and animated interactive elements.
- **Interactive Badges**: Categorized badges equipped with custom inline SVG icons representing each update type.
- **Live Search & Filter**: Real-time keyword search across update titles and content, plus quick tabs to filter items by category.
- **Dynamic Refresh**: On-demand feed retrieval featuring a smooth rotating spinner animation and pulsing loader state.
- **Branded Tweet Composer**: Selecting a release note auto-generates a formatted tweet containing details, dates, and direct links. Features a live character counter and an authentic circular progress ring that changes colors as it nears the 280-character limit.
- **Native X Integration**: Uses X/Twitter Web Intents to directly load your custom text into the official tweet composer in a new tab (requires zero API keys or authentication setup).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11, Flask, Requests, BeautifulSoup4
- **Frontend**: HTML5, Vanilla CSS3 (no external libraries like Tailwind for custom design control), Javascript (ES6)
- **Icons**: Hand-crafted SVG assets

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Python 3.x installed.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Deepthit-23/BigQuery.git
   cd BigQuery
   ```

2. **Install dependencies**:
   ```bash
   pip install flask requests beautifulsoup4
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open your browser and navigate to:
   👉 **http://127.0.0.1:5000**

---

## 📁 Project Structure

```text
├── templates/
│   └── index.html      # UI structure and markup
├── static/
│   ├── style.css       # Premium dark dashboard design system
│   └── script.js       # Search, filters, and Tweet composer logic
├── app.py              # Flask server and feed parser
├── .gitignore          # Exclusions for python caches/envs
└── README.md           # Project documentation
```
