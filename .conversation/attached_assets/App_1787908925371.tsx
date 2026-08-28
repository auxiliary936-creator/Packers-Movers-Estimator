import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  calculateFare,
  createBookingRequest,
  type FareEstimate as ApiFareEstimate,
} from '@workspace/api-client-react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Calculator,
  Check,
  CircleHelp,
  Clock3,
  FileCheck2,
  IndianRupee,
  MapPin,
  MoveRight,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserRound,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function ParcelGraphic({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={compact ? 'pm-parcel-graphic pm-parcel-graphic-compact' : 'pm-parcel-graphic'}
      role="img"
      aria-label="Illustration of packed moving parcels"
    >
      <defs>
        <linearGradient id={compact ? 'parcel-top-compact' : 'parcel-top'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5c486" />
          <stop offset="1" stopColor="#e7a46f" />
        </linearGradient>
        <linearGradient id={compact ? 'parcel-front-compact' : 'parcel-front'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6653d" />
          <stop offset="1" stopColor="#c94e31" />
        </linearGradient>
      </defs>
      <ellipse cx="113" cy="159" rx="77" ry="10" fill="#242a3b" opacity=".14" />
      <g transform="translate(23 20)">
        <path d="M37 36 104 9l64 28-67 31Z" fill={`url(#${compact ? 'parcel-top-compact' : 'parcel-top'})`} stroke="#242a3b" strokeWidth="3" strokeLinejoin="round" />
        <path d="m37 36 64 32v70l-64-31Z" fill="#efb276" stroke="#242a3b" strokeWidth="3" strokeLinejoin="round" />
        <path d="m101 68 67-31v70l-67 31Z" fill={`url(#${compact ? 'parcel-front-compact' : 'parcel-front'})`} stroke="#242a3b" strokeWidth="3" strokeLinejoin="round" />
        <path d="m102 11 1 57" stroke="#242a3b" strokeWidth="3" />
        <path d="m82 19 20 9 24-10" fill="none" stroke="#fff9f1" strokeWidth="9" opacity=".85" />
        <path d="m102 74 16-7v34l-16 7Z" fill="#f5c486" stroke="#242a3b" strokeWidth="2" strokeLinejoin="round" />
        <path d="m129 67 18-8" stroke="#fff9f1" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <path d="M65 51v27" stroke="#fff9f1" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      </g>
      <g transform="translate(0 0)">
        <path d="m155 119 29-13 25 11-30 14Z" fill="#c3d5a4" stroke="#242a3b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m155 119 24 12v25l-24-11Z" fill="#a9c383" stroke="#242a3b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m179 131 30-14v25l-30 14Z" fill="#8ea657" stroke="#242a3b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m179 115 1 16" stroke="#242a3b" strokeWidth="2.5" />
        <path d="m171 118 9 4 10-5" fill="none" stroke="#fff9f1" strokeWidth="5" opacity=".9" />
      </g>
    </svg>
  );
}

function Home() {
  type PropertyId = '1bhk' | '2bhk' | '3bhk' | '4bhk';
  type Errors = {
    distance?: string;
    name?: string;
    phone?: string;
  };
  const propertyOptions: Array<{
    id: PropertyId;
    title: string;
    detail: string;
    fare: number;
    icon: typeof Boxes;
  }> = [
    { id: '1bhk', title: '1 BHK', detail: 'Essentials', fare: 3000, icon: Boxes },
    { id: '2bhk', title: '2 BHK', detail: 'Most chosen', fare: 5000, icon: Truck },
    { id: '3bhk', title: '3 BHK', detail: 'Room to settle', fare: 8000, icon: Boxes },
    { id: '4bhk', title: '4+ BHK', detail: 'The big move', fare: 12000, icon: Truck },
  ];

  const [propertyId, setPropertyId] = useState<PropertyId>('2bhk');
  const [distance, setDistance] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [estimate, setEstimate] = useState<ApiFareEstimate | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingReference, setBookingReference] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const selectedProperty = propertyOptions.find((property) => property.id === propertyId) ?? propertyOptions[1];
  const formatCurrency = (value: number) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

  const validate = () => {
    const nextErrors: Errors = {};
    if (!distance.trim() || Number(distance) <= 0) {
      nextErrors.distance = 'Enter a distance greater than 0 km.';
    }
    if (!name.trim()) {
      nextErrors.name = 'Tell us who we should address the move to.';
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCalculate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmed(false);
    setRequestError(null);
    if (!validate()) return;

    const cleanDistance = Number(distance);
    setIsCalculating(true);
    try {
      const nextEstimate = await calculateFare({
        propertyId,
        distance: cleanDistance,
      });
      setEstimate(nextEstimate);
      window.setTimeout(() => {
        document.getElementById('estimate')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    } catch {
      setEstimate(null);
      setRequestError('We couldn’t calculate that just now. Please check your connection and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!estimate || isSubmitting) return;
    if (!validate()) return;
    setRequestError(null);
    setIsSubmitting(true);
    try {
      const booking = await createBookingRequest({
        propertyId,
        distance: Number(distance),
        name: name.trim(),
        phone,
      });
      setBookingReference(booking.id);
      setConfirmed(true);
      window.setTimeout(() => {
        document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 40);
    } catch {
      setRequestError('We couldn’t save your request just now. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPropertyId('2bhk');
    setDistance('');
    setName('');
    setPhone('');
    setErrors({});
    setEstimate(null);
    setConfirmed(false);
    setBookingReference(null);
    setRequestError(null);
    document.getElementById('estimator-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mm-shell mm-noise min-h-[100dvh] overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#top" className="mm-link flex items-center gap-3" data-testid="link-home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e6653d] text-[#242a3b] shadow-[4px_4px_0_#242a3b]">
            <MoveRight size={21} strokeWidth={2.7} />
          </span>
          <span className="mm-display text-[22px] font-bold tracking-[-.06em] text-[#242a3b]">Packers &amp; Movers</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#6d6a65] md:flex" aria-label="Main navigation">
          <a href="#how-it-works" className="mm-link transition-colors hover:text-[#242a3b]" data-testid="link-how-it-works">How it works</a>
          <a href="tel:+918000123456" className="mm-link flex items-center gap-2 transition-colors hover:text-[#242a3b]" data-testid="link-call-support">
            <Phone size={15} />
            8000 123 456
          </a>
        </nav>
        <a href="#estimator-form" className="mm-button hidden items-center gap-2 rounded-full bg-[#242a3b] px-4 py-2.5 text-sm font-bold text-[#fff9f1] md:flex" data-testid="link-start-estimate">
          Start estimate <ArrowRight size={15} />
        </a>
      </header>

      <main id="top" className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-8 lg:px-12">
        <section className="grid items-center gap-12 pb-16 pt-10 md:grid-cols-[1.03fr_.97fr] md:gap-16 md:pb-24 md:pt-16 lg:gap-24">
          <div className="mm-appear max-w-[650px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9d0c0] bg-[#fff9f1] px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#6d6a65]" data-testid="status-estimator-ready">
              <span className="h-2 w-2 rounded-full bg-[#8ea657]" />
              Move planning, made lighter
            </div>
            <h1 className="mm-display max-w-[630px] text-[clamp(3.35rem,7.3vw,6.55rem)] font-semibold leading-[.92] text-[#242a3b]">
              Know the fare.<br /><span className="text-[#e6653d]">Breathe easier.</span>
            </h1>
            <p className="mt-7 max-w-[500px] text-lg leading-8 text-[#6d6a65] sm:text-xl">
              A clear, upfront moving estimate for your next address. Choose your home size, share the distance, and we’ll do the honest math.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#estimator-form" className="mm-button inline-flex items-center gap-3 rounded-full bg-[#e6653d] px-6 py-3.5 text-sm font-bold text-[#242a3b] shadow-[5px_5px_0_#242a3b]" data-testid="link-calculate-fare">
                Calculate my fare <ArrowRight size={17} />
              </a>
              <span className="flex items-center gap-2 text-sm font-semibold text-[#6d6a65]">
                <ShieldCheck size={18} className="text-[#8ea657]" />
                No hidden fees
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-[#6d6a65]">
                <Clock3 size={17} className="text-[#e6653d]" />
                Takes 2 minutes
              </span>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-5 border-t border-[#ded5c7] pt-5 text-sm text-[#6d6a65]">
              <div className="flex -space-x-2" aria-hidden="true">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f0e5] bg-[#c3d5a4] text-[10px] font-bold text-[#242a3b]">AK</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f0e5] bg-[#eab19d] text-[10px] font-bold text-[#242a3b]">RS</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f0e5] bg-[#b4d9df] text-[10px] font-bold text-[#242a3b]">MN</span>
              </div>
              <div>
                <div className="flex items-center gap-1" aria-label="Rated 4.8 out of 5">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} fill="currentColor" className="text-[#e6653d]" />)}
                  <span className="ml-1 text-xs font-bold text-[#242a3b]">4.8/5</span>
                </div>
                <span className="mt-1 block text-xs"><strong className="text-[#242a3b]">12,400+ moves</strong> planned with clarity</span>
              </div>
            </div>
          </div>

          <div className="relative mm-appear [animation-delay:.12s]">
            <div className="absolute -right-4 -top-10 h-28 w-28 rounded-full border-[14px] border-[#d6e6bd] opacity-80 sm:-right-8 sm:-top-14 sm:h-36 sm:w-36" />
            <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-[28px] bg-[#b5dce0] opacity-70 [transform:rotate(14deg)]" />
            <div className="relative overflow-hidden rounded-[30px] border border-[#d9d0c0] bg-[#fff9f1] p-5 shadow-[0_24px_60px_rgba(50,45,35,.12)] sm:p-7">
              <div className="mb-8 flex items-center justify-between">
                <div>
                   <p className="mm-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#e6653d]">Packers &amp; Movers / 01</p>
                  <p className="mt-2 text-lg font-bold text-[#242a3b]">Your move, mapped out.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf0da] text-[#6d813d]">
                  <MapPin size={21} />
                </div>
              </div>
              <div className="relative rounded-2xl bg-[#f0e9dc] p-5">
                <div className="absolute left-[29px] top-[51px] h-[68px] w-px border-l border-dashed border-[#e6653d]" />
                <div className="relative flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#242a3b] text-[#fff9f1]"><MapPin size={14} /></div>
                  <div><p className="mm-mono text-[9px] uppercase tracking-[.16em] text-[#8b8378]">Picking up from</p><p className="mt-1 text-sm font-bold text-[#242a3b]">Your current home</p></div>
                </div>
                <div className="relative mt-8 flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#e6653d] text-[#242a3b]"><MapPin size={14} /></div>
                  <div><p className="mm-mono text-[9px] uppercase tracking-[.16em] text-[#8b8378]">Heading to</p><p className="mt-1 text-sm font-bold text-[#242a3b]">A fresh start</p></div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#ded5c7] bg-[#fbf6ec] p-4">
                  <Clock3 size={17} className="text-[#e6653d]" />
                  <p className="mt-3 text-xs font-semibold text-[#8b8378]">Plan in</p>
                  <p className="mt-1 font-bold text-[#242a3b]">2 minutes</p>
                </div>
                <div className="rounded-2xl border border-[#ded5c7] bg-[#fbf6ec] p-4">
                  <IndianRupee size={17} className="text-[#6d813d]" />
                  <p className="mt-3 text-xs font-semibold text-[#8b8378]">Rate</p>
                  <p className="mt-1 font-bold text-[#242a3b]">₹30 / km</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#242a3b] px-5 py-4 text-[#fff9f1]">
                <span className="text-sm font-semibold text-[#ded9ce]">One clear number</span>
                <span className="mm-mono text-sm font-bold text-[#d6e6bd]">NO SURPRISES</span>
              </div>
               <div className="pm-parcel-float" aria-hidden="true">
                 <ParcelGraphic compact />
               </div>
            </div>
          </div>
        </section>

        <section id="estimator-form" className="scroll-mt-6 rounded-[30px] bg-[#242a3b] p-5 text-[#fff9f1] shadow-[0_20px_50px_rgba(36,42,59,.16)] sm:p-8 lg:p-12">
          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[#454b5a] pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="mm-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6653d]">Fare estimator</p>
              <h2 className="mm-display mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Let’s put a number to it.</h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#aeb2b9]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6653d] text-[#242a3b]">1</span>
              <span className="h-px w-9 bg-[#69707c]" />
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${estimate ? 'bg-[#d6e6bd] text-[#242a3b]' : 'border border-[#69707c] text-[#aeb2b9]'}`}>2</span>
              <span className="ml-1">{estimate ? 'Estimate ready' : 'Your estimate'}</span>
            </div>
          </div>

          <form onSubmit={handleCalculate} noValidate>
            <div className="grid gap-10 lg:grid-cols-[1.06fr_.94fr] lg:gap-14">
              <div>
                <fieldset>
                  <legend className="text-base font-bold text-[#fff9f1]">What are you moving from?</legend>
                  <p className="mt-1 text-sm text-[#aeb2b9]">Pick the closest fit. We’ll take care of the rest.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {propertyOptions.map(({ id, title, detail, fare, icon: Icon }) => (
                <button
                        type="button"
                        key={id}
                  className="mm-property relative rounded-2xl p-4 text-left text-[#242a3b]"
                        data-selected={propertyId === id}
                        aria-pressed={propertyId === id}
                        data-testid={`button-property-${id}`}
                        onClick={() => { setPropertyId(id); setEstimate(null); setConfirmed(false); }}
                      >
                  {propertyId === id && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#e6653d] text-[#242a3b]" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
                        <Icon size={19} className={propertyId === id ? 'text-[#e6653d]' : 'text-[#7f8c5d]'} />
                        <span className="mt-5 block text-sm font-bold">{title}</span>
                        <span className="mt-1 block text-[11px] font-semibold text-[#8b8378]">{detail}</span>
                        <span className="mm-mono mt-4 block text-[11px] font-bold text-[#e6653d]">{formatCurrency(fare)}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-9 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="distance" className="text-sm font-bold text-[#fff9f1]">Approx. distance</label>
                    <div className="relative mt-2">
                      <input
                        id="distance"
                        className="mm-input h-14 px-4 pr-14 text-base font-semibold"
                        type="number"
                        min="0.1"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="e.g. 18"
                        value={distance}
                        onChange={(event) => { setDistance(event.target.value); if (errors.distance) setErrors({ ...errors, distance: undefined }); }}
                        aria-invalid={Boolean(errors.distance)}
                        aria-describedby={errors.distance ? 'distance-error' : 'distance-help'}
                        data-testid="input-distance"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8b8378]">km</span>
                    </div>
                    <p id="distance-help" className="mt-2 text-xs text-[#aeb2b9]">City-to-city distance is perfect.</p>
                    {errors.distance && <p id="distance-error" className="mt-2 text-xs font-semibold text-[#ffb19b]" data-testid="error-distance">{errors.distance}</p>}
                  </div>
                  <div className="rounded-2xl border border-[#454b5a] bg-[#2d3343] p-4">
                    <div className="flex items-start gap-3">
                      <Calculator size={18} className="mt-0.5 text-[#d6e6bd]" />
                      <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#aeb2b9]">The simple math</p><p className="mt-2 text-sm leading-6 text-[#ded9ce]">Base fare + <span className="font-bold text-[#d6e6bd]">₹30 × km</span></p></div>
                    </div>
                  </div>
                </div>

                <div className="mt-9 border-t border-[#454b5a] pt-8">
                  <div className="flex items-center gap-3">
                    <UserRound size={19} className="text-[#e6653d]" />
                    <div><p className="text-base font-bold text-[#fff9f1]">Where should we send your plan?</p><p className="mt-1 text-sm text-[#aeb2b9]">Only used to follow up on this move.</p></div>
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="text-sm font-bold text-[#fff9f1]">Your name</label>
                      <input id="name" className="mm-input mt-2 h-14 px-4 text-base" type="text" placeholder="e.g. Ananya Rao" value={name} onChange={(event) => { setName(event.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} data-testid="input-name" />
                      {errors.name && <p id="name-error" className="mt-2 text-xs font-semibold text-[#ffb19b]" data-testid="error-name">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="text-sm font-bold text-[#fff9f1]">Mobile number</label>
                      <div className="relative mt-2">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8b8378]">+91</span>
                        <input id="phone" className="mm-input h-14 pl-14 pr-4 text-base tracking-[.04em]" type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); if (errors.phone) setErrors({ ...errors, phone: undefined }); }} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} data-testid="input-phone" />
                      </div>
                      {errors.phone && <p id="phone-error" className="mt-2 text-xs font-semibold text-[#ffb19b]" data-testid="error-phone">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div id="estimate" className="scroll-mt-8">
                {estimate ? (
                  <div className="mm-estimate overflow-hidden rounded-[24px] bg-[#fff9f1] text-[#242a3b]" data-testid="panel-estimate">
                    <div className="flex items-center justify-between border-b border-[#e4dbce] px-5 py-5 sm:px-7">
                      <div><p className="mm-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#e6653d]">Your upfront estimate</p><p className="mt-1 text-sm font-semibold text-[#6d6a65]">{selectedProperty.title} move · {estimate.distance} km</p></div>
                      <BadgeCheck size={25} className="text-[#7f9850]" />
                    </div>
                    <div className="px-5 py-7 sm:px-7">
                      <p className="text-sm font-semibold text-[#6d6a65]">Estimated moving fare</p>
                      <p className="mm-display mt-2 text-[clamp(3rem,6vw,4.75rem)] font-semibold leading-none tracking-[-.07em] text-[#242a3b]" data-testid="text-estimate-total">{formatCurrency(estimate.total)}</p>
                      <div className="mt-7 space-y-4 border-t border-dashed border-[#d9d0c0] pt-5">
                        <div className="flex items-center justify-between text-sm"><span className="text-[#6d6a65]">{selectedProperty.title} base fare</span><span className="mm-mono font-bold">{formatCurrency(estimate.baseFare)}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-[#6d6a65]">Distance · ₹30 × {estimate.distance} km</span><span className="mm-mono font-bold">{formatCurrency(estimate.travelFare)}</span></div>
                        <div className="mm-route-line h-px opacity-50" />
                        <div className="flex items-center justify-between text-base font-bold"><span>Total estimate</span><span className="mm-mono text-[#e6653d]" data-testid="text-breakdown-total">{formatCurrency(estimate.total)}</span></div>
                      </div>
                      <div className="mt-6 flex gap-3 rounded-2xl bg-[#eaf0da] p-4 text-sm leading-6 text-[#4b5931]">
                        <ShieldCheck size={18} className="mt-1 shrink-0" />
                         <span>That’s your clear starting point. A Packers &amp; Movers expert will confirm the final details with you.</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#6d813d]">
                        <Clock3 size={14} />
                        Most customers hear from us within 10 minutes
                      </div>
                       {requestError && (
                         <div className="mt-5 rounded-2xl border border-[#efb19f] bg-[#fff0e9] p-4 text-sm font-semibold leading-6 text-[#a44227]" role="alert" data-testid="error-request">
                           {requestError}
                         </div>
                       )}
                      {!confirmed ? (
                        <div className="mt-7 space-y-3">
                           <button type="button" onClick={handleConfirm} disabled={isSubmitting} className="mm-button flex w-full items-center justify-center gap-2 rounded-full bg-[#e6653d] px-5 py-4 text-sm font-bold text-[#242a3b] shadow-[4px_4px_0_#242a3b] disabled:cursor-wait disabled:opacity-70" data-testid="button-confirm-booking">
                             {isSubmitting ? 'Sending request…' : 'Confirm booking request'} <ArrowRight size={17} />
                           </button>
                           <button type="button" onClick={() => { setEstimate(null); setConfirmed(false); setRequestError(null); }} disabled={isSubmitting} className="mm-button flex w-full items-center justify-center gap-2 rounded-full border border-[#d9d0c0] px-5 py-3 text-sm font-bold text-[#6d6a65] hover:bg-[#f0e9dc] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-edit-estimate">Edit estimate</button>
                        </div>
                      ) : (
                        <div id="confirmation" className="mm-confirmation mt-7 rounded-2xl bg-[#242a3b] p-5 text-[#fff9f1]" data-testid="panel-confirmation">
                          <div className="mm-check flex h-10 w-10 items-center justify-center rounded-full bg-[#d6e6bd] text-[#242a3b]"><Check size={22} strokeWidth={3} /></div>
                          <p className="mt-4 text-lg font-bold">You’re on your way, {name.split(' ')[0]}.</p>
                           <p className="mt-2 text-sm leading-6 text-[#c6c8cc]">Request <span className="font-bold text-[#d6e6bd]">#{bookingReference}</span> is noted. We’ll call <span className="font-bold text-[#fff9f1]">+91 {phone}</span> shortly to line up the next step.</p>
                          <button type="button" onClick={handleReset} className="mm-button mt-5 flex items-center gap-2 text-sm font-bold text-[#d6e6bd]" data-testid="button-start-new-move">Plan another move <RotateCcw size={15} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[450px] flex-col justify-between rounded-[24px] border border-dashed border-[#586071] bg-[#2d3343] p-6 sm:p-8" data-testid="panel-estimate-empty">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#596378] bg-[#353c4d] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#d6e6bd]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d6e6bd]" />
                        No commitment needed
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3d4556] text-[#d6e6bd]"><IndianRupee size={23} /></div>
                      <p className="mm-display mt-6 max-w-[300px] text-4xl font-semibold leading-[.98] tracking-[-.06em] text-[#fff9f1]">Your estimate will land right here.</p>
                      <p className="mt-5 max-w-[320px] text-sm leading-6 text-[#aeb2b9]">No waiting, no mysterious quote forms. Add your details and we’ll show the fare in one clear view.</p>
                    </div>
                    <div className="mt-10">
                      <div className="mb-3 flex items-center justify-between text-xs font-bold text-[#aeb2b9]"><span>Before you calculate</span><span className="mm-mono text-[#d6e6bd]">01 / 02</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#454b5a]"><div className="h-full w-1/2 rounded-full bg-[#e6653d]" /></div>
                       <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#d6e6bd]"><CircleHelp size={15} /> Your information stays with Packers &amp; Movers.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
             <button type="submit" disabled={isCalculating || isSubmitting} className="mm-button mt-10 flex w-full items-center justify-center gap-3 rounded-full bg-[#d6e6bd] px-6 py-4 text-sm font-bold text-[#242a3b] shadow-[4px_4px_0_#131722] disabled:cursor-wait disabled:opacity-70 sm:mx-auto sm:w-auto sm:min-w-[255px]" data-testid="button-calculate-estimate">
               <Calculator size={18} /> {isCalculating ? 'Calculating fare…' : estimate ? 'Recalculate fare' : 'Show my estimate'} <ArrowRight size={17} />
            </button>
          </form>
        </section>

        <section id="how-it-works" className="scroll-mt-8 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="mm-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6653d]">How it works</p>
              <h2 className="mm-display mt-4 max-w-[430px] text-5xl font-semibold leading-[.95] tracking-[-.06em] text-[#242a3b] sm:text-6xl">A little less moving-day fog.</h2>
              <p className="mt-6 max-w-[380px] text-base leading-7 text-[#6d6a65]">We make the first decision easy, so you can spend your energy on the hundred other things a move asks of you.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { number: '01', icon: Calculator, title: 'Tell us the basics', copy: 'Home size and distance. That’s all we need for a useful first number.' },
                { number: '02', icon: FileCheck2, title: 'See the full math', copy: 'Base fare and travel cost, separated clearly. Nothing tucked away.' },
                { number: '03', icon: BadgeCheck, title: 'Request your move', copy: 'Confirm when it feels right. A real person takes it from there.' },
              ].map(({ number, icon: Icon, title, copy }) => (
                <div key={number} className="rounded-[22px] border border-[#d9d0c0] bg-[#fff9f1] p-5 sm:p-6" data-testid={`card-step-${number}`}>
                  <div className="flex items-center justify-between"><span className="mm-mono text-[11px] font-bold text-[#e6653d]">{number}</span><Icon size={21} className="text-[#7f9850]" /></div>
                  <h3 className="mt-12 text-lg font-bold text-[#242a3b]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6d6a65]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid overflow-hidden rounded-[28px] bg-[#d6e6bd] md:grid-cols-[1fr_auto]">
          <div className="p-7 sm:p-10 lg:p-12">
            <Sparkles size={23} className="text-[#e6653d]" />
            <h2 className="mm-display mt-5 max-w-[530px] text-4xl font-semibold leading-[.98] tracking-[-.06em] text-[#242a3b] sm:text-5xl">A good move starts with a good plan.</h2>
            <p className="mt-5 max-w-[520px] text-base leading-7 text-[#4d5b35]">Keep this estimate handy. When you’re ready, our moving team will help turn it into a day that runs on time.</p>
            <a href="#estimator-form" className="mm-button mt-8 inline-flex items-center gap-2 rounded-full bg-[#242a3b] px-5 py-3 text-sm font-bold text-[#fff9f1]" data-testid="link-plan-move">Plan my move <ArrowRight size={16} /></a>
          </div>
           <div className="relative hidden min-h-[250px] w-[280px] items-end justify-center overflow-hidden bg-[#b5dce0] md:flex">
             <div className="absolute inset-x-0 bottom-0 flex justify-center">
               <ParcelGraphic />
             </div>
             <div className="absolute right-7 top-10 h-14 w-14 rounded-full border-4 border-[#fff9f1] opacity-70" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ded5c7]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-5 py-7 text-sm text-[#6d6a65] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
           <div className="flex items-center gap-2 font-bold text-[#242a3b]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6653d]"><MoveRight size={15} /></span>Packers &amp; Movers</div>
          <p data-testid="text-footer-note">Clearer moves across India, one estimate at a time.</p>
          <a href="tel:+918000123456" className="mm-link flex items-center gap-2 font-bold text-[#242a3b]" data-testid="link-footer-support"><Phone size={15} /> 8000 123 456</a>
        </div>
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
