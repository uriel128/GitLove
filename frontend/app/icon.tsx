import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M16 28 C16 28 4 19 4 10 C4 5.5 7.5 2 12 2 C14.5 2 16 4 16 4 C16 4 17.5 2 20 2 C24.5 2 28 5.5 28 10 C28 19 16 28 16 28 Z"
            fill="#8B5CF6"
          />
          <circle cx="11" cy="10" r="2.5" fill="#FFFFFF" />
          <circle cx="21" cy="10" r="2.5" fill="#FFFFFF" />
          <circle cx="16" cy="17" r="2.5" fill="#FFFFFF" />
          <path
            d="M11 10 L16 17 L21 10"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
