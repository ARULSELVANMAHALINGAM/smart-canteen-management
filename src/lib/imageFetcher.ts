/**
 * Helper to fetch premium plated food photography from Unsplash or Pexels.
 * Supports fallback to curated, professional Unsplash images specifically mapped to menu items.
 */

// Curated high-end Unsplash images for each of the seed menu items
const CURATED_IMAGES: Record<string, string> = {
  // MAIN COURSE
  "paneer-butter-masala-with-roti": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800",
  "veg-biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
  "chicken-curry-with-rice": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800",
  "dal-tadka-with-rice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsDtbHeD2bdDsgeLJT57yiMGpGUZBe0_EfmvbCGDP1gg&s=10",
  "egg-curry-with-rice": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800",
  "chicken-biriyani": "data:image/jpeg;base64,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",

  // SOUTH INDIAN
  "masala-dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=800",
  "idli-sambar-2-pcs": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800",
  "medu-vada": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOyuPetiukQFHkZTZDUO6eC3nfO7Swl4FL0hhoNq-ZXw&s=10",

  // BURGERS & WRAPS
  "classic-veg-burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
  "chicken-burger": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&q=80&w=800",
  "cheese-burst-burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
  "grilled-sandwich": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYUUveT4_lyoaLpighy0BQpRrKPHmOF-1d_lHGtCwIXA&s=10",
  "chicken-wrap": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=800",

  // SNACKS
  "samosa-2-pcs": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlxz7QeU8_nrfo4CKH-7FkOry6oSK5D9oqIrkZiMjEBg&s=10",
  "vada-pav": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800",
  "aloo-tikki": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX-L5hKl96iC2tfQSZVFzQLp2Vj1C1BSybdA9pbLG3xg&s=10",
  "golden-fries": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800",
  "veg-cutlet": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgltyLMbUNGh9C6Z7B5ymbfTIflDJl09zAPEJyrsNHFw&s=10",
  "chicken-65": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800",
  "loaded-nachos": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=800",
  "onion-rings": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVe-U630Mbiv-ZQ8kB2ZbNOUM3gSk2FQPsa-IeczoH9Q&s=10",
  "chicken-popcorn": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800",
  "garlic-bread": "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=800",

  // MOCKTAILS & BEVERAGES
  "masala-chai": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgfFTDNY-rVWE-S_eZRbtZspWN9u9KvMGG6WCxeatL2g&s=10",
  "filter-coffee": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTIVYqi5-oKrrCMXyCsgQl_txknwHC1uLaVxLsy4gutnRhsnhmRSrFyK4I&s=10",
  "cold-coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800",
  "lassi-sweet-salted": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800",
  "buttermilk": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtN_R5chzTOpuJzrXXDJ-Zg1z_t4UjHxl1NuFdatobRQ&s=10",
  "virgin-mojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
  "blue-lagoon": "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800",
  "watermelon-cooler": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800",
  "fresh-lime-soda": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800",
  "oreo-shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
  "chocolate-milkshake": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSihODXHN0rhLqgGC5YTOc_Mj5XzsmGXbFOSlciVdh5tg&s=10",

  // DESSERTS & SMOOTHIES
  "chocolate-lava-cake": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJArAYL4lxox4ywY-TaJE82BiQDiiYBTR1-v-XeldIrQ&s=10",
  "sizzling-brownie": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkeHdV_SUVdiRHAFnzZJDN2N2Ak8mUoGdwegECHq9nLw&s=10",
  "gulab-jamun": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWzcBFRXk1FMm7kbaVYJMKWMPhmErpWcx0ghydyJ2U2g&s=10",
  "strawberry-banana-smoothie": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScasw5VjEq-5HNXO9LVJjrucAeHqgwdj7D-tER52C_wA&s=10",
  "mango-mastani-smoothie": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiygkwGMc4PnyEGLVrqThZK4HfwQJQYj304rQG8F3nAQ&s=10",
  "green-detox-smoothie": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIDfbKpRtSFGX2sPl8EzV1qCJy5XaVwxtUiBkJ1cq-Pg&s=10",
};

// General fallback to a beautiful empty food platter
const GENERAL_FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";

/**
 * Searches Unsplash or Pexels for a food item and returns the image URL.
 * Falls back to curated, high-res preloaded URLs if no API key is available or the search fails.
 * 
 * @param query The search query (e.g. "masala-dosa" or "chicken curry")
 * @param displayName Human readable name for dynamic API search
 */
export async function fetchFoodImage(query: string, displayName: string): Promise<string> {
  const normalizedKey = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const curatedUrl = CURATED_IMAGES[normalizedKey];

  // Try Unsplash search if key is provided in environment
  const unsplashAccessKey = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY;
  if (unsplashAccessKey && unsplashAccessKey !== "YOUR_UNSPLASH_ACCESS_KEY") {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          displayName + " plated food"
        )}&orientation=landscape&per_page=1`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].urls.regular;
        }
      }
    } catch (err) {
      console.warn("Unsplash API fetch failed, falling back:", err);
    }
  }

  // Try Pexels search if key is provided
  const pexelsApiKey = (import.meta as any).env?.VITE_PEXELS_API_KEY;
  if (pexelsApiKey && pexelsApiKey !== "YOUR_PEXELS_API_KEY") {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          displayName + " plated food"
        )}&per_page=1`,
        {
          headers: {
            Authorization: pexelsApiKey,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          return data.photos[0].src.large;
        }
      }
    } catch (err) {
      console.warn("Pexels API fetch failed, falling back:", err);
    }
  }

  // Fall back to curated preloaded premium Unsplash URLs, or general fallback
  return curatedUrl || GENERAL_FALLBACK;
}
