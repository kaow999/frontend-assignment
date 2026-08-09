import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "../../components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create an account — SHOP.CO",
};

const RegisterPage = () => (
  <Suspense fallback={null}>
    <AuthForm mode="register" />
  </Suspense>
);

export default RegisterPage;
