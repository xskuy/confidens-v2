import { ImageResponse } from 'next/og';

// Tamaño del icono
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

const colors = {
  primary: '#000000',
  secondary: '#1A1A1A',
  tertiary: '#8B4513',
  quaternary: '#DAA520',
  quinary: '#FFD700',
};

// Función para generar el icono
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: 'transparent',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="orangeRedGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: '#000000', stopOpacity: 1 }}
            />
            <stop
              offset="25%"
              style={{ stopColor: '#1A1A1A', stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: '#8B4513', stopOpacity: 1 }}
            />
            <stop
              offset="75%"
              style={{ stopColor: '#DAA520', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#FFD700', stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" fill="url(#orangeRedGradient)" />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
