/**
 * Tappd Web SDK
 * Initialize and use Tappd content in your web applications
 */

class TappdSDK {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://sdk.tappd.io/api/v1/sdk';
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch content by type
   * @param {string} type - Content type (CARD, FORM, BANNER, POPUP, LANDING_PAGE)
   * @param {object} options - Additional options
   * @returns {Promise<array>} Array of content items
   */
  async getContent(type, options = {}) {
    const cacheKey = `content-${type}-${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({ type, ...options });
      const response = await fetch(`${this.baseUrl}/content/${this.apiKey}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const content = result.data.content;

      // Cache the result
      this.cache.set(cacheKey, {
        data: content,
        timestamp: Date.now(),
      });

      return content;
    } catch (error) {
      console.error('Tappd SDK Error:', error);
      throw error;
    }
  }

  /**
   * Get specific content items by IDs
   * @param {array} ids - Array of content IDs
   * @returns {Promise<array>} Array of content items
   */
  async getContentByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }

    try {
      const params = new URLSearchParams({ ids: ids.join(',') });
      const response = await fetch(`${this.baseUrl}/content/${this.apiKey}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.content;
    } catch (error) {
      console.error('Tappd SDK Error:', error);
      throw error;
    }
  }

  /**
   * Track an event
   * @param {string} contentId - Content ID
   * @param {string} event - Event type (view, click, conversion)
   * @param {object} metadata - Additional event metadata
   * @returns {Promise<void>}
   */
  async trackEvent(contentId, event, metadata = {}) {
    if (!contentId || !event) {
      throw new Error('Content ID and event type are required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          event,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tappd SDK Error:', error);
      throw error;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TappdSDK;
}

if (typeof window !== 'undefined') {
  window.TappdSDK = TappdSDK;
}

export default TappdSDK;

