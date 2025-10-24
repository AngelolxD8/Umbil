// src/app/auth/callback/page.tsx
import { Suspense } from "react";
import CallbackHandler from "./CallbackHandler"; 

// Create a simple loading component/fallback
const Loading = () => (
  <div className="main-content">
    <div className="container" style={{ textAlign: "center" }}>
      <p>Loading...</p>
    </div>
  </div>
);

// The page component wraps the client logic in Suspense to prevent the build error.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      {/* The handler component will safely execute on the client side */}
      <CallbackHandler />
    </Suspense>
  );
}