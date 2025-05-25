import { ImageResponse } from 'next/og';

// Tamaño del icono
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

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
        viewBox="0 0 200 200"
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
              style={{ stopColor: '#FFB347', stopOpacity: 1 }}
            />
            <stop
              offset="25%"
              style={{ stopColor: '#FF6B9D', stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: '#9B59B6', stopOpacity: 1 }}
            />
            <stop
              offset="75%"
              style={{ stopColor: '#5B2C87', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#2C3E50', stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#orangeRedGradient)" />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
