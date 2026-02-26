// src/components/AuraLoader/index.tsx
import React from 'react';

const AuraLoader: React.FC = () => {
    return (
        <div className="aura-loader-container">
            <div className="aura-loader">
                <div className="aura-ring"></div>
                <div className="aura-ring"></div>
                <div className="aura-ring"></div>
            </div>
        </div>
    );
};

export default AuraLoader;
