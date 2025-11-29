export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cs2-dark to-cs2-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-cs2-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <span className="text-2xl font-bold text-white">CS2 Coach</span>
        </div>

        {/* Auth Card */}
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
