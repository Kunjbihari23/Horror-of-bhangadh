import "./controlsOverlay.css";

const ControlsOverlay = ({ canMove }: { canMove: boolean }) => {
  return (
    <div className="overlay-container">
      {canMove ? <div className="controls-box">
        <div className="keys">
          <div className="key">W</div>
          <div className="key-row">
            <div className="key">A</div>
            <div className="key">S</div>
            <div className="key">D</div>
          </div>
        </div>

        <div className="controls-text">
          <p>Move</p>
          <p>🖱️ Left Click once and Look Around</p>
        </div>
      </div>:  <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel" />
        </div>
        <p>Scroll Down</p>
      </div>}
 
      
    </div>
  );
};

export default ControlsOverlay;