import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import './index.css'
import App from './App.jsx'

const msalConfig = {
  auth: {
    clientId: "de1c371c-8904-44ce-82ae-e2cd07fc4a69",
    authority: "https://login.microsoftonline.com/69ca9d72-a53b-4573-86be-638ed226b2e3",
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
);
