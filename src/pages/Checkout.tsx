import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    Square?: any;
  }
}

export default function Checkout() {
  const cardRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSquare = async () => {
      try {
        let script = document.querySelector(
          'script[src="https://web.squarecdn.com/v1/square.js"]'
        ) as HTMLScriptElement | null;

        if (!script) {
          script = document.createElement('script');
          script.src = 'https://web.squarecdn.com/v1/square.js';
          script.async = true;

          document.body.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            script!.onload = () => resolve();
            script!.onerror = () => reject(new Error('Square failed to load.'));
          });
        } else if (!window.Square) {
          await new Promise<void>((resolve) => {
            script!.addEventListener('load', () => resolve(), { once: true });
          });
        }

        const applicationId =
          import.meta.env.VITE_SQUARE_APPLICATION_ID;

        const locationId =
          import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!applicationId || !locationId) {
          throw new Error('Square checkout settings are missing.');
        }

        if (!window.Square) {
          throw new Error('Square payments could not initialize.');
        }

        const payments = window.Square.payments(
          applicationId,
          locationId
        );

        const card = await payments.card();

        await card.attach('#card-container');

        cardRef.current = card;
        setLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load Square.'
        );

        setLoading(false);
      }
    };

    loadSquare();

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy?.();
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090909',
        color: '#ffffff',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '650px',
          margin: '0 auto',
        }}
      >
        <Link
          to="/portal"
          style={{
            color: '#c9a96e',
            textDecoration: 'none',
          }}
        >
          ← Back to portal
        </Link>

        <div
          style={{
            marginTop: '30px',
            padding: '35px',
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                letterSpacing: '3px',
                color: '#c9a96e',
              }}
            >
              NORTH SPLASH
            </div>

            <div
              style={{
                fontSize: '11px',
                letterSpacing: '4px',
                color: '#888',
              }}
            >
              AUTO LUXE
            </div>
          </div>

          <h1
            style={{
              fontSize: '32px',
              marginBottom: '8px',
            }}
          >
            Secure Checkout
          </h1>

          <p
            style={{
              color: '#999',
              marginBottom: '30px',
            }}
          >
            Complete your payment securely with Square.
          </p>

          {loading && (
            <p style={{ color: '#aaa' }}>
              Loading secure payment form...
            </p>
          )}

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#2a1111',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <div
            id="card-container"
            style={{
              marginBottom: '20px',
            }}
          />

          <button
            disabled={loading || !!error}
            style={{
              width: '100%',
              padding: '16px',
              background: '#c9a96e',
              border: 'none',
              borderRadius: '8px',
              color: '#090909',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Pay Securely
          </button>

          <p
            style={{
              marginTop: '18px',
              textAlign: 'center',
              color: '#777',
              fontSize: '12px',
            }}
          >
            Secure payment processing powered by Square.
          </p>
        </div>
      </div>
    </div>
  );
}
