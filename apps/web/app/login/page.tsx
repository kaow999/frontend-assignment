import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "../../components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in — SHOP.CO",
};

/** The form reads `?next=`, so it needs a boundary to prerender behind. */
const LoginPage = () => (
  <Suspense fallback={null}>
    <AuthForm mode="login" />
  </Suspense>
);

export default LoginPage;
