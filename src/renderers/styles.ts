/**
 * CSS Styles for In-App Messages
 */

export function getStyles(): string {
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
    
    /* Blocks — spacing comes from block config (preview parity) */
    .tappd-block-image img {
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    .tappd-block-text {
      line-height: 1.5;
    }

    /* Rows with stackOnMobile: one column per line on phones, with photos kept short. */
    @media (max-width: 600px) {
      .tappd-row-stack {
        flex-direction: column !important;
      }
      .tappd-row-stack > div {
        flex-basis: auto !important;
        width: 100%;
      }
      .tappd-row-stack .tappd-block-image img {
        width: 100%;
        max-height: 200px;
        object-fit: cover;
      }
    }
    
    /* Form fields. Host-page themes often strip outlines or restyle inputs, so these rules use
       two-class selectors to win over typical theme selectors like input:focus. */
    .tappd-iam-field .tappd-input {
      display: block;
      width: 100%;
      min-height: 38px;
      margin: 0;
      padding: 8px 10px;
      box-sizing: border-box;
      font: inherit;
      font-size: 14px;
      line-height: 1.4;
      color: #111827;
      background-color: #fff;
      border: 1px solid #767676;
      border-radius: 4px;
      box-shadow: none;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .tappd-iam-field textarea.tappd-input {
      min-height: 0;
      resize: vertical;
    }

    .tappd-iam-field select.tappd-input {
      padding-right: 32px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23555' stroke-width='1.5' d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      cursor: pointer;
    }

    .tappd-iam-field .tappd-input::placeholder {
      color: #9ca3af;
      opacity: 1;
    }

    .tappd-iam-field .tappd-input:hover {
      border-color: #374151;
    }

    .tappd-iam-field .tappd-input:focus,
    .tappd-iam-field .tappd-input:focus-visible {
      border-color: var(--tappd-accent, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--tappd-accent, #2563eb) 25%, transparent);
      outline: 2px solid transparent; /* keeps a visible ring in Windows high-contrast mode */
      outline-offset: 2px;
    }

    .tappd-iam-field .tappd-input:user-invalid {
      border-color: #b42318;
    }

    .tappd-iam-field .tappd-input:user-invalid:focus {
      box-shadow: 0 0 0 3px rgba(180, 35, 24, 0.2);
    }

    .tappd-iam-field .tappd-choice {
      width: 16px;
      height: 16px;
      margin: 0;
      flex-shrink: 0;
      cursor: pointer;
      accent-color: var(--tappd-accent, #2563eb);
    }

    .tappd-iam-field .tappd-choice:focus-visible {
      outline: 2px solid var(--tappd-accent, #2563eb);
      outline-offset: 2px;
    }

    .tappd-iam-field .tappd-choice + label,
    .tappd-iam-field span > label {
      cursor: pointer;
    }

    .tappd-button:focus-visible {
      outline: 2px solid var(--tappd-accent, #2563eb);
      outline-offset: 2px;
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

