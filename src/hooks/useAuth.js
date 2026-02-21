import { useState } from 'react';
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from '../config/constants';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState('input');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginName.trim() || !loginEmail.trim()) return;

    const userEmailKey = loginEmail.toLowerCase().trim();

    // Admin bypass
    if (userEmailKey === 'admin@admin.com' || userEmailKey === 'admin') {
      setIsAuthenticated(true);
      return;
    }

    // Check if already verified
    if (localStorage.getItem(`verified_${userEmailKey}`)) {
      setIsAuthenticated(true);
    } else {
      // Send verification code via EmailJS
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSendingEmail(true);

      try {
        if (!window.emailjs) throw new Error("Servizio di invio in caricamento...");
        window.emailjs.init(EMAILJS_PUBLIC_KEY);

        const res = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_name: loginName.trim(),
          to_email: loginEmail.trim(),
          user_email: loginEmail.trim(),
          email: loginEmail.trim(),
          otp_code: code
        });

        if (res.status === 200) {
          setLoginStep('verify');
        } else {
          throw new Error(`Risposta server non valida: ${res.status}`);
        }
      } catch (err) {
        setLoginError(`ERRORE INVIO: ${err.message || "Sconosciuto"}`);
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (verificationCode === generatedCode) {
      localStorage.setItem(`verified_${loginEmail.toLowerCase().trim()}`, 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('OTP non corretto.');
    }
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
    handleVerifySubmit
  };
};
