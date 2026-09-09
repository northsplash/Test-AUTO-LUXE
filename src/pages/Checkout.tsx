import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sendCommunication } from '@/lib/communications';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { MARKET } from '@/lib/market';
import { trackPageView } from '@/lib/auth';

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
    trackPageView('/checkout').catch(() => {});
  }, []);

  useEffect(() => {
    if (!checkout) {
      setLoading(false);
      return;
    }

    const loadSquare = async () => {
      try {
        const applicationId =
          import.meta.env.VITE_SQUARE_APPLICATION_ID;

        const locationId =
          import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!applicationId || !locationId) {
          setError(`Card checkout is not connected yet. Book from the site and we will confirm by phone at ${MARKET.phone}.`);
          setLoading(false);
          return;
        }

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
  }, [checkout]);

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

      navigate('/', {
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

    const { data: apptForEmail } = await supabase
      .from('appointments')
      .select('customer_name,customer_email,scheduled_at,service_name,user_id')
      .eq('id', checkout.appointmentId)
      .maybeSingle();
    let recipient = apptForEmail?.customer_email || '';
    if (!recipient && apptForEmail?.user_id) {
      const { data: customer } = await supabase.from('profiles').select('email,full_name').eq('id', apptForEmail.user_id).maybeSingle();
      recipient = customer?.email || '';
      if (recipient) apptForEmail.customer_name = apptForEmail.customer_name || customer?.full_name || 'Customer';
    }
    if (recipient) {
      sendCommunication('booking_confirmed', {
        appointment_id: checkout.appointmentId,
        recipient_email: recipient,
        variables: {
          customer_name: apptForEmail?.customer_name || 'Customer',
          service_name: apptForEmail?.service_name || checkout.serviceName,
          appointment_date: apptForEmail?.scheduled_at ? new Date(apptForEmail.scheduled_at).toLocaleDateString('en-US') : '',
          appointment_time: apptForEmail?.scheduled_at ? new Date(apptForEmail.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        },
      }).catch(console.warn);
    }

    navigate('/', {
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
  } finally {
    setPaying(false);
  }
};

  if (!checkout) {
    return (
      <div className="luxe-checkout">
        <Navigation />
        <main id="main" className="luxe-checkout-main">
          <section className="luxe-checkout-card">
            <p className="eyebrow">SECURE CHECKOUT</p>
            <h1>No booking to complete</h1>
            <p>Start from the detailing site, choose a service, and we will bring you back here to pay. Or call {MARKET.phone} to book by phone.</p>
            <Link className="btn-white" to={{ pathname: '/', hash: 'booking' }}>Book a detail</Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const addOns = checkout.addOns ?? [];
  const vehicleExtra = checkout.vehicleExtra ?? 0;

  return (
    <div className="luxe-checkout">
      <Navigation />
      <main id="main" className="luxe-checkout-main">
        <section className="luxe-checkout-card">
          <img className="luxe-checkout-mark" src="/ns-auto-luxe-full-logo.png" alt="North Splash Auto Luxe" />
          <p className="eyebrow">NORTH SPLASH AUTO LUXE</p>
          <h1>Secure Checkout</h1>
          <p>
            {checkout.paymentType === 'membership'
              ? 'Complete your membership payment securely with Square.'
              : 'Review your service and complete payment. Card details never touch our servers.'}
          </p>

          <div className="luxe-checkout-summary">
            <h3>Order summary</h3>
            <OrderRow name={checkout.serviceName} price={checkout.servicePrice} />
            {vehicleExtra > 0 && (
              <OrderRow name={`${checkout.vehicleName} vehicle upgrade`} price={vehicleExtra} />
            )}
            {addOns.map(addOn => (
              <OrderRow key={addOn.name} name={addOn.name} price={addOn.price} />
            ))}
            <div className="luxe-checkout-total">
              <span>Total</span>
              <strong>${checkout.amount.toFixed(2)}</strong>
            </div>
          </div>

          {loading && <p className="luxe-checkout-loading">Loading the secure payment form…</p>}
          {error && <div className="luxe-checkout-error" role="alert">{error}</div>}
          <div id="card-container" className="luxe-checkout-card-box" />

          <button
            className="btn-white btn-full"
            type="button"
            onClick={handlePayment}
            disabled={loading || paying}
          >
            {paying ? 'Processing payment…' : `Pay $${checkout.amount.toFixed(2)}`}
          </button>
          <p className="luxe-checkout-fine">Secure payment processing powered by Square.</p>
          <Link className="luxe-checkout-back" to="/">Back to the site</Link>
        </section>
      </main>
      <Footer />
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
    <div className="luxe-checkout-row">
      <span>{name}</span>
      <strong>${price.toFixed(2)}</strong>
    </div>
  );
}
