import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { store } from "../store";

type AppProvidersProps = {
  children: ReactNode;
};

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <BrowserRouter basename={routerBasename}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-md)",
              color: "var(--text-color)",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
