// src/components/Loader/index.tsx

const MarshmallowLoader = () => {
    return (
        <div className="marshmallow-loader">
            <div className="marshmallow">
                {/* Marshmallow 1: Happy */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M 20,50 C 5,50 5,20 20,20 L 80,20 C 95,20 95,50 80,50 L 50,50 C 50,60 50,80 50,80 C 50,95 20,95 20,80 Z"
                        fill="#F8F0E3"
                        transform="rotate(-15, 50, 50) translate(0, -5)"
                    />
                    <circle cx="40" cy="45" r="3" fill="#2c2c2c" />
                    <circle cx="60" cy="45" r="3" fill="#2c2c2c" />
                    <path d="M 45 60 Q 50 68 55 60" stroke="#2c2c2c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 2: Winking */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M 20,50 C 5,50 5,20 20,20 L 80,20 C 95,20 95,50 80,50 L 50,50 C 50,60 50,80 50,80 C 50,95 20,95 20,80 Z"
                        fill="#F8F0E3"
                        transform="rotate(8, 50, 50) translate(0, -5)"
                    />
                    <circle cx="38" cy="50" r="3" fill="#2c2c2c" />
                    <path d="M 55 48 L 65 52 L 55 56" stroke="#2c2c2c" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="50" cy="65" r="4" fill="none" stroke="#2c2c2c" strokeWidth="2" />
                </svg>
            </div>
            <div className="marshmallow">
                {/* Marshmallow 3: Content */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                     <path
                        d="M 20,50 C 5,50 5,20 20,20 L 80,20 C 95,20 95,50 80,50 L 50,50 C 50,60 50,80 50,80 C 50,95 20,95 20,80 Z"
                        fill="#F8F0E3"
                        transform="rotate(20, 50, 50) translate(0, -5)"
                    />
                    <path d="M 38 45 C 42 50 46 45" stroke="#2c2c2c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 58 45 C 62 50 66 45" stroke="#2c2c2c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 45 62 Q 52 65 59 62" stroke="#2c2c2c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
};

export default MarshmallowLoader;
