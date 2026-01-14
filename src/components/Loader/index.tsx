// src/components/Loader/index.tsx

const MarshmallowLoader = () => {
    // This new path creates a taller, puffier, "soft cube" shape.
    const marshmallowPath = "M20,30 C20,10 80,10 80,30 C100,30 100,70 80,70 C80,90 20,90 20,70 C0,70 0,30 20,30 Z";
    const shadowFilter = "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))";

    return (
        <div className="marshmallow-loader">
            <div className="marshmallow">
                {/* Marshmallow 1: Happy */}
                <svg viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <g transform="rotate(-15, 50, 50)">
                        <path d={marshmallowPath} fill="#F8F0E3" />
                        <circle cx="40" cy="48" r="4" fill="#3D352E" />
                        <circle cx="60" cy="48" r="4" fill="#3D352E" />
                        <path d="M 42 60 Q 50 70 58 60" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </g>
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 2: Winking */}
                <svg viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <g transform="rotate(8, 50, 50)">
                        <path d={marshmallowPath} fill="#F8F0E3" />
                        <circle cx="38" cy="50" r="4" fill="#3D352E" />
                        <path d="M 55 48 L 65 52 L 55 56" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 45 65 Q 50 60 55 65" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </g>
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 3: Content */}
                <svg viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter }}>
                    <g transform="rotate(20, 50, 50)">
                        <path d={marshmallowPath} fill="#F8F0E3" />
                        <path d="M 38 45 C 42 52 46 45" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        <path d="M 58 45 C 62 52 66 45" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        <path d="M 45 62 Q 52 68 59 62" stroke="#3D352E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default MarshmallowLoader;
