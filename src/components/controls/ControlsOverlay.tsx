import "./controlsOverlay.css";

const ControlsOverlay = ({
  canMove,
  isMobile,
  useJoystick,
  onToggleMode,
}: {
  canMove: boolean;
  isMobile: boolean;
  useJoystick?: boolean;
  onToggleMode?: () => void;
}) => {
  const joystickActive = useJoystick ?? isMobile;

  return (
    <div className="overlay-container">
      {canMove ? (
        <>
          <div className="controls-box">
            {!joystickActive ? (
              <div className="keys">
                <div className="key">W</div>
                <div className="key-row">
                  <div className="key">A</div>
                  <div className="key">S</div>
                  <div className="key">D</div>
                </div>
              </div>
            ) : (
              <div className="mobile-guide">
                <div className="joystick-icon">🕹️</div>
              </div>
            )}

            <div className="controls-text">
              <p>{joystickActive ? "Use Joystick to Move" : "Move"}</p>
              <p>
                {joystickActive
                  ? "🖐️ Drag to Look Around"
                  : "🖱️ Left Click once and Look Around"}
              </p>
            </div>
          </div>

          {/* Mode toggle — always visible when canMove */}
          <button
            className="mode-toggle"
            onClick={onToggleMode}
            aria-label={`Switch to ${joystickActive ? "WASD" : "Joystick"} mode`}
          >
            <span className="mode-toggle-icon">
              {joystickActive ? "🕹️" : "⌨️"}
            </span>
            <span className="mode-toggle-label">
              {joystickActive ? "Joystick" : "WASD"}
            </span>
            <span className={`mode-toggle-switch${joystickActive ? " active" : ""}`} />
          </button>
        </>
      ) : (
        <div className="scroll-indicator">
          <div className="mouse">
            {isMobile ? <div className="finger" /> : <div className="wheel" />}
          </div>
          <p>{isMobile ? "Swipe Up to Continue" : "Scroll Down"}</p>
        </div>
      )}
    </div>
  );
};

export default ControlsOverlay;
