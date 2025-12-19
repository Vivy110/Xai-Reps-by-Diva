# 🤖 X AI Reply Assistant - Multi Provider

Chrome extension untuk generate AI-powered replies di X (Twitter) menggunakan **berbagai AI provider**: OpenAI, Claude, Gemini, Grok, DeepSeek, Groq, dan Perplexity.

## ✨ Features

- 🎯 **7 AI Providers** - Pilih provider favorit Anda
- ⚡ **Multiple Models** - Akses berbagai model dari GPT-4 hingga Llama
- 💰 **Compare Pricing** - Lihat perbandingan harga real-time
- 🎨 **Custom Instructions** - Personalisasi style reply AI
- 🔒 **Secure** - API key tersimpan lokal di browser Anda
- 🚀 **Fast** - Generate reply dalam 2-5 detik

## 🌟 Supported AI Providers

| Provider | Models | Pricing | Get API Key |
|----------|--------|---------|-------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-3.5-turbo | ~$0.0002/reply | [Get Key](https://platform.openai.com/api-keys) |
| **Claude** | Claude 3.5 Sonnet, Haiku, Opus | ~$0.0001/reply | [Get Key](https://console.anthropic.com/settings/keys) |
| **Gemini** | Gemini 2.0 Flash, 1.5 Pro/Flash | ~$0.00001/reply | [Get Key](https://aistudio.google.com/app/apikey) |
| **Grok** | Grok Beta, Grok Vision | TBA | [Get Key](https://console.x.ai/) |
| **DeepSeek** | DeepSeek Chat, Coder | ~$0.00007/reply | [Get Key](https://platform.deepseek.com/api_keys) |
| **Groq** | Llama 3.3, Mixtral | FREE tier | [Get Key](https://console.groq.com/keys) |
| **Perplexity** | Llama 3.1 Sonar | Varies | [Get Key](https://www.perplexity.ai/settings/api) |

## 📦 Installation

### Method 1: Load Unpacked (Development)

1. Download atau clone repository ini
2. Buka Chrome → `chrome://extensions/`
3. Enable **"Developer mode"** (toggle kanan atas)
4. Klik **"Load unpacked"**
5. Pilih folder `x-ai-reply-extension`

### Method 2: Pack Extension (Production)

```bash
# Zip folder untuk distribusi
zip -r x-ai-reply.zip x-ai-reply-extension/ -x "*.git*" "*.DS_Store"
```

## ⚙️ Setup

### 1. Pilih AI Provider

Klik icon extension → Pilih provider dari dropdown:
- OpenAI (paling populer)
- Claude (paling natural)
- Gemini (termurah)
- Groq (paling cepat + FREE)
- DeepSeek (cost-effective)
- Dan lainnya...

### 2. Pilih Model

Setiap provider punya beberapa model:
- **OpenAI**: GPT-4o-mini (recommended untuk speed/cost), GPT-4o (untuk quality)
- **Claude**: Claude 3.5 Sonnet (terbaik), Haiku (tercepat)
- **Gemini**: Gemini 2.0 Flash (tercepat + gratis quota besar)
- **Groq**: Llama 3.3 70B (FREE!)

### 3. Masukkan API Key

Dapatkan API key dari link yang tersedia di popup, kemudian paste ke field API Key.

### 4. Custom Instructions (Optional)

Tambahkan instruksi custom untuk personalisasi, contoh:
- "Be friendly and use emojis"
- "Write in professional tone"
- "Reply in Bahasa Indonesia"
- "Be witty and humorous"

## 🚀 Usage

### Basic Usage

1. Buka **X.com** (Twitter)
2. Klik **"Reply"** pada tweet manapun
3. Tunggu tombol **"Generate AI Reply"** muncul (1-2 detik)
4. Klik tombol tersebut
5. AI akan generate & auto-fill reply
6. Edit jika perlu → Post!

### Advanced Usage

#### Custom Instructions Examples:

**Friendly & Engaging:**
```
Be very friendly, enthusiastic, and use relevant emojis. Keep replies under 240 characters.
```

**Professional:**
```
Write professional, thoughtful replies. Avoid emojis. Use proper grammar and formal tone.
```

**Bahasa Indonesia:**
```
Tulis balasan dalam Bahasa Indonesia yang santai tapi sopan. Gunakan emoji yang relevan.
```

**Humorous:**
```
Write witty, clever replies with a touch of humor. Be playful but not offensive.
```

## 💡 Pro Tips

### 1. **Choose the Right Provider for Your Needs**

- **Speed Priority** → Groq (Llama 3.3) - Fastest!
- **Quality Priority** → Claude 3.5 Sonnet - Most natural
- **Cost Priority** → Gemini Flash - Cheapest
- **Balance** → OpenAI GPT-4o-mini - Good middle ground

### 2. **Optimize Costs**

```
Groq (FREE tier)     → 10,000 requests/day = $0
Gemini Flash         → 10,000 replies ≈ $0.10
DeepSeek            → 10,000 replies ≈ $0.70
Claude Haiku        → 10,000 replies ≈ $1.00
OpenAI GPT-4o-mini  → 10,000 replies ≈ $2.00
```

### 3. **Monitor Usage**

Check your API usage:
- **OpenAI**: https://platform.openai.com/usage
- **Claude**: https://console.anthropic.com/settings/usage
- **Gemini**: https://aistudio.google.com/app/apikey
- **Groq**: https://console.groq.com/

### 4. **Switch Providers Easily**

Simpan API keys untuk multiple providers. Ganti provider sesuai kebutuhan:
- Meeting: Switch ke Claude (more professional)
- Casual tweets: Switch ke Groq (free + fast)
- Technical replies: Switch ke DeepSeek Coder

## 🔧 Troubleshooting

### ❌ Tombol AI Tidak Muncul

**Solusi:**
```
1. Refresh halaman X.com (F5)
2. Clear cache: Ctrl+Shift+Delete
3. Cek extension aktif: chrome://extensions/
4. Restart browser
```

### ❌ Error "API Key Invalid"

**Solusi:**
```
1. Cek format API key benar:
   - OpenAI: sk-...
   - Claude: sk-ant-...
   - Gemini: AI...
   - Groq: gsk_...

2. Verify key di console provider
3. Regenerate key jika perlu
```

### ❌ Error "Rate Limit Exceeded"

**Solusi:**
```
1. Wait beberapa menit
2. Atau switch ke provider lain
3. Upgrade plan jika perlu
```

### ❌ Generated Reply Terlalu Panjang

**Solusi:**
Add ke custom instructions:
```
"Keep replies under 200 characters. Be very concise."
```

## 🔐 Privacy & Security

### What We Store:
- ✅ API key (encrypted in Chrome storage)
- ✅ Provider preference
- ✅ Model selection
- ✅ Custom instructions

### What We DON'T Store:
- ❌ Tweet content
- ❌ Reply history
- ❌ Personal data
- ❌ Usage analytics

### Where Data Goes:
- Tweet text → Hanya dikirim ke AI provider yang Anda pilih
- API key → Tersimpan lokal di browser Anda
- No third-party tracking

## 🆕 What's New in v2.0

- ✨ **Multi-provider support** - 7 AI providers!
- 🎨 **Custom instructions** - Personalize AI behavior
- 💰 **Pricing comparison** - See costs before choosing
- 🚀 **Model selection** - Choose specific models
- 🎯 **Better UI** - Modern, gradient design
- 🔄 **Easy switching** - Change providers anytime

## 🛠️ Development

### Project Structure:
```
x-ai-reply-extension/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── content.js
│   └── content.css
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Add New Provider:

Edit `service-worker.js`:
```javascript
const AI_PROVIDERS = {
  // ... existing providers
  newprovider: {
    name: 'New Provider',
    apiUrl: 'https://api.newprovider.com/v1/chat',
    models: ['model-1', 'model-2'],
    defaultModel: 'model-1',
    keyPrefix: 'np-'
  }
};
```

## 📊 Performance Benchmarks

Average response times (tested on stable connection):

| Provider | Speed | Quality | Cost/10k |
|----------|-------|---------|----------|
| Groq | ⚡⚡⚡⚡⚡ (0.5s) | ⭐⭐⭐⭐ | $0 |
| Gemini Flash | ⚡⚡⚡⚡ (1s) | ⭐⭐⭐⭐ | $0.10 |
| DeepSeek | ⚡⚡⚡ (2s) | ⭐⭐⭐⭐ | $0.70 |
| OpenAI mini | ⚡⚡⚡ (2s) | ⭐⭐⭐⭐⭐ | $2.00 |
| Claude Haiku | ⚡⚡⚡ (2s) | ⭐⭐⭐⭐⭐ | $1.00 |
| Claude Sonnet | ⚡⚡ (3s) | ⭐⭐⭐⭐⭐ | $3.00 |

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Credits

- Icons from [Flaticon](https://www.flaticon.com/)
- Built with ❤️ for the X.com community
- Powered by multiple AI providers

## 📞 Support

Issues? Questions? 
- Open GitHub issue
- Check troubleshooting section
- Review provider documentation

---

**Made with 🤖 by AI enthusiasts**

*Happy tweeting with AI! 🚀*
