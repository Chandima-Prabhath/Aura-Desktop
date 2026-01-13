// src/components/common/MarshmallowLoader.tsx
import './MarshmallowLoader.css';

const Marshmallow = () => (
    <svg viewBox="0 0 100 100" className="marshmallow">
        <path d="M 20,30 C 5,30 5,70 20,70 L 80,70 C 95,70 95,30 80,30 Z" fill="#F8F0E3" stroke="#E0D6C3" strokeWidth="3"/>
        <circle cx="40" cy="50" r="3" fill="#4A4A4A"/>
        <circle cx="60" cy="50" r="3" fill="#4A4A4A"/>
        <path d="M 45,60 Q 50,65 55,60" fill="none" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default function MarshmallowLoader() {
  return (
    <div className="marshmallow-loader">
      <Marshmallow />
      <Marshmallow />
      <Marshmallow />
    </div>
  );
}
