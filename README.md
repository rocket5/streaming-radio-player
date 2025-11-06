# 🎵 Island Radio - Modern Web Radio Player

A production-ready, modern web-based radio player for streaming live broadcasts from StreamGuys. Built with Video.js, this player supports both HLS (.m3u8) and MP3/Icecast/Shoutcast streams.

![Radio Player](https://img.shields.io/badge/status-production--ready-brightgreen) ![Video.js](https://img.shields.io/badge/video.js-8.10.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Features
- **Play/Pause Control** - Large, touch-friendly button with clear visual states
- **Volume Control** - Slider with mute toggle and visual feedback
- **Loading States** - Smooth loading indicators during buffering
- **Now Playing Display** - Shows current song/artist metadata (when available)
- **Error Handling** - User-friendly error messages with auto-recovery
- **Auto-Reconnect** - Automatic reconnection logic if stream drops
- **Responsive Design** - Works beautifully on mobile and desktop

### Bonus Features
- **Keyboard Shortcuts** - Spacebar (play/pause), Arrow keys (volume), M (mute)
- **Volume Memory** - Remembers your volume setting using localStorage
- **Social Sharing** - Share "Now Playing" information
- **Metadata Ticker** - Scrolling animation for long song titles
- **Connection Status** - Real-time connection status indicator
- **Dark Mode Support** - Respects system dark mode preferences
- **Network Monitoring** - Detects and handles offline/online status

## 🚀 Quick Start

### Option 1: Use as Standalone Page

1. **Download the files** to your web server:
   ```bash
   # All you need are these three files:
   - index.html
   - styles.css
   - player.js
   ```

2. **Configure your stream URL** in `player.js`:
   ```javascript
   const CONFIG = {
       streamUrl: 'http://peridot.streamguys.com:5040/live',
       streamType: 'audio/mpeg', // or 'application/x-mpegURL' for HLS
   };
   ```

3. **Open `index.html`** in a web browser or upload to your server!

### Option 2: Embed in Existing Website

Add this to your existing HTML page:

```html
<!-- In your <head> section -->
<link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
<link rel="stylesheet" href="path/to/styles.css">

<!-- Where you want the player to appear -->
<div id="radio-player-container"></div>

<!-- Before closing </body> tag -->
<script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
<script src="path/to/player.js"></script>
```

Then copy the entire `.radio-container` div from `index.html` into your `#radio-player-container`.

## ⚙️ Configuration

### Stream Configuration

Edit the `CONFIG` object in `player.js`:

```javascript
const CONFIG = {
    // For MP3/Icecast/Shoutcast streams
    streamUrl: 'http://peridot.streamguys.com:5040/live',
    streamType: 'audio/mpeg',

    // OR for HLS streams (.m3u8)
    // streamUrl: 'https://your-stream.streamguys1.com/live.m3u8',
    // streamType: 'application/x-mpegURL',

    // Reconnection settings
    reconnectAttempts: 5,        // Number of reconnection attempts
    reconnectDelay: 3000,        // Delay between attempts (ms)

    // Metadata polling
    metadataInterval: 10000,     // How often to check for metadata (ms)

    // Volume settings
    defaultVolume: 70,           // Default volume (0-100)
    volumeStep: 5,               // Volume change per arrow key press
};
```

### Stream Type Guide

| Stream Format | URL Example | streamType Value |
|--------------|-------------|------------------|
| MP3 Stream | `http://server:port/live` | `'audio/mpeg'` |
| HLS Stream | `https://server/live.m3u8` | `'application/x-mpegURL'` |
| AAC Stream | `http://server:port/live.aac` | `'audio/aac'` |

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2563eb;      /* Main theme color */
    --primary-hover: #1d4ed8;      /* Hover state */
    --primary-light: #dbeafe;      /* Background accent */
    --success-color: #10b981;      /* Live indicator */
    --error-color: #ef4444;        /* Error messages */
    /* ... more variables ... */
}
```

### Changing Station Name

Edit the HTML in `index.html`:

```html
<div class="station-logo">
    <svg class="radio-icon">...</svg>
    <h1>Your Station Name</h1>  <!-- Change this -->
</div>
```

### Adding Custom Logo

Replace the SVG icon with an image:

```html
<div class="station-logo">
    <img src="your-logo.png" alt="Station Logo" class="station-logo-img">
    <h1>Your Station Name</h1>
