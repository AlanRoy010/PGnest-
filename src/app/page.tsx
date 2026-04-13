import Link from "next/link";
import { Search, Shield, IndianRupee, Star, ArrowRight, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0f4ff] overflow-hidden">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <span className="font-display text-2xl font-semibold text-white">
          PG<span className="text-[#7dd3fc]">Owns</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-white text-[#0f2044] px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center -mt-[72px] pt-[72px]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0d1f44] to-[#160d35]" />

        {/* Ambient blobs */}
        <div className="absolute top-24 right-16 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 left-32 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-400/8 rounded-full blur-2xl pointer-events-none" />

        {/* Content grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full py-20 grid md:grid-cols-2 gap-16 items-center">

          {/* Left — headline + search */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Now live in Mumbai
            </div>

            <h1 className="font-display text-5xl md:text-[4.5rem] font-semibold text-white leading-[1.05] mb-6">
              Your next
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7dd3fc] to-[#a5b4fc] italic">
                perfect home
              </span>
              <br />
              in Mumbai
            </h1>

            <p className="text-base text-white/50 mb-10 leading-relaxed max-w-md">
              Transparent deposits, verified PG listings, and secure payments.
              Built for students and working professionals.
            </p>

            {/* Search bar */}
            <div className="flex gap-3 max-w-lg">
              <div className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4 focus-within:border-white/30 transition-colors">
                <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Andheri, Bandra, Powai..."
                  className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/35"
                />
              </div>
              <Link
                href="/tenant/search"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4 rounded-2xl font-medium text-sm hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg shadow-blue-500/30"
              >
                <Search className="w-4 h-4" />
                Search
              </Link>
            </div>
          </div>

          {/* Right — floating glass cards */}
          <div className="relative hidden md:block h-[500px]">

            {/* Card: stats */}
            <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.75rem] p-6 shadow-2xl w-52">
              <p className="text-white/50 text-xs mb-2">Verified Listings</p>
              <p className="font-display text-5xl font-semibold text-white">500+</p>
              <div className="mt-4 flex -space-x-2">
                {["bg-blue-400", "bg-indigo-400", "bg-violet-400", "bg-sky-400"].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white/20`} />
                ))}
              </div>
            </div>

            {/* Card: listing preview */}
            <div className="absolute top-10 right-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.75rem] p-5 shadow-2xl w-64">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-white text-sm">Andheri West PG</p>
                  <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> Near Metro Station
                  </p>
                </div>
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-2xl h-24 mb-4 flex items-center justify-center border border-white/10">
                <span className="text-white/25 text-[10px]">Room photo</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">
                  ₹12,000<span className="text-white/40 font-normal text-xs">/mo</span>
                </p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-white/60 text-xs">4.8</span>
                </div>
              </div>
            </div>

            {/* Card: zero fee */}
            <div className="absolute bottom-28 left-10 bg-gradient-to-br from-blue-500/25 to-indigo-500/25 backdrop-blur-2xl border border-white/15 rounded-[1.75rem] p-5 shadow-2xl w-52">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">₹0 Platform Fee</p>
              <p className="text-white/40 text-xs mt-1">Always free for tenants</p>
            </div>

            {/* Card: deposit badge */}
            <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/25 rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Deposit Protected</p>
                  <p className="text-white/40 text-[10px]">100% transparent</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="relative bg-white pt-28 pb-24 overflow-hidden">
        {/* Transition from dark hero */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#160d35] to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-[#0f172a] mb-3">
              Why PG Owns?
            </h2>
            <p className="text-[#64748b]">Everything you need, nothing you don&apos;t.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: "Transparent deposit tracker",
                desc: "See your exact deposit balance at all times. Every deduction requires a reason. Dispute unfair claims directly in the app.",
                from: "from-blue-50",
                to: "to-indigo-50/60",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                blob: "bg-blue-400",
              },
              {
                icon: IndianRupee,
                title: "Secure payments",
                desc: "Pay rent and deposit through Razorpay. Your deposit is held safely and only released at the end of your contract.",
                from: "from-emerald-50",
                to: "to-teal-50/60",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                blob: "bg-emerald-400",
              },
              {
                icon: Star,
                title: "Verified listings",
                desc: "PG owners go through a verification process. Photos are real, amenities are accurate, and rules are clearly stated.",
                from: "from-violet-50",
                to: "to-purple-50/60",
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
                blob: "bg-violet-400",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.from} ${f.to} rounded-[2rem] p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold text-[#0f172a] mb-3 text-lg">{f.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
                {/* Decorative blob */}
                <div className={`absolute -bottom-10 -right-10 w-40 h-40 ${f.blob}/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AREAS ───────────────────────────────────────────── */}
      <section className="bg-[#f8faff] py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-[#0f172a]">
              Popular areas
            </h2>
            <Link
              href="/tenant/search"
              className="flex items-center gap-1.5 text-sm text-blue-500 font-medium hover:gap-2.5 transition-all duration-200"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "Andheri West", gradient: "from-blue-400 to-indigo-500" },
              { name: "Bandra East",  gradient: "from-violet-400 to-purple-500" },
              { name: "Powai",        gradient: "from-sky-400 to-blue-500" },
              { name: "Thane West",   gradient: "from-indigo-400 to-blue-600" },
            ].map((area) => (
              <Link
                key={area.name}
                href={`/tenant/search?area=${encodeURIComponent(area.name)}`}
                className="group relative bg-white rounded-[1.75rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-32 bg-gradient-to-br ${area.gradient} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <MapPin className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-[#0f172a] text-sm">{area.name}</div>
                  <div className="text-xs text-[#94a3b8] mt-0.5">Mumbai</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] to-[#312e81]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="font-display text-4xl font-semibold text-white mb-4">
              Own a PG? List it for free.
            </h2>
            <p className="text-white/55 max-w-md leading-relaxed">
              Reach thousands of verified tenants. Manage bookings, collect payments,
              and handle deposits — all from one dashboard.
            </p>
          </div>
          <Link
            href="/signup?role=owner"
            className="flex items-center gap-2 bg-white text-[#1e3a8a] px-8 py-4 rounded-2xl font-semibold text-sm hover:bg-white/90 transition-colors flex-shrink-0 shadow-2xl"
          >
            List your PG <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-[#060d1f] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-white">
            PG<span className="text-[#7dd3fc]">Owns</span>
          </span>
          <p className="text-xs text-white/25">© 2024 PG Owns. Built for Mumbai.</p>
        </div>
      </footer>

    </div>
  );
}
