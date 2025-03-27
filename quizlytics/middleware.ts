import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/utils/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const user = token ? verifyToken(token) : null;

  // Public paths that don't require authentication
  const publicPaths = ['/auth/signin', '/auth/signup'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // If the user is not authenticated and trying to access a protected route
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If the user is authenticated and trying to access auth pages
  if (user && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based access control
  if (user) {
    const isTeacherPath = request.nextUrl.pathname.startsWith('/teacher');
    const isStudentPath = request.nextUrl.pathname.startsWith('/student');

    if (isTeacherPath && user.role !== 'teacher') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isStudentPath && user.role !== 'student') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/teacher/:path*',
    '/student/:path*',
    '/auth/:path*',
    '/api/teacher/:path*',
    '/api/student/:path*',
  ],
}; 