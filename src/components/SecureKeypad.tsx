/**
 * The in-app secure numeric keypad.
 *
 * Two client-side security properties, both real rather than simulated:
 *
 *  - It is the app's own keypad, not the OS keyboard, so a third-party keyboard cannot observe
 *    what is typed into it.
 *  - The digits are shuffled, so the physical positions a finger travels do not spell the value.
 *    Shoulder-surfing by position stops working.
 *
 * The shuffle is fixed per mount rather than per keystroke: re-shuffling between taps would make
 * the pad unusable at a market counter, which is where this gets used.
 */

import { useMemo } from 'react';

interface SecureKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  shuffle?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

function shuffled(): string[] {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  // Fisher-Yates.
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = digits[i]!;
    const b = digits[j]!;
    digits[i] = b;
    digits[j] = a;
  }
  return digits;
}

export function SecureKeypad({
  onDigit,
  onBackspace,
  onClear,
  shuffle = true,
  disabled = false,
  ariaLabel,
}: SecureKeypadProps) {
  const keys = useMemo(
    () => (shuffle ? shuffled() : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    [shuffle],
  );

  return (
    <div className="keypad" role="group" aria-label={ariaLabel}>
      {keys.map((d) => (
        <button
          key={d}
          type="button"
          className="keypad__key"
          onClick={() => onDigit(d)}
          disabled={disabled}
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        className="keypad__key keypad__key--util"
        onClick={onClear}
        disabled={disabled}
      >
        Clear
      </button>
      <button
        type="button"
        className="keypad__key keypad__key--util"
        onClick={onBackspace}
        disabled={disabled}
        aria-label="Delete last digit"
      >
        ⌫
      </button>
    </div>
  );
}
