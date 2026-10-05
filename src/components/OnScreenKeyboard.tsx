import { hapticTap } from '../utils/nativeShell';

const ROWS: string[][] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

interface OnScreenKeyboardProps {
  /** Visual theme — matches the game's CSS variable set */
  theme: 'cbo' | 'wp';
  /** Called when a letter key is pressed (lowercase letter) */
  onKey: (letter: string) => void;
  /** Called when the backspace / ⌫ key is pressed */
  onBackspace: () => void;
  /** Called when the Enter / Go key is pressed */
  onEnter: () => void;
  /** When true the Enter key is visually disabled and non-interactive */
  enterDisabled?: boolean;
  /** Label shown on the Enter key (default "GO") */
  enterLabel?: string;
}

export default function OnScreenKeyboard({
  theme,
  onKey,
  onBackspace,
  onEnter,
  enterDisabled = false,
  enterLabel = 'GO',
}: OnScreenKeyboardProps) {
  const baseClass = `osk-key osk-key-${theme}`;
  const wideClass = `osk-key osk-key-wide osk-key-${theme}`;
  const enterClass = `osk-key osk-key-wide osk-key-enter-${theme}`;

  return (
    <div className="osk-container">
      {ROWS.map((row, ri) => (
        <div key={ri} className="osk-row">
          {row.map((key) => {
            if (key === 'ENTER') {
              return (
                <button
                  key="enter"
                  className={enterClass}
                  disabled={enterDisabled}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!enterDisabled) { hapticTap(); onEnter(); }
                  }}
                >
                  {enterLabel}
                </button>
              );
            }

            if (key === '⌫') {
              return (
                <button
                  key="backspace"
                  className={wideClass}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    hapticTap();
                    onBackspace();
                  }}
                >
                  ⌫
                </button>
              );
            }

            return (
              <button
                key={key}
                className={baseClass}
                onPointerDown={(e) => {
                  e.preventDefault();
                  hapticTap();
                  onKey(key.toLowerCase());
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
