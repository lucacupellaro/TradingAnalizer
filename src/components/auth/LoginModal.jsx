import React from 'react';
import { BarChart2, Activity } from 'lucide-react';

export const LoginModal = ({
  loginStep,
  loginName,
  setLoginName,
  loginEmail,
  setLoginEmail,
  verificationCode,
  setVerificationCode,
  loginError,
  isSendingEmail,
  handleLoginSubmit,
  handleVerifySubmit,
  theme
}) => {
  return (
    <div className="fixed inset-0 z-[20000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-center">
      <div className="bg-[#0a0a0a] border border-[#333] p-8 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden transition-all duration-500">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 ${loginStep === 'input' ? 'bg-white' : 'bg-[#ffcc00]'} blur-[10px]`}></div>
        <BarChart2 className={`w-12 h-12 mx-auto mb-4 ${loginStep === 'input' ? 'text-white' : 'text-[#ffcc00]'}`} />
        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-1">
          {loginStep === 'input' ? 'Benvenuto' : 'Verifica'}
        </h1>
        <p className="text-[#888] font-mono text-[10px] uppercase mb-6 tracking-widest h-8">
          {loginStep === 'input' ? 'Quant Terminal' : `Codice inviato a:\n${loginEmail}`}
        </p>

        {loginError && (
          <div className="mb-4 text-[10px] text-rose-500 font-mono uppercase bg-rose-500/10 p-3 rounded border border-rose-500/30 break-words">
            {loginError}
          </div>
        )}

        {loginStep === 'input' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Nome"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              disabled={isSendingEmail}
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded outline-none focus:border-white font-mono text-center"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={isSendingEmail}
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded outline-none focus:border-white font-mono text-center"
            />
            <button
              type="submit"
              disabled={isSendingEmail}
              className={`w-full font-black py-3 rounded uppercase text-xs mt-4 ${theme.accentBg} flex justify-center items-center gap-2`}
            >
              {isSendingEmail ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" /> Invio...
                </>
              ) : (
                'Continua'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <input
              type="text"
              required
              placeholder="OTP"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded outline-none focus:border-[#ffcc00] font-mono text-2xl tracking-[0.5em] text-center"
            />
            <button
              type="submit"
              className="w-full bg-[#ffcc00] text-black font-black py-3 rounded uppercase text-xs hover:bg-white mt-4"
            >
              Verifica
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
