import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSwatch, setActiveSwatch] = useState('Cream');
  const [adding, setAdding] = useState(false);

  const { token } = useContext(AuthContext);

  const handleAddToCart = async () => {
    if (!token) {
      toast.error('Please log in to add to cart');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await api('/cart', {
        method: 'POST',
        body: { itemId: id, quantity: 1 }
      });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api(`/items/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream text-on-surface-variant">
        <p className="font-light tracking-widest uppercase font-label-caps">Loading Product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-cream">
        <p className="text-error-red font-headline-md mb-4">{error || 'Product not found.'}</p>
        <button onClick={() => navigate(-1)} className="bg-primary text-on-primary py-3 px-8 font-label-caps uppercase tracking-widest">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-cream text-on-surface font-body-md selection:bg-primary selection:text-white">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant z-50">
        <nav className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-12">
            <Link className="font-display-lg text-headline-md tracking-tighter text-primary" to="/">Lumina</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link className="font-label-caps text-label-caps tracking-widest text-on-surface-variant hover:text-primary transition-colors" to="/">Home</Link>
            {token && (
              <>
                <Link className="font-label-caps text-label-caps tracking-widest text-on-surface-variant hover:text-primary transition-colors" to="/cart">Cart</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-80px)]">
          {/* Product Image */}
          <div className="lg:col-span-7 bg-surface-container-low overflow-hidden relative group">
            <img
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              src={product.image || "https://lh3.googleusercontent.com/aida/AP1WRLtsYoBL8I3wlWpyJs7mzVkJF5uWuIogTZzMFwjPHN3p8eddEFRSQsVWacYL7xIGegczapJYU5PT4GzJGeZMOUR8TPi0A7cDRmo2GG2C2ICILZ-xogzEmkrR5eVL39T-cncCM9fILsX1JmYNy2Uzpz-I0Qz3DCWNxuOor6Ox9z7DcvY5JadAfdM64phEvKOwXqmwasL5E25Y7FbCF58c-_ZGT48imlkvXggXomTBK-sMVqUlI4wQC1q25QQX"}
            />
            <div className="absolute bottom-10 left-10 hidden lg:block">
              <span className="font-label-caps text-label-caps text-on-surface/40">FIG. 01 — {(product.category || '').toUpperCase()}</span>
            </div>
          </div>
          {/* Product Info */}
          <div className="lg:col-span-5 px-margin-mobile md:px-margin-desktop py-12 lg:py-24 flex flex-col justify-center">
            <nav className="flex gap-2 text-on-surface-variant font-label-caps text-label-caps mb-8">
              <span>Collections</span>
              <span>/</span>
              <span>{product.category}</span>
            </nav>
            <h1 className="font-display-lg text-display-lg mb-4 text-primary">{product.name}</h1>
            <p className="font-headline-md text-headline-md text-secondary mb-8">{product.price.toLocaleString()} đ</p>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-md leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
            {/* Customization */}
            <div className="mb-12">
              <h3 className="font-label-caps text-label-caps mb-6 text-on-surface-variant uppercase tracking-widest">Customization — Finish</h3>
              <div className="flex gap-6 items-center" id="fabric-selection">
                {['Cream', 'Charcoal', 'Sand'].map((swatch) => (
                  <div key={swatch} className="group cursor-pointer text-center" onClick={() => setActiveSwatch(swatch)}>
                    <div className={`w-12 h-12 rounded-full border border-outline-variant transition-all duration-300 ${activeSwatch === swatch ? 'outline outline-1 outline-black outline-offset-4' : 'hover:scale-110'} ${swatch === 'Cream' ? 'bg-[#FAF9F5]' : swatch === 'Charcoal' ? 'bg-[#444748]' : 'bg-[#D2B48C]'}`} title={swatch}></div>
                    <span className={`font-label-caps text-[10px] mt-2 block transition-opacity duration-300 ${activeSwatch === swatch ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'}`}>{swatch.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="bg-primary text-on-primary py-4 px-12 font-label-caps text-label-caps uppercase tracking-widest hover:bg-on-surface-variant transition-colors flex-1 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
              {product.model3d && (
                <Link to={`/room-builder?productId=${product._id}`} className="border border-outline py-4 px-12 font-label-caps text-label-caps uppercase tracking-widest hover:bg-surface-container transition-colors flex-1 text-center">
                  View Showroom
                </Link>
              )}
            </div>
            <div className="border-t border-outline-variant pt-8">
              <div className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined">local_shipping</span>
                <span className="font-body-md text-body-md">White glove delivery available (4-6 weeks)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="py-32 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
          <div className="max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="font-display-lg text-display-lg mb-8 leading-tight">Quiet Luxury, <br />Architectural Integrity</h2>
                <div className="space-y-6 text-on-surface-variant font-body-lg text-body-lg max-w-lg">
                  <p>Every piece in the Lumina collection is a testament to the dialogue between material and form. The {product.name} utilizes a dual-density foam core wrapped in premium virgin wool to ensure a seating experience that is both supportive and yielding.</p>
                  <p>Our artisans in the Lombardy region hand-stitch every seam, ensuring a level of finish that meets the rigorous standards of institutional design while maintaining the warmth of a residential sanctuary.</p>
                </div>
                <div className="mt-12">
                  <a className="font-label-caps text-label-caps text-primary border-b border-primary pb-2 hover:opacity-70 transition-opacity" href="#craft">EXPLORE OUR CRAFT</a>
                </div>
              </div>
              <div className="relative aspect-square">
                <img alt="Texture detail" className="w-full h-full object-cover rounded-lg shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs1cbb33YglIvt-i9PegcoeKA6GsCj3KhZM_7UoRhRuxwupAf8BIdd9Fl0sYYxnuEpKkfuQXfyiZNuGnKJupeqAlIgJBIRaCAm4NCEtj_f_gkG-E7KPi0uuAdQI1yrypQQ48Ez6jYnML0CSQvdtE1kMEmX6EntMnRvRmSOB2tYUXRVjY45RxJUnsu9hVkwrUBcqTF91ol_XlwBgYMUChvjIRNvCv87J0g2Eq5mZZtadpCjhfCgiK15spX6A0rj3BibWN9DKgMC9t2Q" />
                <div className="absolute -bottom-8 -left-8 bg-surface-cream p-8 hidden md:block border border-outline-variant">
                  <span className="font-display-lg text-headline-md block mb-2">94%</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Natural Fibers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="py-32 px-margin-mobile md:px-margin-desktop border-t border-outline-variant">
          <div className="max-w-container-max mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="w-full lg:w-1/3">
                <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-4">Technical Data</h2>
                <p className="font-headline-md text-headline-md">Dimensional Precision &amp; Material Composition</p>
              </div>
              <div className="w-full lg:w-2/3">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors group">
                      <td className="py-8 font-label-caps text-label-caps text-on-surface-variant uppercase">Dimensions</td>
                      <td className="py-8 font-body-lg text-body-lg">W 240cm x D 105cm x H 72cm (Seat H 42cm)</td>
                    </tr>
                    <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="py-8 font-label-caps text-label-caps text-on-surface-variant uppercase">Materials</td>
                      <td className="py-8 font-body-lg text-body-lg">Solid Walnut Base, Multi-density Foam, Belgian Bouclé</td>
                    </tr>
                    <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="py-8 font-label-caps text-label-caps text-on-surface-variant uppercase">Weight</td>
                      <td className="py-8 font-body-lg text-body-lg">Approx. 95kg (Fully Assembled)</td>
                    </tr>
                    <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="py-8 font-label-caps text-label-caps text-on-surface-variant uppercase">Stock Status</td>
                      <td className="py-8 font-body-lg text-body-lg">{product.quantity > 0 ? `${product.quantity} Available` : 'Out of Stock'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Architectural Pairings */}
        <section className="py-32 bg-surface-container-low">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-2">Spatial Context</h2>
            <h3 className="font-display-lg text-display-lg">Architectural Pairings</h3>
          </div>
          <div className="flex overflow-x-auto gap-gutter px-margin-mobile md:px-margin-desktop hide-scrollbar">
            {/* Pairing 1 */}
            <div className="min-w-[300px] md:min-w-[600px] group cursor-pointer">
              <div className="aspect-[16/9] overflow-hidden mb-6">
                <img alt="Pairing 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/AP1WRLsT05-Shz6pqAql25ehqNc4-CObWE4rVKCkxJOmgoCHtxM6FJWA4eT6M4OGeCjX4A1E5HDX1z3j3laUZapeYFjimo6j3KJrgCRP6mK8ytlNfEMN1gzk132xMg-fYVF_imgY3hB9kG0W0w7l9VidPeUkQf65KZtzYa2Fc5FrNmz61q8R7twC1N6-F0sJQvGWcX5VGQ7gmMTv0cehLZFdCUpYavR_iiEqV-RCuQtFUzdXNl_dchjrhXRPqrhS" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Lighting</span>
                  <h4 className="font-headline-md text-headline-md">Linear Brass Chandelier</h4>
                </div>
                <span className="font-body-md text-body-md text-on-surface-variant mb-1">$3,100.00</span>
              </div>
            </div>
            {/* Pairing 2 */}
            <div className="min-w-[300px] md:min-w-[600px] group cursor-pointer">
              <div className="aspect-[16/9] overflow-hidden mb-6">
                <img alt="Pairing 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/AP1WRLv8F4MLcEBSEDH062YVbxiLykJPeiF6k4kai8bSTaxnGV4JyTW0dFn4KLy9xmQH2oz6gbrZJ07Wv-bFuLzAKbXQAhREvkr9ePeeXEMjJt4-vTM4Fvgb0rN6YSYJV_MaviUhEU-MU81xT-QcNYXj_Za1tX9DA-3na00dHBHC0RSGZ6q3m2FbNH0xvvQc5GabcuyLw5jpWFwVXYkwQuubfNV4GNpikyAs_0rmV1P-f3UtNNfxGQLLgANA2Xdv" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Accent</span>
                  <h4 className="font-headline-md text-headline-md">Monolith Floor Column</h4>
                </div>
                <span className="font-body-md text-body-md text-on-surface-variant mb-1">$1,850.00</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter py-20 px-margin-desktop max-w-container-max mx-auto">
          <div className="col-span-1 md:col-span-1">
            <span className="font-display-lg text-headline-lg text-primary block mb-8">Lumina</span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-loose">
              Curating architectural furniture for the modern administrative and domestic landscape. Established 2024.
            </p>
          </div>
          <div>
            <h5 className="font-label-caps text-label-caps text-primary mb-6 uppercase tracking-widest">Connect</h5>
            <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#ig">Instagram</a></li>
              <li><a className="hover:text-primary transition-colors" href="#pin">Pinterest</a></li>
              <li><a className="hover:text-primary transition-colors" href="#in">LinkedIn</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-caps text-label-caps text-primary mb-6 uppercase tracking-widest">Support</h5>
            <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#sus">Sustainability</a></li>
              <li><a className="hover:text-primary transition-colors" href="#ship">Shipping &amp; Returns</a></li>
              <li><a className="hover:text-primary transition-colors" href="#priv">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-caps text-label-caps text-primary mb-6 uppercase tracking-widest">Newsletter</h5>
            <div className="relative border-b border-outline-variant py-2">
              <input className="bg-transparent border-none focus:ring-0 w-full font-body-md text-body-md p-0" placeholder="Email Address" type="email" />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                <span className="material-symbols-outlined">east</span>
              </button>
            </div>
          </div>
        </div>
        <div className="px-margin-desktop max-w-container-max mx-auto py-8 border-t border-outline-variant/30 text-center">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">© 2024 Lumina Architectural Interiors. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
