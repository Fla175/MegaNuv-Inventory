import "../styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/context/UserContext";
import { ToastProvider } from "../lib/context/ToastContext";
import ToastContainer from "../components/ui/ToastContainer";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <UserProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </UserProvider>
    </ToastProvider>
  );
}
