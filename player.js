/**
 * Island Radio - Modern Web Radio Player
 *
 * A production-ready radio player using Video.js
 * Supports HLS (.m3u8) and MP3 streams from StreamGuys
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // Stream Configuration
    // Change this to your stream URL
    // For HLS streams, use .m3u8 URL
    // For MP3 streams, use direct MP3 stream URL

    // YOUR STREAM (may need verification):
    // streamUrl: 'http://peridot.streamguys.com:5040/live',
    // streamType: 'audio/mpeg',

    // TEMPORARY TEST STREAM (known working - BBC World Service):
    streamUrl: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    streamType: 'audio/mpeg',

    // MORE TEST STREAMS YOU CAN TRY:
    // NPR: 'https://npr-ice.streamguys1.com/live.mp3' (type: 'audio/mpeg')
    // WNYC: 'https://fm939.wnyc.org/wnycfm' (type: 'audio/mpeg')
    // SomaFM: 'https://ice1.somafm.com/groovesalad-128-mp3' (type: 'audio/mpeg')

    // HLS Example: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8' (type: 'application/x-mpegURL')

    // Reconnection settings
    reconnectAttempts: 5,
    reconnectDelay: 3000, // milliseconds

    // Metadata polling interval (for Icecast/Shoutcast metadata)
    metadataInterval: 10000, // 10 seconds

    // Volume settings
    defaultVolume: 70, // 0-100
    volumeStep: 5, // Volume change per arrow key press
};

// ============================================
// Player Class
// ============================================

class RadioPlayer {
    constructor() {
        this.player = null;
        this.isPlaying = false;
        this.isLoading = false;
        this.reconnectCount = 0;
        this.metadataTimer = null;
        this.currentMetadata = {
            title: 'Ready to play',
            artist: 'Press play to start streaming'
        };

        // DOM Elements
        this.elements = {
            playPauseBtn: document.getElementById('playPauseBtn'),
            playIcon: document.querySelector('.play-icon'),
            pauseIcon: document.querySelector('.pause-icon'),
            loadingSpinner: document.querySelector('.loading-spinner'),
            volumeBtn: document.getElementById('volumeBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            volumeHighIcon: document.querySelector('.volume-high-icon'),
            volumeMutedIcon: document.querySelector('.volume-muted-icon'),
            songTitle: document.getElementById('songTitle'),
            artistName: document.getElementById('artistName'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            connectionStatus: document.getElementById('connectionStatus'),
            shareBtn: document.getElementById('shareBtn'),
            shareSection: document.getElementById('shareSection'),
        };

        this.init();
    }

    /**
     * Initialize the player
     */
    init() {
        console.log('Initializing Island Radio Player...');

        // Initialize Video.js
        this.initializeVideoJS();

        // Load saved volume from localStorage
        this.loadVolume();

        // Setup event listeners
        this.setupEventListeners();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        console.log('Player initialized successfully!');
    }

    /**
     * Initialize Video.js player
     */
    initializeVideoJS() {
        this.player = videojs('radioPlayer', {
            controls: false,
            autoplay: false,
            preload: 'none',
            liveui: true,
            html5: {
                vhs: {
                    // VHS options for HLS streaming
                    withCredentials: false,
                    enableLowInitialPlaylist: true,
                },
                nativeAudioTracks: false,
                nativeVideoTracks: false,
            }
        });

        // DON'T set source on init - wait for user to click play
        // This prevents the loading spinner from appearing immediately
        // this.player.src({
        //     src: CONFIG.streamUrl,
        //     type: CONFIG.streamType
        // });

        // Video.js event listeners
        this.player.on('loadstart', () => {
            console.log('Stream loading started');
            // Don't show loading on initial loadstart, only when actually trying to play
            // this.setLoadingState(true);
        });

        this.player.on('canplay', () => {
            console.log('Stream ready to play');
            this.setLoadingState(false);
            this.hideError();
            this.reconnectCount = 0;
        });

        this.player.on('playing', () => {
            console.log('Stream playing');
            this.isPlaying = true;
            this.setLoadingState(false);
            this.updatePlayPauseButton();
            this.updateConnectionStatus('connected');
            this.startMetadataPolling();
        });

        this.player.on('pause', () => {
            console.log('Stream paused');
            this.isPlaying = false;
            this.updatePlayPauseButton();
            this.updateConnectionStatus('ready');
            this.stopMetadataPolling();
        });

        this.player.on('waiting', () => {
            console.log('Stream buffering...');
            this.setLoadingState(true);
            this.updateConnectionStatus('loading');
        });

        this.player.on('error', (error) => {
            console.error('Player error:', error);
            this.handleStreamError();
        });

        this.player.on('volumechange', () => {
            this.updateVolumeUI();
        });
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Play/Pause button
        this.elements.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Volume button (mute toggle)
        this.elements.volumeBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        // Volume slider
        this.elements.volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            this.setVolume(volume);
        });

        // Share button
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => {
                this.shareNowPlaying();
            });
        }

        // Handle autoplay restrictions
        document.addEventListener('click', () => {
            if (this.player && this.player.muted()) {
                this.player.muted(false);
            }
        }, { once: true });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.adjustVolume(CONFIG.volumeStep);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.adjustVolume(-CONFIG.volumeStep);
                    break;

                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (!this.player) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Play the stream
     */
    async play() {
        if (!this.player) return;

        try {
            this.setLoadingState(true);
            this.updateConnectionStatus('loading');

            // Set source if not already set
            const currentSrc = this.player.currentSrc();
            if (!currentSrc || currentSrc === '') {
                console.log('Setting stream source:', CONFIG.streamUrl);
                this.player.src({
                    src: CONFIG.streamUrl,
                    type: CONFIG.streamType
                });
            }

            // Try to play
            const playPromise = this.player.play();

            if (playPromise !== undefined) {
                await playPromise;
                console.log('Playback started successfully');
            }
        } catch (error) {
            console.error('Playback failed:', error);

            // Handle autoplay restrictions
            if (error.name === 'NotAllowedError') {
                this.showError(
                    'Autoplay Blocked',
                    'Please click the play button to start the stream. Some browsers require user interaction before playing audio.'
                );
            } else {
                this.handleStreamError();
            }

            this.setLoadingState(false);
        }
    }

    /**
     * Pause the stream
     */
    pause() {
        if (!this.player) return;

        this.player.pause();
        this.updateConnectionStatus('ready');
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        if (!this.player) return;

        const isMuted = this.player.muted();
        this.player.muted(!isMuted);
        this.updateVolumeUI();
    }

    /**
     * Set volume (0-100)
     */
    setVolume(volume) {
        if (!this.player) return;

        // Clamp volume between 0 and 100
        volume = Math.max(0, Math.min(100, volume));

        // Video.js uses 0.0 to 1.0 scale
        this.player.volume(volume / 100);

        // Unmute if volume is set above 0
        if (volume > 0 && this.player.muted()) {
            this.player.muted(false);
        }

        // Save to localStorage
        this.saveVolume(volume);

        // Update UI
        this.elements.volumeSlider.value = volume;
        this.updateVolumeUI();
    }

    /**
     * Adjust volume by a delta
     */
    adjustVolume(delta) {
        const currentVolume = parseInt(this.elements.volumeSlider.value);
        const newVolume = currentVolume + delta;
        this.setVolume(newVolume);
    }

    /**
     * Update volume UI
     */
    updateVolumeUI() {
        if (!this.player) return;

        const isMuted = this.player.muted();
        const volume = Math.round(this.player.volume() * 100);

        // Update volume value display
        this.elements.volumeValue.textContent = `${volume}%`;
        this.elements.volumeSlider.value = volume;

        // Update volume icon
        if (isMuted || volume === 0) {
            this.elements.volumeHighIcon.style.display = 'none';
            this.elements.volumeMutedIcon.style.display = 'block';
        } else {
            this.elements.volumeHighIcon.style.display = 'block';
            this.elements.volumeMutedIcon.style.display = 'none';
        }
    }

    /**
     * Update play/pause button UI
     */
    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.elements.playIcon.style.display = 'none';
            this.elements.pauseIcon.style.display = 'block';
            this.elements.playPauseBtn.setAttribute('aria-label', 'Pause');
        } else {
            this.elements.playIcon.style.display = 'block';
            this.elements.pauseIcon.style.display = 'none';
            this.elements.playPauseBtn.setAttribute('aria-label', 'Play');
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;

        if (isLoading) {
            this.elements.playIcon.style.display = 'none';
            this.elements.pauseIcon.style.display = 'none';
            this.elements.loadingSpinner.style.display = 'block';
            this.elements.playPauseBtn.disabled = true;
        } else {
            this.elements.loadingSpinner.style.display = 'none';
            this.elements.playPauseBtn.disabled = false;
            this.updatePlayPauseButton();
        }
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const statusElement = this.elements.connectionStatus;
        const statusText = statusElement.querySelector('.status-text');

        // Remove all status classes
        statusElement.classList.remove('connected', 'loading', 'error');

        switch (status) {
            case 'connected':
                statusElement.classList.add('connected');
                statusText.textContent = 'Live';
                break;
            case 'loading':
                statusElement.classList.add('loading');
                statusText.textContent = 'Connecting...';
                break;
            case 'error':
                statusElement.classList.add('error');
                statusText.textContent = 'Error';
                break;
            default:
                statusText.textContent = 'Ready';
        }
    }

    /**
     * Handle stream errors
     */
    handleStreamError() {
        console.error('Stream error occurred');
        this.setLoadingState(false);
        this.updateConnectionStatus('error');

        const errorMessage = this.getErrorMessage();
        this.showError('Connection Error', errorMessage);

        // Attempt to reconnect
        if (this.reconnectCount < CONFIG.reconnectAttempts) {
            this.reconnectCount++;
            console.log(`Attempting to reconnect (${this.reconnectCount}/${CONFIG.reconnectAttempts})...`);

            setTimeout(() => {
                this.reconnectStream();
            }, CONFIG.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            this.showError(
                'Connection Failed',
                'Unable to connect to the stream after multiple attempts. Please check your internet connection and try again later.'
            );
        }
    }

    /**
     * Get appropriate error message
     */
    getErrorMessage() {
        if (!navigator.onLine) {
            return 'No internet connection detected. Please check your network settings.';
        }

        return `Unable to connect to the stream. Attempting to reconnect (${this.reconnectCount}/${CONFIG.reconnectAttempts})...`;
    }

    /**
     * Reconnect to stream
     */
    reconnectStream() {
        if (!this.player) return;

        console.log('Reconnecting to stream...');
        this.hideError();
        this.updateConnectionStatus('loading');

        // Reset the source
        this.player.src({
            src: CONFIG.streamUrl,
            type: CONFIG.streamType
        });

        // Try to play again
        if (this.isPlaying) {
            this.play();
        }
    }

    /**
     * Show error message
     */
    showError(title, message) {
        const errorTitle = this.elements.errorMessage.querySelector('.error-title');
        errorTitle.textContent = title;
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'flex';
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    /**
     * Start polling for metadata
     * Note: Actual metadata extraction depends on the stream server configuration
     */
    startMetadataPolling() {
        // Clear any existing timer
        this.stopMetadataPolling();

        // For demonstration, we'll simulate metadata updates
        // In production, you would fetch this from your stream's metadata endpoint
        this.metadataTimer = setInterval(() => {
            this.fetchMetadata();
        }, CONFIG.metadataInterval);

        // Show share button when playing
        if (this.elements.shareSection) {
            this.elements.shareSection.style.display = 'flex';
        }
    }

    /**
     * Stop metadata polling
     */
    stopMetadataPolling() {
        if (this.metadataTimer) {
            clearInterval(this.metadataTimer);
            this.metadataTimer = null;
        }

        // Hide share button when stopped
        if (this.elements.shareSection) {
            this.elements.shareSection.style.display = 'none';
        }
    }

    /**
     * Fetch metadata from stream
     *
     * Note: This is a placeholder implementation. StreamGuys streams typically
     * provide metadata through Icecast/Shoutcast headers. You would need to
     * implement a server-side proxy to fetch this metadata, as browsers
     * don't expose ICY metadata directly.
     *
     * For production, you should:
     * 1. Create a backend endpoint that fetches the stream metadata
     * 2. Call that endpoint from here
     * 3. Parse the ICY metadata (StreamTitle field)
     */
    async fetchMetadata() {
        try {
            // Example: If you have a metadata endpoint
            // const response = await fetch('/api/metadata');
            // const data = await response.json();
            // this.updateMetadata(data.title, data.artist);

            // For now, show that we're streaming live
            if (this.isPlaying) {
                this.updateMetadata('Live Broadcast', 'Island Radio');
            }
        } catch (error) {
            console.error('Error fetching metadata:', error);
            // Silently fail - metadata is not critical
        }
    }

    /**
     * Update metadata display
     */
    updateMetadata(title, artist) {
        // Only update if changed
        if (this.currentMetadata.title === title && this.currentMetadata.artist === artist) {
            return;
        }

        this.currentMetadata = { title, artist };

        // Update UI with fade animation
        const titleElement = this.elements.songTitle;
        const artistElement = this.elements.artistName;

        // Fade out
        titleElement.style.opacity = '0';
        artistElement.style.opacity = '0';

        setTimeout(() => {
            titleElement.textContent = title;
            artistElement.textContent = artist;

            // Check if title is too long and needs scrolling
            if (titleElement.scrollWidth > titleElement.clientWidth) {
                titleElement.classList.add('scrolling');
                // Duplicate text for seamless scrolling
                titleElement.textContent = title + ' • ' + title;
            } else {
                titleElement.classList.remove('scrolling');
            }

            // Fade in
            titleElement.style.opacity = '1';
            artistElement.style.opacity = '1';
        }, 300);
    }

    /**
     * Save volume to localStorage
     */
    saveVolume(volume) {
        try {
            localStorage.setItem('radioPlayerVolume', volume.toString());
        } catch (error) {
            console.warn('Failed to save volume to localStorage:', error);
        }
    }

    /**
     * Load volume from localStorage
     */
    loadVolume() {
        try {
            const savedVolume = localStorage.getItem('radioPlayerVolume');
            if (savedVolume !== null) {
                const volume = parseInt(savedVolume);
                if (!isNaN(volume)) {
                    this.setVolume(volume);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load volume from localStorage:', error);
        }

        // Use default volume if no saved volume
        this.setVolume(CONFIG.defaultVolume);
    }

    /**
     * Share now playing information
     */
    async shareNowPlaying() {
        const shareText = `🎵 Now Playing on Island Radio: ${this.currentMetadata.title} - ${this.currentMetadata.artist}`;
        const shareUrl = window.location.href;

        // Check if Web Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Island Radio - Now Playing',
                    text: shareText,
                    url: shareUrl,
                });
                console.log('Shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    this.fallbackShare(shareText);
                }
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    /**
     * Fallback share method (copy to clipboard)
     */
    fallbackShare(text) {
        try {
            navigator.clipboard.writeText(text);

            // Show temporary success message
            const originalText = this.elements.shareBtn.textContent;
            this.elements.shareBtn.textContent = '✓ Copied!';

            setTimeout(() => {
                this.elements.shareBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Share
                `;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            alert('Unable to share. Please try again.');
        }
    }
}

// ============================================
// Initialize Player on Page Load
// ============================================

let player;

// Wait for DOM and Video.js to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer);
} else {
    initPlayer();
}

function initPlayer() {
    // Wait a bit for Video.js to be fully loaded
    if (typeof videojs === 'undefined') {
        console.warn('Video.js not loaded yet, retrying...');
        setTimeout(initPlayer, 100);
        return;
    }

    player = new RadioPlayer();

    // Make player globally accessible for debugging
    window.radioPlayer = player;
}

// Handle page visibility changes (pause when tab is hidden, optionally)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
        // Optionally pause when page is hidden
        // player.pause();
    } else {
        console.log('Page visible');
    }
});

// Handle network status changes
window.addEventListener('online', () => {
    console.log('Network connection restored');
    if (player && player.isPlaying) {
        player.hideError();
        player.reconnectStream();
    }
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
    if (player) {
        player.showError('Network Error', 'Internet connection lost. Waiting for connection...');
    }
});
