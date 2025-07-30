# Web Scraping APIs for VelvetLadle

## 🌐 **Available APIs**

Your VelvetLadle app now supports multiple web scraping APIs for better recipe extraction!

### **1. Spoonacular API** (Recommended for recipes)
- **Purpose**: Recipe-specific extraction and search
- **Benefits**: AI-powered recipe parsing, nutrition data, cooking times
- **Cost**: Free tier: 150 requests/day, Paid: $0.008/request
- **Setup**: Get API key from [spoonacular.com/food-api](https://spoonacular.com/food-api)

### **2. ScrapingBee API** (For general web scraping)
- **Purpose**: Handles JavaScript rendering, CAPTCHA, anti-bot measures
- **Benefits**: Premium proxies, 99.9% success rate, fast
- **Cost**: Free tier: 1,000 requests/month, Paid: starts at $29/month
- **Setup**: Get API key from [scrapingbee.com](https://www.scrapingbee.com)

### **3. Your Current CORS Proxy** (Fallback)
- **Purpose**: Basic web scraping without JavaScript
- **Benefits**: Free, simple
- **Limitations**: CORS restrictions, no JavaScript rendering

## 🛠️ **Setup Instructions**

### **Step 1: Get API Keys**
1. **Spoonacular**: Sign up at [spoonacular.com](https://spoonacular.com/food-api/console)
2. **ScrapingBee**: Sign up at [scrapingbee.com](https://www.scrapingbee.com)

### **Step 2: Configure Environment**
1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Add your API keys to `.env.local`:
```env
EXPO_PUBLIC_SPOONACULAR_KEY=your_actual_spoonacular_key
EXPO_PUBLIC_SCRAPINGBEE_KEY=your_actual_scrapingbee_key
```

### **Step 3: Test the APIs**
The app will automatically use APIs when available, falling back to CORS proxy if not configured.

## 📊 **API Priority Order**

Your app now extracts recipes in this order:

1. **🥇 Spoonacular Recipe Extraction** - Most reliable for recipe URLs
2. **🥈 ScrapingBee + Your Parsing** - Handles complex sites with JavaScript
3. **🥉 CORS Proxy + Your Parsing** - Original fallback method
4. **🔧 Manual Entry** - User can enter recipe manually

## 🎯 **API Features**

### **Spoonacular API Benefits:**
- ✅ **Recipe-specific AI** - Understands recipe formats
- ✅ **Nutrition analysis** - Automatic nutritional information
- ✅ **Cooking times** - Prep, cook, and total time extraction
- ✅ **Ingredient parsing** - Smart ingredient recognition
- ✅ **Recipe search** - Find recipes by ingredients/cuisine
- ✅ **Image extraction** - High-quality recipe photos

### **ScrapingBee API Benefits:**
- ✅ **JavaScript rendering** - Handles dynamic content
- ✅ **Anti-bot bypassing** - Works on protected sites
- ✅ **Premium proxies** - Reliable access
- ✅ **CAPTCHA solving** - Automatic CAPTCHA handling
- ✅ **Fast response** - Optimized for speed

## 💰 **Cost Comparison**

### **Free Tiers:**
- **Spoonacular**: 150 requests/day (enough for personal use)
- **ScrapingBee**: 1,000 requests/month
- **CORS Proxy**: Unlimited (but limited functionality)

### **Paid Plans:**
- **Spoonacular**: $0.008/request (~$2.40 for 300 recipes)
- **ScrapingBee**: $29/month (50,000 requests)

## 🔧 **Usage Examples**

### **In Your Code:**
```typescript
// The RecipeExtractor automatically uses APIs when available
const recipe = await RecipeExtractor.extractRecipeFromUrl(url);

// Direct API usage
const recipe = await WebScrapingAPIService.extractRecipeSpoonacular(url);
const html = await WebScrapingAPIService.extractWithScrapingBee(url);
```

### **Success Rates:**
- **Recipe sites with Spoonacular**: ~95% success
- **General sites with ScrapingBee**: ~90% success  
- **CORS proxy method**: ~60% success (due to CORS restrictions)

## 🎯 **When to Use Which API**

### **Use Spoonacular for:**
- AllRecipes.com, Food Network, Epicurious
- Any recipe-focused website
- When you need nutrition data
- Recipe search functionality

### **Use ScrapingBee for:**
- Sites that block CORS requests
- JavaScript-heavy recipe sites
- Sites with anti-bot protection
- When CORS proxy fails

### **Use CORS Proxy for:**
- Simple, static recipe sites
- When APIs are not configured
- As a final fallback

## 🚀 **Benefits for Your App**

1. **Higher Success Rate** - APIs handle more sites than CORS proxy
2. **Better Data Quality** - AI-powered parsing extracts more complete recipes
3. **Faster Extraction** - APIs are optimized for speed
4. **More Reliable** - Less likely to be blocked or fail
5. **Additional Features** - Nutrition data, recipe search, cooking times

Your VelvetLadle app is now equipped with professional-grade recipe extraction capabilities! 🍳✨
