/**
 * CSS Styles for In-App Messages
 */
export function getStyles() {
    return `
    /* Tappd In-App Message Styles */
    
    /* Banner Styles */
    .tappd-message-banner {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .tappd-message-banner.tappd-message-top {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .tappd-message-banner.tappd-message-bottom {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    /* Message Content */
    .tappd-message-content {
      position: relative;
    }
    
    /* Blocks */
    .tappd-block-image {
      margin: 8px 0;
    }
    
    .tappd-block-image img {
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    .tappd-block-text {
      margin: 8px 0;
      line-height: 1.5;
    }
    
    .tappd-block-button {
      margin: 12px 0;
    }
    
    .tappd-button {
      display: inline-block;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      text-decoration: none;
    }
    
    .tappd-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .tappd-button:active {
      transform: translateY(0);
    }
    
    .tappd-block-html {
      margin: 8px 0;
    }
    
    .tappd-block-html img {
      max-width: 100%;
      height: auto;
    }
    
    /* Dismiss/Close Buttons */
    .tappd-message-dismiss,
    .tappd-message-close {
      color: #666;
      transition: color 0.2s;
    }
    
    .tappd-message-dismiss:hover,
    .tappd-message-close:hover {
      color: #000;
    }
    
    /* Overlay */
    .tappd-message-overlay {
      backdrop-filter: blur(2px);
    }
    
    /* Popup/Modal */
    .tappd-message-popup,
    .tappd-message-modal {
      position: relative;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .tappd-message-popup,
      .tappd-message-modal {
        width: 95% !important;
        max-width: 95% !important;
      }
      
      .tappd-message-content {
        padding: 16px !important;
      }
      
      .tappd-message-banner .tappd-message-content {
        padding: 12px !important;
      }
    }
    
    /* Animation keyframes */
    @keyframes tappd-slide-down {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }
    
    @keyframes tappd-slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
    
    @keyframes tappd-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes tappd-scale-in {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
}
//# sourceMappingURL=styles.js.map