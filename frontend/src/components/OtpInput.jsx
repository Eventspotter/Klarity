import React, { useState, useRef, useEffect } from 'react';
import './OtpInput.css';

/**
 * Animated glowing OTP input component matching the user's reference mockup.
 * - Glowing rounded square boxes with neon blue border
 * - Auto-focus, keyboard navigation (left/right/backspace), copy-paste support
 * - When all digits are entered: boxes animate inwards and combine into one central square
 * - Shows glowing blue/green tick if correct, or red cross + shake if incorrect
 */
export default function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  status = 'idle', // 'idle' | 'combining' | 'success' | 'error'
  disabled = false,
}) {
  const [digits, setDigits] = useState(() => {
    const arr = Array(length).fill('');
    const valChars = (value || '').slice(0, length).split('');
    valChars.forEach((ch, idx) => {
      arr[idx] = ch;
    });
    return arr;
  });

  const inputRefs = useRef([]);

  useEffect(() => {
    const currentVal = digits.join('');
    if (value !== currentVal) {
      const arr = Array(length).fill('');
      const valChars = (value || '').slice(0, length).split('');
      valChars.forEach((ch, idx) => {
        arr[idx] = ch;
      });
      setDigits(arr);
    }
  }, [value, length]);

  const handleChange = (index, char) => {
    if (disabled || status === 'combining' || status === 'success') return;

    // Filter only numbers/letters (usually digits)
    const sanitized = char.replace(/[^0-9]/g, '');
    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      onChange?.(nextDigits.join(''));
      return;
    }

    const nextDigits = [...digits];
    // Handle pasting multiple digits into one field
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, length - index).split('');
      chars.forEach((c, i) => {
        nextDigits[index + i] = c;
      });
      setDigits(nextDigits);
      const combined = nextDigits.join('');
      onChange?.(combined);
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (combined.length === length && !nextDigits.includes('')) {
        onComplete?.(combined);
      }
      return;
    }

    nextDigits[index] = sanitized[0];
    setDigits(nextDigits);
    const combined = nextDigits.join('');
    onChange?.(combined);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === length && !nextDigits.includes('')) {
      onComplete?.(combined);
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled || status === 'combining' || status === 'success') return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        setDigits(nextDigits);
        onChange?.(nextDigits.join(''));
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        setDigits(nextDigits);
        onChange?.(nextDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled || status === 'combining' || status === 'success') return;
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pastedData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      nextDigits[i] = pastedData[i];
    }
    setDigits(nextDigits);
    const combined = nextDigits.join('');
    onChange?.(combined);

    const targetFocus = Math.min(pastedData.length, length - 1);
    inputRefs.current[targetFocus]?.focus();

    if (pastedData.length === length) {
      onComplete?.(pastedData);
    }
  };

  const isCollapsed = status === 'combining' || status === 'success' || status === 'error';
  const centerIdx = (length - 1) / 2;

  return (
    <div className={`otp-wrapper ${status}`}>
      <div className={`otp-container ${isCollapsed ? 'collapsed' : ''} ${status}`}>
        {digits.map((digit, idx) => {
          // Calculate offset toward center for collapse animation
          // Box width: 46px + gap: 10px = 56px per slot
          const offset = (centerIdx - idx) * 56;
          return (
            <div
              key={idx}
              className={`otp-box ${digit ? 'has-value' : ''} ${isCollapsed ? 'merging' : ''}`}
              style={{
                '--merge-x': `${offset}px`,
                zIndex: idx === Math.floor(centerIdx) ? 10 : 2,
              }}
              onClick={() => inputRefs.current[idx]?.focus()}
            >
              <input
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={disabled || isCollapsed}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="otp-input"
                autoComplete="one-time-code"
              />
            </div>
          );
        })}

        {/* Central status card overlay when collapsed */}
        {isCollapsed && (
          <div className={`otp-central-badge ${status}`}>
            {status === 'combining' && (
              <div className="otp-spinner" />
            )}
            {status === 'success' && (
              <svg className="otp-icon-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M5 13l4 4L19 7"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {status === 'error' && (
              <svg className="otp-icon-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
