import './LoadingSpinner.css';

function LoadingSpinner() {



    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 999, background: "var(--background)", opacity: 0.9 }}>
            <span className="loader" style={{ position: "relative", top: "calc(50% - 5em)", left: "calc(50% - 5em)", width: "10em", height: "10em", zIndex: 1000 }}></span>
        </div>
    );
}

export default LoadingSpinner;