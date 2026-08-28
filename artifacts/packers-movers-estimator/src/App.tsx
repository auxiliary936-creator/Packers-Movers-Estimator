import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  CircleHelp,
  CreditCard,
  Home as HomeIcon,
  IndianRupee,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Truck,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type HomeSize = '1 BHK' | '2 BHK' | '3 BHK' | '4+ BHK';
type PaymentMethod = 'debit' | 'credit' | 'upi';

const homeOptions: Array<{ value: HomeSize; note: string; icon: typeof HomeIcon }> = [
  { value: '1 BHK', note: 'Compact move', icon: HomeIcon },
  { value: '2 BHK', note: 'Most popular', icon: HomeIcon },
  { value: '3 BHK', note: 'Family move', icon: HomeIcon },
  { value: '4+ BHK', note: 'Larger home', icon: HomeIcon },
];

const baseFares: Record<HomeSize, number> = {
  '1 BHK': 4500,
  '2 BHK': 6500,
  '3 BHK': 8500,
  '4+ BHK': 11500,
};

const paymentOptions: Array<{
  value: PaymentMethod;
  label: string;
  note: string;
  icon: typeof CreditCard;
}> = [
  { value: 'debit', label: 'Debit card', note: 'Visa, Mastercard', icon: CreditCard },
  { value: 'credit', label: 'Credit card', note: 'Visa, Mastercard', icon: CreditCard },
  { value: 'upi', label: 'UPI', note: 'GPay, PhonePe, more', icon: Smartphone },
];

const formatRupees = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