</div>
```

Add this CSS:

```css
.station-logo-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
}
```

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **↑** (Up Arrow) | Increase volume |
| **↓** (Down Arrow) | Decrease volume |
| **M** | Toggle mute |

## 🎯 Metadata Integration

The player supports metadata display, but StreamGuys streams require a backend proxy to extract ICY metadata. Here's how to implement it:

### Option 1: Backend Proxy (Recommended)

Create a server-side endpoint that fetches stream metadata:

**Example Node.js/Express endpoint:**

```javascript
const express = require('express');
const http = require('http');

app.get('/api/metadata', (req, res) => {
    const options = {
        host: 'peridot.streamguys.com',
        port: 5040,
        path: '/live',
        headers: { 'Icy-MetaData': '1' }
    };

    http.get(options, (stream) => {
        // Parse ICY metadata from stream
        // Extract StreamTitle field
        // Return as JSON
        res.json({
            title: 'Song Title',
            artist: 'Artist Name'
        });
    });
});
```

Then update the `fetchMetadata()` function in `player.js`:

```javascript
async fetchMetadata() {
    try {
        const response = await fetch('/api/metadata');
        const data = await response.json();
        this.updateMetadata(data.title, data.artist);
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
}
```

### Option 2: StreamGuys API

If your StreamGuys account provides a metadata API, use that endpoint in the `fetchMetadata()` function.

## 🔧 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Mobile Safari | iOS 14+ | ✅ Fully Supported |
| Chrome Mobile | 90+ | ✅ Fully Supported |

**Note:** Autoplay policies vary by browser. Users may need to interact with the page before audio can play.

## 🐛 Troubleshooting

### Stream Won't Play

1. **Check stream URL** - Verify the URL is correct and accessible
2. **Check CORS** - Ensure your stream server allows cross-origin requests
3. **Check browser console** - Look for error messages
4. **Test stream directly** - Try opening the stream URL in VLC or another player

### No Metadata Showing

1. **Check if stream provides metadata** - Not all streams include metadata
2. **Implement backend proxy** - Browser restrictions prevent direct metadata access
3. **Check metadata endpoint** - Verify your metadata API is working

### Autoplay Issues

Modern browsers block autoplay. The player handles this gracefully:
- User must click play button on first visit
- After interaction, autoplay works normally

### HTTPS Issues

If your page is HTTPS but stream is HTTP:
- Browsers block mixed content (HTTPS page loading HTTP stream)
- **Solution:** Use HTTPS stream URL or proxy the stream through your HTTPS server

## 📦 Files Overview

```
streaming-radio-player/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling and responsive design
├── player.js       # Player logic and functionality
└── README.md       # This file
```

**Total size:** ~50KB (before compression)

## 🚀 Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

1. Upload all three files to your hosting provider
2. Configure your stream URL in `player.js`
3. Deploy!

### Traditional Web Server (Apache, Nginx)

1. Upload files to your web root (e.g., `/var/www/html/radio/`)
2. Ensure server has MIME types configured for `.js` and `.css`
3. Access via `https://yourdomain.com/radio/`

### WordPress Integration

1. Create a new page in WordPress
2. Use a "Custom HTML" block
3. Paste the contents of `index.html` (the `.radio-container` div)
4. Upload `styles.css` and `player.js` to your theme folder
5. Enqueue the scripts in your theme's `functions.php`:

```php
function enqueue_radio_player() {
    wp_enqueue_style('radio-player', get_template_directory_uri() . '/styles.css');
    wp_enqueue_script('videojs', 'https://vjs.zencdn.net/8.10.0/video.min.js', array(), '8.10.0', true);
    wp_enqueue_script('radio-player', get_template_directory_uri() . '/player.js', array('videojs'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_radio_player');
```

## 🎓 Advanced Features

### Multiple Stream Quality Options

Add quality selector:

```javascript
const STREAMS = {
    high: { url: 'http://server/high', type: 'audio/mpeg' },
    medium: { url: 'http://server/medium', type: 'audio/mpeg' },
    low: { url: 'http://server/low', type: 'audio/mpeg' }
};
```

### Custom Visualizer

Add audio visualization using Web Audio API (see Video.js plugins).

### Schedule/Program Guide

Integrate with your station's schedule API to show upcoming shows.

## 📄 License

MIT License - Feel free to use this in your projects!

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Video.js documentation: https://videojs.com/
3. Check StreamGuys support for stream-specific issues

## 🎉 Credits

- **Video.js** - HTML5 video player library
- **StreamGuys** - Professional streaming services
- Built with ❤️ for island radio stations

---

**Enjoy your streaming! 🎵📻**
