import Link from "next/link";
import { Search, Shield, IndianRupee, Star, ArrowRight, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="font-display text-2xl font-semibold text-[#1c1917]">
          PG<span className="text-[#ea6c0a]">Nest</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-[#1c1917] text-white px-4 py-2 rounded-lg hover:bg-[#292524] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#ffedd5] text-[#c2410c] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#ea6c0a] rounded-full animate-pulse" />
            Now live in Mumbai
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-[#1c1917] leading-[1.1] mb-6">
            Find your perfect
            <br />
            <span className="text-[#ea6c0a] italic">paying guest</span>
            <br />
            home in Mumbai
          </h1>
          <p className="text-lg text-[#78716c] mb-10 leading-relaxed max-w-xl">
            Transparent deposits, verified listings, and secure payments.
            Built for students, bachelors, and working professionals.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-lg">
            <div className="flex-1 flex items-center gap-3 bg-white border border-[#e7e5e4] rounded-xl px-4 py-3 shadow-sm">
              <MapPin className="w-4 h-4 text-[#a8a29e] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by area — Andheri, Bandra, Powai..."
                className="flex-1 text-sm bg-transparent outline-none text-[#1c1917] placeholder:text-[#a8a29e]"
              />
            </div>
            <Link
              href="/tenant/search"
              className="flex items-center gap-2 bg-[#ea6c0a] text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-[#c2410c] transition-colors flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#e7e5e4] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 gap-8">
          {[
            { value: "500+", label: "Verified listings" },
            { value: "₹0", label: "Platform fee for tenants" },
            { value: "100%", label: "Deposit transparency" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-semibold text-[#1c1917] mb-1">{stat.value}</div>
              <div className="text-sm text-[#78716c]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-semibold text-[#1c1917] mb-3">
          Why PGNest?
        </h2>
        <p className="text-[#78716c] mb-12">Everything you need, nothing you don't.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "Transparent deposit tracker",
              desc: "See your exact deposit balance at all times. Every deduction requires a reason. Dispute unfair claims directly in the app.",
              color: "bg-[#fff7ed]",
              iconColor: "text-[#ea6c0a]",
            },
            {
              icon: IndianRupee,
              title: "Secure payments",
              desc: "Pay rent and deposit through Razorpay. Your deposit is held safely and only released at the end of your contract.",
              color: "bg-[#f0fdf4]",
              iconColor: "text-[#16a34a]",
            },
            {
              icon: Star,
              title: "Verified listings",
              desc: "PG owners go through a verification process. Photos are real, amenities are accurate, and rules are clearly stated.",
              color: "bg-[#eff6ff]",
              iconColor: "text-[#2563eb]",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-[#e7e5e4] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-display font-semibold text-[#1c1917] mb-2">{f.title}</h3>
              <p className="text-sm text-[#78716c] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Areas */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold text-[#1c1917]">
            Popular areas in Mumbai
          </h2>
          <Link href="/tenant/search" className="flex items-center gap-1 text-sm text-[#ea6c0a] font-medium hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {["Andheri West", "Bandra East", "Powai", "Thane West"].map((area) => (
            <Link
              key={area}
              href={`/tenant/search?area=${encodeURIComponent(area)}`}
              className="group bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="h-28 bg-gradient-to-br from-[#fed7aa] to-[#fdba74] flex items-end p-4">
                <MapPin className="w-4 h-4 text-[#c2410c]" />
              </div>
              <div className="p-4">
                <div className="font-medium text-[#1c1917] text-sm">{area}</div>
                <div className="text-xs text-[#a8a29e] mt-0.5">Mumbai</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA for owners */}
      <section className="bg-[#1c1917] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-3xl font-semibold mb-3">
              Own a PG? List it for free.
            </h2>
            <p className="text-[#a8a29e] max-w-md">
              Reach thousands of verified tenants. Manage bookings, collect payments,
              and handle deposits — all from one dashboard.
            </p>
          </div>
          <Link
            href="/signup?role=owner"
            className="flex items-center gap-2 bg-[#ea6c0a] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#c2410c] transition-colors flex-shrink-0"
          >
            List your PG <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e7e5e4]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-[#1c1917]">
            PG<span className="text-[#ea6c0a]">Nest</span>
          </span>
          <p className="text-xs text-[#a8a29e]">© 2024 PGNest. Built for Mumbai.</p>
        </div>
      </footer>
    </div>
  );
}