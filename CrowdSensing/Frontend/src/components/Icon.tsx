function Icon(props: { name: string; onClick?: () => void; style?: React.CSSProperties, spin?: boolean, color?: string }) {
    // Usable Icons: https://fonts.google.com/icons
    
    const spinStyle: React.CSSProperties = props.spin ? {
        animation: 'icon-spin 1s linear infinite',
    } : {};
    
    return (
        <>
            {props.spin && (
                <style>
                    {`
                        @keyframes icon-spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}
                </style>
            )}
            <span 
                style={{
                    userSelect: "none",
                    color: props.color,
                    cursor: props.onClick ? "pointer" : "default",
                    display: "inline-block",
                    ...spinStyle,
                    ...props.style
                }} 
                className="material-icons" 
                onClick={props.onClick}
            >
                {props.name}
            </span>
        </>
    );
}

export default Icon;