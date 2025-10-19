# MeraProduct 🇮🇳

MeraProduct is a lightweight Chrome extension built to empower users to make informed and patriotic purchase decisions.  
It automatically detects whether the product you’re viewing online is *Made in India* and displays key insights like origin, manufacturer, and review summaries.

---

## ✨ Features

- Instantly highlights **Made in India** products while browsing.
- Works seamlessly on **Amazon**, **Flipkart**, and other major eCommerce platforms.
- Shows product **origin**, **manufacturer details**, and **average review score**.
- Displays an **Indian flag badge** beside verified Indian-made listings.
- Privacy-first – all origin detection happens locally in your browser.

---

## 🧠 How It Works

1. The extension scans the product details section when you open an eCommerce product page.
2. It detects “Country of Origin” tags or similar metadata using a content script.
3. If the product is made in India, it instantly displays a 🇮🇳 badge and origin message.
4. Upcoming releases will include review aggregation and “Indian alternative” suggestions.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sudhanshuptl/MeraProduct.git
cd MeraProduct
```

### 2. Install Dependencies & Build
This project uses `npm` to manage dependencies and run build scripts.
```bash
# Install project dependencies
npm install

# Build the extension. This creates the `dist` folder with proper icons.
npm run build:simple
```

### 3. Load the Extension in Chrome
1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **“Load unpacked”** button.
4.  Select the **`dist`** folder from the project directory (NOT the root folder).

The MeraProduct extension icon should now appear in your Chrome toolbar!

---

## 💻 Development Workflow

For active development, use the `watch` script:

```bash
# Automatically rebuild the extension into the `dist` folder when source files change
npm run watch
```
After the initial build, you only need to **reload the extension** in `chrome://extensions/` to apply your changes. You do not need to remove and re-add it.

---

## 🧩 Tech Stack

- **Manifest v3** Chrome Architecture  
- **JavaScript** for DOM parsing & logic  
- **HTML/CSS** for extension UI  
- (Optional) **Node.js** for review API integration  

---

## 🛠 Future Enhancements

- Support for more websites (Myntra, Croma)
- AI-driven product comparison for Indian-made alternatives
- Review sentiment visualization
- Language localization (Hindi, English)

---

## 🙌 Contributing

Contributions are welcome! Please open a pull request or raise an issue with site support suggestions or feature improvements.

---

## 📜 License

This project is licensed under the **Apache 2.0** – see the [LICENSE](LICENSE) file for details.

---

## ❤️ Made in India

Proudly developed to support the *Atmanirbhar Bharat* initiative.
