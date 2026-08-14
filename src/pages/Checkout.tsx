import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Square?: any;
  }
}

export default function Checkout() {
  const cardRef = useRef<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const checkout = location.state as
    | {
        paymentType?: 'appointment' | 'membership';

        appointmentId?: string;
        subscriptionId?: string;

        amount: number;
        serviceName: string;
        servicePrice: number;

        vehicleName?: string;
        vehicleExtra?: number;

        addOns?: {
          name: string;
          price: number;
        }[];
      }
    | undefined;

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
            script!.onerror = () =>
              reject(new Error('Square failed to load.'));
          });
        } else if (!window.Square) {
          await new Promise<void>((resolve) => {
            script!.addEventListener('load', () => resolve(), {
              once: true,
            });
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
      cardRef.current?.destroy?.();
    };
  }, []);

  const handlePayment = async () => {
  if (!checkout) {
    setError('Checkout information is missing.');
    return;
  }

  if (!cardRef.current) {
    setError('Payment form is not ready.');
    return;
  }

  setPaying(true);
  setError('');

  try {
    // Securely tokenize the card with Square
    const tokenResult = await cardRef.current.tokenize();

    if (tokenResult.status !== 'OK' || !tokenResult.token) {
      throw new Error(
        tokenResult.errors?.[0]?.message ||
          'Unable to verify your card.'
      );
    }

    // =========================================
    // MEMBERSHIP
    // =========================================
    if (checkout.paymentType === 'membership') {
      if (!checkout.subscriptionId) {
        throw new Error('Membership information is missing.');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User session was not found.');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error: membershipError } =
        await supabase.functions.invoke('setup-square-membership', {
          body: {
            sourceId: tokenResult.token,
            planName: checkout.serviceName.replace(' Membership', ''),
            email: user.email,
            fullName: profile?.full_name ?? 'North Splash Customer',
          },
        });

      if (membershipError) {
        throw membershipError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error || 'Unable to activate membership.'
        );
      }

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',

          square_customer_id: data.squareCustomerId,
          square_card_id: data.squareCardId,
          square_subscription_id: data.squareSubscriptionId,
          square_plan_variation_id: data.planVariationId,
        })
        .eq('id', checkout.subscriptionId);

      if (subscriptionError) {
        throw subscriptionError;
      }

      navigate('/portal', {
        replace: true,
        state: {
          paymentSuccess: true,
          membershipSuccess: true,
        },
      });

      return;
    }

    // =========================================
    // NORMAL APPOINTMENT PAYMENT
    // =========================================

    if (!checkout.appointmentId) {
      throw new Error('Appointment information is missing.');
    }

    const { data, error: paymentError } =
      await supabase.functions.invoke('process-square-payment', {
        body: {
          sourceId: tokenResult.token,
          amount: checkout.amount,
          appointmentId: checkout.appointmentId,
        },
      });

    if (paymentError) {
      throw paymentError;
    }

    if (!data?.success) {
      throw new Error(
        data?.error || 'Payment could not be completed.'
      );
    }

    const { error: paymentRecordError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
      })
      .eq('appointment_id', checkout.appointmentId);

    if (paymentRecordError) {
      throw paymentRecordError;
    }

    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({
        status: 'confirmed',
      })
      .eq('id', checkout.appointmentId);

    if (appointmentError) {
      throw appointmentError;
    }

    navigate('/portal', {
      replace: true,
      state: {
        paymentSuccess: true,
      },
    });
  } catch (err) {
    console.error('Payment error:', err);

    setError(
      err instanceof Error
        ? err.message
        : 'Payment failed. Please try again.'
    );

    setPaying(false);
  }
};

  if (!checkout) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#090909',
          color: '#fff',
          padding: '40px 20px',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1>No checkout found</h1>

          <p style={{ color: '#999' }}>
            Return to your portal and start your booking again.
          </p>

          <Link to="/portal" style={{ color: '#c9a96e' }}>
            Return to portal
          </Link>
        </div>
      </div>
    );
  }

  const addOns = checkout.addOns ?? [];
  const vehicleExtra = checkout.vehicleExtra ?? 0;

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
          maxWidth: '760px',
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
          <div style={{ marginBottom: '30px' }}>
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
            {checkout.paymentType === 'membership'
              ? 'Complete your membership payment securely with Square.'
              : 'Review your service and complete your payment securely with Square.'}
          </p>

          {/* ORDER SUMMARY */}
          <div
            style={{
              background: '#0b0b0b',
              border: '1px solid #242424',
              borderRadius: '12px',
              padding: '22px',
              marginBottom: '28px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Order Summary</h3>

            <OrderRow
              name={checkout.serviceName}
              price={checkout.servicePrice}
            />

            {vehicleExtra > 0 && (
              <OrderRow
                name={`${checkout.vehicleName} Vehicle Upgrade`}
                price={vehicleExtra}
              />
            )}

            {addOns.map(addOn => (
              <OrderRow
                key={addOn.name}
                name={addOn.name}
                price={addOn.price}
              />
            ))}

            <div
              style={{
                borderTop: '1px solid #333',
                marginTop: '16px',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              <span>Total</span>

              <span style={{ color: '#c9a96e' }}>
                ${checkout.amount.toFixed(2)}
              </span>
            </div>
          </div>

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
                border: '1px solid #5a2020',
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
            onClick={handlePayment}
            disabled={loading || paying}
            style={{
              width: '100%',
              padding: '16px',
              background: '#c9a96e',
              border: 'none',
              borderRadius: '8px',
              color: '#090909',
              fontSize: '15px',
              fontWeight: 700,
              cursor: paying ? 'not-allowed' : 'pointer',
              opacity: paying ? 0.7 : 1,
            }}
          >
            {paying
              ? 'Processing Payment...'
              : `Pay $${checkout.amount.toFixed(2)}`}
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

function OrderRow({
  name,
  price,
}: {
  name: string;
  price: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        padding: '9px 0',
        color: '#ddd',
      }}
    >
      <span>{name}</span>
      <strong>${price.toFixed(2)}</strong>
    </div>
  );
}
