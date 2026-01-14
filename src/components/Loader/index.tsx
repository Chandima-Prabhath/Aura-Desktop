// src/components/Loader/index.tsx

const MarshmallowLoader = () => {
    // A single, softer, puffier SVG path for the marshmallow body
    const marshmallowPath = "M85,67.5c0,9.6-15.7,17.5-35,17.5s-35-7.8-35-17.5c0-9.6,15.7-17.5,35-17.5S85,57.9,85,67.5z M85,32.5c0,9.6-15.7,17.5-35,17.5s-35-7.8-35-17.5c0-9.6,15.7-17.5,35-17.5S85,22.9,85,32.5z M15,32.5v35c0,9.6,15.7,17.5,35,17.5s35-7.8,35-17.5v-35c0-9.6-15.7-17.5-35-17.5S15,22.9,15,32.5z";
    const shadowFilter = "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))";

    return (
        <div className="marshmallow-loader">
            <div className="marshmallow">
                {/* Marshmallow 1: Happy */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <path d={marshmallowPath} fill="#F8F0E3" transform="rotate(-15, 50, 50)" />
                    <circle cx="40" cy="45" r="3.5" fill="#3D352E" />
                    <circle cx="60" cy="45" r="3.5" fill="#3D352E" />
                    <path d="M 45 58 Q 50 66 55 58" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 2: Winking */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <path d={marshmallowPath} fill="#F8F0E3" transform="rotate(8, 50, 50)" />
                    <circle cx="38" cy="50" r="3.5" fill="#3D352E" />
                    <path d="M 55 48 L 65 52 L 55 56" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 45 62 Q 50 58 55 62" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 3: Content */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <path d={marshmallowPath} fill="#F8F0E3" transform="rotate(20, 50, 50)" />
                    <path d="M 38 45 C 42 50 46 45" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M 58 45 C 62 50 66 45" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M 45 62 Q 52 65 59 62" stroke="#3D352E" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
};

export default MarshmallowLoader;
