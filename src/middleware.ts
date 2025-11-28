import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/demos/:path*',
    '/stats/:path*',
    '/coaching/:path*',
    '/settings/:path*',
    '/api/demos/:path*',
    '/api/stats/:path*',
    '/api/coaching/:path*',
  ],
};
