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
    <div className="fixed inset-0 z-[20000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#333] p-12 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden transition-all duration-500 flex flex-col items-center text-center" style={{ paddingBottom: '2.5rem' }}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 ${loginStep === 'input' ? 'bg-white' : 'bg-[#ffcc00]'} blur-[10px]`}></div>
        <BarChart2 className={`w-16 h-16 mx-auto mb-6 ${loginStep === 'input' ? 'text-white' : 'text-[#ffcc00]'}`} />
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2 w-full">
          {loginStep === 'input' ? 'Benvenuto' : 'Verifica'}
        </h1>
        <h2 className="text-4xl font-black text-[#ffcc00] uppercase tracking-widest mb-6 w-full">
          TRADERS
        </h2>
        <p className="text-[#888] font-mono text-[11px] uppercase mb-8 tracking-widest h-8">
          {loginStep === 'input' ? 'Quant Terminal' : `Codice inviato a:\n${loginEmail}`}
        </p>

        {loginError && (
          <div className="mb-6 text-[11px] text-rose-500 font-mono font-bold uppercase bg-rose-500/10 p-4 rounded border border-rose-500/30 break-words">
            {loginError}
          </div>
        )}

        {loginStep === 'input' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 w-full flex flex-col items-center" style={{ gap: "1.5rem" }}>
            <input
              type="text"
              required
              placeholder="Nome"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              disabled={isSendingEmail}
              className="w-80 bg-[#111] border border-[#333] text-white px-6 rounded outline-none focus:border-white font-mono text-center text-lg font-bold"
              style={{ marginBottom: "0.75rem", padding: '0.65rem 1.25rem', minHeight: '72px' }}
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={isSendingEmail}
              className="w-80 bg-[#111] border border-[#333] text-white px-6 rounded outline-none focus:border-white font-mono text-center text-lg font-bold"
              style={{ marginBottom: "1rem", padding: '0.8rem 1.25rem', minHeight: '72px' }}
            />
            <button
              type="submit"
              disabled={isSendingEmail}
              className={`w-80 font-black py-6 rounded uppercase text-lg ${theme.accentBg} flex justify-center items-center gap-3`}
              style={{ marginTop: "0.rem", marginBottom: '0.75rem' }}
            >
              {isSendingEmail ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" /> Invio...
                </>
              ) : (
                'Continua'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-8 w-full flex flex-col items-center">
            <input
              type="text"
              required
              placeholder="OTP"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="w-80 bg-[#111] border border-[#333] text-white px-6 rounded outline-none focus:border-[#ffcc00] font-mono text-4xl tracking-[0.5em] text-center font-bold"
              style={{ padding: '0.8rem 0.8rem', minHeight: '65px' }}
            />
            <button
              type="submit"
              className="w-80 bg-[#ffcc00] text-black font-black py-6 rounded uppercase text-lg hover:bg-white mt-6 transition-colors"
              style={{ marginBottom: '0.15rem' }}
            >
              Verifica
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
