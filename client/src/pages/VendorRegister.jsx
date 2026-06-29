import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VendorRegister = () => {
  const { user, token, register, applyVendor } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form Steps: 1 or 2
  const [step, setStep] = useState(1);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // Only required for new registration

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Independent Designer');
  const [taxId, setTaxId] = useState('');
  const [yearsInIndustry, setYearsInIndustry] = useState(1);
  const [philosophy, setPhilosophy] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle auto-submit if redirecting back from OTP verification
  useEffect(() => {
    const checkPendingSubmission = async () => {
      if (user && token) {
        const pendingData = localStorage.getItem('pending_vendor_application');
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData);
            localStorage.removeItem('pending_vendor_application');
            setLoading(true);
            await applyVendor({
              companyName: parsed.companyName,
              businessType: parsed.businessType,
              taxId: parsed.taxId,
              yearsInIndustry: Number(parsed.yearsInIndustry),
              philosophy: parsed.philosophy,
              phone: parsed.phone,
              fullName: user.fullName
            });
            setSuccessMessage("Account verified and Curator application submitted successfully.");
          } catch (err) {
            setError(err.message || "Failed to submit vendor details automatically");
          } finally {
            setLoading(false);
          }
        }
      }
    };
    checkPendingSubmission();
  }, [user, token, applyVendor]);

  // Sync state if user is already logged in
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (user) {
      // If logged in, proceed straight to Step 2
      setStep(2);
      return;
    }

    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all personal information fields and choose a password');
      return;
    }

    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!companyName || !businessType || !taxId || !yearsInIndustry || !philosophy) {
      setError('Please fill in all business details and brand philosophy');
      setLoading(false);
      return;
    }

    try {
      if (user) {
        // Logged in: direct submission
        await applyVendor({
          companyName,
          businessType,
          taxId,
          yearsInIndustry: Number(yearsInIndustry),
          philosophy,
          phone,
          fullName
        });
        setSuccessMessage("Your curator application has been submitted successfully and is pending admin approval.");
      } else {
        // Guest: Register account first, save business details in localStorage, verify OTP, then submit
        await register(fullName, email, password);

        // Save business info to apply post-OTP verification
        const businessData = {
          companyName,
          businessType,
          taxId,
          yearsInIndustry: Number(yearsInIndustry),
          philosophy,
          phone
        };
        localStorage.setItem('pending_vendor_application', JSON.stringify(businessData));

        // Navigate to OTP page
        navigate('/verify-otp', {
          state: {
            email,
            redirectTo: '/vendor-register'
          }
        });
      }
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // Render Status Screens for Logged-In Users
  if (user && user.vendorStatus && user.vendorStatus !== 'none' && !successMessage) {
    if (user.vendorStatus === 'pending') {
      return (
        <div className="min-h-screen bg-surface flex flex-col">
          <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 h-20 px-margin-mobile md:px-margin-desktop flex items-center justify-between">
            <Link className="font-headline-md text-headline-md tracking-widest text-primary" to="/">Lumina</Link>
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" to="/settings">Back to Settings</Link>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-2xl mx-auto space-y-8">
            <span className="material-symbols-outlined text-secondary text-8xl animate-pulse">hourglass_empty</span>
            <h1 className="font-display-lg text-4xl md:text-5xl text-primary font-light">Application Under Review</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Dear {user.fullName}, thank you for applying to become a Lumina Curator. Your application for <strong>{user.companyName || 'your atelier'}</strong> is currently under review by our design directors.
            </p>
            <p className="font-body-md text-sm text-outline">
              We review every portfolio to ensure brand alignment. You will receive an automated email notification once a decision has been reached.
            </p>
            <Link to="/settings" className="bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 hover:bg-secondary transition-colors duration-300">
              Return to Profile
            </Link>
          </main>
        </div>
      );
    }

    if (user.vendorStatus === 'approved') {
      return (
        <div className="min-h-screen bg-surface flex flex-col">
          <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 h-20 px-margin-mobile md:px-margin-desktop flex items-center justify-between">
            <Link className="font-headline-md text-headline-md tracking-widest text-primary" to="/">Lumina</Link>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-2xl mx-auto space-y-8">
            <span className="material-symbols-outlined text-emerald-600 text-8xl">verified</span>
            <h1 className="font-display-lg text-4xl md:text-5xl text-primary font-light">Welcome to the Atelier</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Your application is approved! You are registered as an official Lumina Curator.
            </p>
            <div className="pt-4">
              <Link to="/store" className="bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest px-10 py-5 hover:bg-secondary transition-colors duration-300 shadow-xl">
                Open Store Manager
              </Link>
            </div>
          </main>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-secondary-container">
      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30">
        <nav className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-container-max mx-auto h-20">
          <Link className="font-headline-md text-headline-md tracking-widest text-primary" to="/">Lumina</Link>
          {user ? (
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" to="/settings">Cancel</Link>
          ) : (
            <div className="flex items-center gap-6">
              <span className="text-sm text-on-surface-variant hidden sm:inline">Already have an account?</span>
              <Link className="font-label-caps text-label-caps text-primary border-b border-primary hover:text-secondary hover:border-secondary pb-0.5 transition-colors" to="/login">Sign In</Link>
            </div>
          )}
        </nav>
      </header>

      <main className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row">
        {/* Left: Registration Form */}
        <section className="w-full md:w-1/2 px-margin-mobile md:px-margin-desktop py-12 md:py-20 bg-surface flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">Curator Partnership</span>
                <div className="h-[1px] w-12 bg-outline-variant"></div>
              </div>
              <h1 className="font-display-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6 font-light">Become a Lumina Curator</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Join our exclusive network of master artisans and architectural firms. We curate only the finest craftsmanship for the most discerning collectors.
              </p>
            </header>

            {error && (
              <div className="mb-8 p-4 bg-error-container text-on-error-container text-sm border border-error/20">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-8 p-6 bg-secondary-container text-on-secondary-container border border-secondary/20 space-y-4">
                <p className="font-body-lg text-base">{successMessage}</p>
                <Link to="/settings" className="inline-block bg-primary text-on-primary font-label-caps text-xs py-3 px-6 hover:bg-secondary transition-colors uppercase tracking-wider">
                  Go to Settings
                </Link>
              </div>
            )}

            {!successMessage && (
              <>
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-12">
                  <div className={`h-1 flex-1 transition-all duration-500 ${step === 1 ? 'bg-primary' : 'bg-primary'}`}></div>
                  <div className={`h-1 flex-1 transition-all duration-500 ${step === 2 ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>
                  <span className="font-label-caps text-label-caps ml-4 text-on-surface-variant">
                    Step {step} of 2
                  </span>
                </div>

                <form className="space-y-12" onSubmit={handleSubmit}>
                  {/* Step 1: Personal Information */}
                  {step === 1 && (
                    <div className="space-y-8 animate-fade-in">
                      <h2 className="font-headline-md text-headline-md border-b border-outline-variant/20 pb-4">Personal Information</h2>

                      {user ? (
                        <div className="bg-surface-container-low p-6 border border-outline-variant/30 space-y-2 mb-6">
                          <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">APPLICANT PROFILE</p>
                          <p className="font-headline-md text-lg text-primary font-bold">{user.fullName}</p>
                          <p className="font-body-md text-on-surface-variant">{user.email}</p>
                          <p className="text-sm text-outline italic">You are logged in. We'll link your vendor application directly to this account.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-8">
                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="fullName">FULL NAME</label>
                            <input
                              id="fullName"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                              placeholder="Alexandre Moreau"
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group">
                              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="email">PROFESSIONAL EMAIL</label>
                              <input
                                id="email"
                                className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                                placeholder="atelier@lumina.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                            <div className="group">
                              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="phone">PHONE NUMBER</label>
                              <input
                                id="phone"
                                className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                                placeholder="+84 912 345 678"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="password">ACCOUNT PASSWORD</label>
                            <input
                              id="password"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                              placeholder="Choose password for your vendor account"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-6">
                        <button
                          className="flex-1 md:flex-none px-12 py-4 bg-primary text-on-primary font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 uppercase tracking-widest"
                          type="button"
                          onClick={handleNextStep}
                        >
                          CONTINUE TO BUSINESS DETAILS
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Business Specifics */}
                  {step === 2 && (
                    <div className="space-y-10 animate-fade-in">
                      <div className="space-y-8">
                        <h2 className="font-headline-md text-headline-md border-b border-outline-variant/20 pb-4">Business Specifics</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="companyName">COMPANY / ATELIER NAME</label>
                            <input
                              id="companyName"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                              placeholder="Moreau Architecture & Design"
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="businessType">BUSINESS TYPE</label>
                            <select
                              id="businessType"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary appearance-none cursor-pointer"
                              value={businessType}
                              onChange={(e) => setBusinessType(e.target.value)}
                            >
                              <option value="Independent Designer" className="text-primary">Independent Designer</option>
                              <option value="Furniture Manufacturer" className="text-primary">Furniture Manufacturer</option>
                              <option value="Architectural Firm" className="text-primary">Architectural Firm</option>
                              <option value="Interior Stylist" className="text-primary">Interior Stylist</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="taxId">TAX ID / VAT NUMBER</label>
                            <input
                              id="taxId"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                              placeholder="VAT123456789"
                              type="text"
                              value={taxId}
                              onChange={(e) => setTaxId(e.target.value)}
                              required
                            />
                          </div>
                          <div className="group">
                            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="yearsInIndustry">YEARS IN INDUSTRY</label>
                            <input
                              id="yearsInIndustry"
                              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary placeholder:text-outline-variant/50"
                              placeholder="5"
                              type="number"
                              min="0"
                              value={yearsInIndustry}
                              onChange={(e) => setYearsInIndustry(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8 pt-6">
                        <h2 className="font-headline-md text-headline-md border-b border-outline-variant/20 pb-4">Ethos & Philosophy</h2>
                        <div className="group">
                          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2" htmlFor="philosophy">BRAND PHILOSOPHY</label>
                          <textarea
                            id="philosophy"
                            className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary resize-none placeholder:text-outline-variant/50"
                            placeholder="Tell us about your design approach, sustainability commitments, and artisanal focus..."
                            rows="4"
                            value={philosophy}
                            onChange={(e) => setPhilosophy(e.target.value)}
                            required
                          ></textarea>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-12">
                        <button
                          className="px-8 py-4 border border-outline-variant font-label-caps text-label-caps text-primary hover:bg-surface-container-high transition-colors duration-300 uppercase tracking-widest"
                          type="button"
                          onClick={handlePrevStep}
                        >
                          PREVIOUS
                        </button>
                        <button
                          className={`flex-1 md:flex-none px-12 py-4 bg-primary text-on-primary font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 uppercase tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </section>

        {/* Right: Architectural Image Split */}
        <section className="hidden md:block w-1/2 relative overflow-hidden bg-surface-container">
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          <img
            className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-105"
            alt="Lumina Architectural Interior"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYuvbpZPvoXKcF6R9Zj7kcN3jl5vj_DElsGbfqAjkbsbMy4nwEtLZT-lpe5kpeYbT6hPWZjhbaqsPIAw3zpGHDvWoaaS9DGH6V1dGQTJSh2l-R2XEgbc7OJsVPFhr7vjD_t2s8ZvjKjTwUkoR1GN14_2dIaX8CeSkv_UxXqKVHCGHtwc2IoNP8KNMYGkXVjIEkz3_cDyWP_GjpdAVTEbGTnzq76xDBlJ69_CtjrPsztSOJKFZssPN1mXXVg28c9o8SJ54eS9jh9WTq"
          />
          {/* Floating Decorative Glass Card */}
          <div className="absolute bottom-12 left-12 right-12 p-8 md:p-12 glass-card border border-white/20 z-20">
            <p className="font-display-lg text-headline-lg text-primary mb-4 italic">
              "Design is not just what it looks like and feels like. Design is how it works."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-[1px] bg-primary"></div>
              <span className="font-label-caps text-label-caps tracking-widest uppercase">LUMINA ARTISAN ETHOS</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default VendorRegister;
