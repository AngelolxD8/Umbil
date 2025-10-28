// src/app/auth/update-password/page.tsx
import { Suspense } from "react";
import UpdatePasswordHandler from "./UpdatePasswordHandler"; 

// Create a simple loading component/fallback
const Loading = () => (
  <div className="main-content">
    <div className="container" style={{ textAlign: "center" }}>
      <p>Loading password reset form...</p>
    </div>
  </div>
);

// The page component wraps the client logic in Suspense to prevent the Vercel build error.
export default function AuthUpdatePasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      {/* The handler component will safely execute on the client side */}
      <UpdatePasswordHandler />
    </Suspense>
  );
}