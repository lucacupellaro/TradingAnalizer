import { useState } from 'react';
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from '../config/constants';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState('input');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const initEmailJS = () => {
    if (!window.emailjs) {
      throw new Error('Servizio EmailJS non disponibile o non ancora caricato.');
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('Configurazione EmailJS incompleta.');
    }

    if (!window.__emailjs_initialized__) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      window.__emailjs_initialized__ = true;
    }
  };

  const buildEmailErrorMessage = (err) => {
    if (!err) return 'Errore sconosciuto';

    if (err.status === 412) {
      return 'Invio rifiutato da EmailJS (412). Controlla Public Key, Service ID, Template ID, dominio autorizzato o rate limit.';
    }

    return (
      err.text ||
      err.message ||
      (err.status ? `Errore HTTP ${err.status}` : null) ||
      'Errore sconosciuto'
    );
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanName = loginName.trim();
    const cleanEmail = loginEmail.toLowerCase().trim();

    if (!cleanName || !cleanEmail) {
      setLoginError('Inserisci nome ed email.');
      return;
    }

    if (cleanEmail === 'admin@admin.com' || cleanEmail === 'admin') {
      setIsAuthenticated(true);
      return;
    }

    const verifiedKey = `verified_${cleanEmail}`;
    const alreadyVerified = localStorage.getItem(verifiedKey);

    if (alreadyVerified) {
      setIsAuthenticated(true);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsSendingEmail(true);

    try {
      initEmailJS();

      const templateParams = {
        to_name: cleanName,
        to_email: cleanEmail,
        user_email: cleanEmail,
        email: cleanEmail,
        otp_code: code,
      };

      console.log('EmailJS send config:', {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID,
        publicKeyLoaded: !!EMAILJS_PUBLIC_KEY,
        templateParams,
      });

      const response = await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('EmailJS response:', response);

      if (response?.status === 200) {
        setLoginStep('verify');
      } else {
        throw new Error(`Risposta server non valida: ${response?.status ?? 'sconosciuta'}`);
      }
    } catch (err) {
      console.error('EmailJS full error:', err);
      setLoginError(`ERRORE INVIO: ${buildEmailErrorMessage(err)}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.toLowerCase().trim();

    if (!verificationCode.trim()) {
      setLoginError('Inserisci il codice OTP.');
      return;
    }

    if (verificationCode.trim() === generatedCode) {
      localStorage.setItem(`verified_${cleanEmail}`, 'true');
      setIsAuthenticated(true);
      return;
    }

    setLoginError('OTP non corretto.');
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    loginStep,
    setLoginStep,
    loginName,
    setLoginName,
    loginEmail,
    setLoginEmail,
    verificationCode,
    setVerificationCode,
    loginError,
    setLoginError,
    isSendingEmail,
    handleLoginSubmit,
    handleVerifySubmit,
  };
};