function Progress({ step }: { step: number }) {
  const labels = ['Your move', 'Your details', 'Your estimate'];
  return (
    <div className="progress-track" aria-label={`Step ${step} of 3`}>
      {labels.map((label, index) => {
        const itemStep = index + 1;
        const isDone = itemStep < step;
        const isActive = itemStep === step;
        return (
          <div className="progress-step-wrap" key={label} style={{ display: 'contents' }}>
            <div className={`progress-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <span className="progress-dot">{isDone ? <Check size={13} strokeWidth={3} /> : itemStep}</span>
              <span>{label}</span>
            </div>
            {index < labels.length - 1 && <div className="progress-connector" />}
          </div>
        );
      })}
    </div>
  );
}

function Estimator() {
  const [step, setStep] = useState(1);
  const [homeSize, setHomeSize] = useState<HomeSize | ''>('');
  const [distance, setDistance] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  const estimate = useMemo(() => {
    if (!homeSize || !distance) return null;
    const km = Number(distance);
    const base = baseFares[homeSize];
    return { base, travel: km * 30, total: base + km * 30, km };
  }, [homeSize, distance]);

  const goToDetails = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!homeSize) nextErrors.homeSize = 'Choose the size of your home.';
    const km = Number(distance);
    if (!distance || !Number.isFinite(km) || km < 1 || km > 5000) {
      nextErrors.distance = 'Enter a distance between 1 and 5,000 km.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep(2);
  };

  const goToEstimate = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) nextErrors.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      nextErrors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep(3);
  };

  const confirmBooking = () => {
    const generated = `PAK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setReference(generated);
    setConfirmed(true);
  };

  const copyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => {
    setStep(1);
    setConfirmed(false);
    setReference('');
    setCopied(false);
    setPaymentMethod('upi');
    setErrors({});
  };

  return (
    <div className="estimator-card fade-in fade-delay" id="estimate">
      <div className="card-kicker">The simple moving quote</div>
      <h2 className="card-title">{confirmed ? 'Your move is on its way' : 'Let’s price your move'}</h2>
      <p className="card-subtitle">
        {confirmed
          ? 'We have saved your request. A moving partner will call you shortly to confirm the details.'
          : 'A transparent starting estimate, in less than a minute.'}
      </p>

      {!confirmed && <Progress step={step} />}

      {confirmed ? (
        <div className="success-state" role="status" aria-live="polite">
          <div className="success-mark"><BadgeCheck size={31} strokeWidth={1.8} /></div>
          <h3 className="success-title">Thanks, {name.split(' ')[0]}.</h3>
          <p className="success-copy">Your request is safely with our moving team. Keep this reference handy.</p>
          <div className="success-payment">
            <span className="success-payment-label">Payment preference</span>
            <strong>{paymentOptions.find((option) => option.value === paymentMethod)?.label}</strong>
          </div>
          <div className="reference-box">
            <span className="reference-label">Request reference</span>
            <span className="reference-value" data-testid="text-booking-reference">{reference}</span>
          </div>
          <button className="secondary-btn" type="button" onClick={copyReference} data-testid="button-copy-reference">
            {copied ? <Check size={15} /> : <Box size={15} />}
            {copied ? 'Copied' : 'Copy reference'}
          </button>
          <button className="back-btn" type="button" onClick={reset} data-testid="button-start-another">
            <RotateCcw size={13} /> Start another estimate
          </button>
        </div>
      ) : (
        <>
          {step === 1 && (
            <form onSubmit={goToDetails} noValidate>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="form-label">What are you moving? <span className="required">*</span></legend>
                <div className="home-options" role="radiogroup" aria-label="Home size">
                  {homeOptions.map(({ value, note, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      className={`home-option ${homeSize === value ? 'selected' : ''}`}
                      onClick={() => {
                        setHomeSize(value);
                        setErrors((current) => ({ ...current, homeSize: '' }));
                      }}
                      aria-pressed={homeSize === value}
                      data-testid={`button-home-size-${value.replace('+', 'plus').replace(' ', '-').toLowerCase()}`}
                    >
                      <Icon size={19} strokeWidth={1.7} />
                      <strong>{value}</strong>
                      <small>{note}</small>
                    </button>
                  ))}
                </div>
                {errors.homeSize && <span className="error-text" role="alert">{errors.homeSize}</span>}
              </fieldset>
              <div className="field-group">
                <label className="form-label" htmlFor="distance">Approximate distance <span className="required">*</span></label>
                <div className="input-wrap">
                  <input
                    className={`form-input with-prefix ${errors.distance ? 'invalid' : ''}`}
                    id="distance"
                    type="number"
                    min="1"
                    max="5000"
                    inputMode="numeric"
                    placeholder="For example, 680"
                    value={distance}
                    onChange={(event) => {
                      setDistance(event.target.value);
                      setErrors((current) => ({ ...current, distance: '' }));
                    }}
                    aria-describedby="distance-help"
                    data-testid="input-distance"
                  />
                  <span className="input-prefix">km</span>
                </div>
                {errors.distance ? <span className="error-text" role="alert">{errors.distance}</span> : <span className="helper-text" id="distance-help">From pickup address to delivery address.</span>}
              </div>
              <button className="primary-btn" type="submit" data-testid="button-continue-details">
                Add your details <ArrowRight size={17} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={goToEstimate} noValidate>
              <div className="field-group" style={{ marginTop: 0 }}>
                <label className="form-label" htmlFor="name">Your name <span className="required">*</span></label>
                <div className="input-wrap">
                  <input
                    className={`form-input ${errors.name ? 'invalid' : ''}`}
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({ ...current, name: '' }));
                    }}
                    data-testid="input-name"
                  />
                </div>
                {errors.name && <span className="error-text" role="alert">{errors.name}</span>}
              </div>
              <div className="field-group">
                <label className="form-label" htmlFor="mobile">Mobile number <span className="required">*</span></label>
                <div className="input-wrap">
                  <span className="input-prefix">+91</span>
                  <input
                    className={`form-input with-prefix ${errors.mobile ? 'invalid' : ''}`}
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(event) => {
                      setMobile(event.target.value.replace(/\D/g, '').slice(0, 10));
                      setErrors((current) => ({ ...current, mobile: '' }));
                    }}
                    aria-describedby="mobile-help"
                    data-testid="input-mobile"
                  />
                </div>
                {errors.mobile ? <span className="error-text" role="alert">{errors.mobile}</span> : <span className="helper-text" id="mobile-help">We’ll only use this for your moving request.</span>}
              </div>
              <button className="primary-btn" type="submit" data-testid="button-see-estimate">
                See my estimate <ArrowRight size={17} />
              </button>
              <button className="back-btn" type="button" onClick={() => setStep(1)} data-testid="button-back-to-move">
                <ArrowLeft size={13} /> Back to move details
              </button>
            </form>
          )}

          {step === 3 && estimate && (
            <div>
              <div className="details-grid">
                <div><span className="helper-text">Home size</span><strong data-testid="text-selected-home">{homeSize}</strong></div>
                <div><span className="helper-text">Distance</span><strong data-testid="text-selected-distance">{estimate.km.toLocaleString('en-IN')} km</strong></div>
              </div>
              <div className="estimate-box" data-testid="display-estimate">
                <div className="estimate-top">
                  <div>
                    <div className="estimate-label">Estimated starting fare</div>
                    <div className="estimate-total" data-testid="text-total-fare">{formatRupees(estimate.total)}</div>
                  </div>
                  <span className="estimate-badge">No hidden fees</span>
                </div>
                <div className="breakdown">
                  <div className="breakdown-row"><span>{homeSize} base fare</span><strong data-testid="text-base-fare">{formatRupees(estimate.base)}</strong></div>
                  <div className="breakdown-row"><span>Travel · {estimate.km} km × ₹30</span><strong data-testid="text-travel-fare">{formatRupees(estimate.travel)}</strong></div>
                </div>
              </div>
              <p className="helper-text" style={{ marginTop: 14 }}>This is a starting estimate. Your final quote may vary for stairs, lifts, or special items.</p>
              <fieldset className="payment-fieldset">
                <legend className="form-label">Preferred payment method</legend>
                <p className="helper-text payment-helper">Choose how you’d prefer to pay when your move is confirmed.</p>
                <div className="payment-options" role="radiogroup" aria-label="Preferred payment method">
                  {paymentOptions.map(({ value, label, note, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      className={`payment-option ${paymentMethod === value ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(value)}
                      aria-pressed={paymentMethod === value}
                      data-testid={`button-payment-${value}`}
                    >
                      <span className="payment-icon"><Icon size={17} strokeWidth={1.8} /></span>
                      <span className="payment-copy">
                        <strong>{label}</strong>
                        <small>{note}</small>
                      </span>
                      <span className="payment-check" aria-hidden="true">{paymentMethod === value ? <Check size={13} strokeWidth={3} /> : null}</span>
                    </button>
                  ))}
                </div>
                <span className="payment-note">No payment is processed at this stage.</span>
              </fieldset>
              <button className="primary-btn" type="button" onClick={confirmBooking} data-testid="button-confirm-booking">
                Confirm booking request <Check size={17} />
              </button>
              <button className="back-btn" type="button" onClick={() => setStep(2)} data-testid="button-edit-details">
                <ArrowLeft size={13} /> Edit my details
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" data-testid="link-brand">
          <span className="brand-mark"><Truck size={21} strokeWidth={1.8} /></span>
          <span className="brand-name">pack<span>ers</span><em>wise</em></span>
        </a>
        <div className="header-note"><ShieldCheck size={15} /> Trusted moving partners across India</div>
      </header>

      <main className="page-main">
        <section className="intro-grid" aria-labelledby="hero-title">
          <div className="fade-in">
            <div className="eyebrow"><span className="eyebrow-line" /> Moving day, made lighter</div>
            <h1 className="hero-title" id="hero-title">A calmer way <span>to move home.</span></h1>
            <p className="hero-copy">Get a clear starting fare for your household move in under a minute. No phone calls, no guesswork — just a plan you can feel good about.</p>
            <div className="trust-row">
              <span className="trust-item"><BadgeCheck size={16} /> Verified partners</span>
              <span className="trust-item"><IndianRupee size={16} /> Transparent pricing</span>
            </div>
          </div>
          <Estimator />
        </section>

        <section className="story-strip" id="how-it-works" aria-labelledby="how-title">
          <div className="story-card">
            <span className="story-label">How it works</span>
            <h2 className="story-title" id="how-title">Three small steps.<br />One less thing to worry about.</h2>
            <ul className="service-list">
              <li><Check size={16} /><span><strong>Tell us about your home.</strong><br />Choose your home size and enter the distance.</span></li>
              <li><Check size={16} /><span><strong>See the numbers clearly.</strong><br />Base fare plus ₹30 for every kilometre.</span></li>
              <li><Check size={16} /><span><strong>Leave the calling to us.</strong><br />Confirm your request and our partner calls you.</span></li>
            </ul>
          </div>
          <div className="story-card dark-card">
            <span className="story-label">A better moving day</span>
            <h2 className="story-title">Packed with<br />peace of mind.</h2>
            <p>Moving is already a lot of lists and little decisions. We keep the first one simple, so you can focus on the life waiting at the other end.</p>
            <div className="mini-service"><ShieldCheck size={16} /> <span>Vetted, local moving teams</span></div>
            <div className="mini-service"><Sparkles size={16} /> <span>A human follow-up, not a sales pitch</span></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Packerswise · A simpler start to your next address.</span>
        <span><CircleHelp size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Questions? <a className="footer-link" href="tel:+918000123456" data-testid="link-call-support">Talk to our team</a></span>
      </footer>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
