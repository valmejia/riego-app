import React from 'react';

export default function ClimaCard({ 
  titulo, 
  subtitulo, 
  icono, 
  badgeTexto, 
  badgeIcono,
  valorPrincipal,
  unidadPrincipal,
  valorSecundario,
  unidadSecundaria,
  porcentajeBarra = 0,
  mensajeInferior,
  min,
  max,
  colorTheme = 'verde' // 'verde' o 'azul'
}) {
  
  // Configuración de colores según el tema
  const themes = {
    verde: {
      glow: 'rgba(34, 197, 94, 0.15)', // Brillo verde esmeralda
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-400',
      accentBgMuted: 'bg-emerald-400/10',
      border: 'border-emerald-400/30',
      iconBg: 'bg-emerald-950'
    },
    azul: {
      glow: 'rgba(56, 189, 248, 0.15)', // Brillo celeste
      accentText: 'text-sky-400',
      accentBg: 'bg-sky-400',
      accentBgMuted: 'bg-sky-400/10',
      border: 'border-sky-400/30',
      iconBg: 'bg-sky-950'
    }
  };

  const t = themes[colorTheme];

  // Estilo dinámico para el fondo (el resplandor cambia de color)
  const cardStyle = {
    backgroundColor: '#0f172a',
    backgroundImage: `
      radial-gradient(circle at 100% 0%, ${t.glow} 0%, transparent 50%),
      radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
      url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')
    `,
    backgroundSize: 'cover, cover, 20px 20px',
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl shadow-md p-6 flex flex-col justify-between w-full"
      style={cardStyle}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${t.iconBg} flex items-center justify-center ${t.accentText} border border-white/5`}>
            <span className="material-symbols-outlined">{icono}</span>
          </div>
          <div>
            <span className="font-bold text-white text-lg block leading-tight">{titulo}</span>
            <span className={`block text-sm ${t.accentText}`}>{subtitulo}</span>
          </div>
        </div>
        
        {/* Badge */}
        <span className={`px-3 py-1.5 rounded-full bg-[#0f172a] border ${t.border} ${t.accentText} text-sm flex items-center gap-1.5 font-medium`}>
          {badgeIcono && <span>{badgeIcono}</span>}
          {badgeTexto}
        </span>
      </div>

      {/* Cuerpo principal (Dos columnas) */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-gray-400 text-sm">Temperatura</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-bold text-white">{valorPrincipal}</span>
            <span className="text-lg text-gray-400">{unidadPrincipal}</span>
          </div>
          <p className={`${t.accentText} text-sm mt-1`}>Fresco y templado</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Humedad del Aire</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-4xl font-bold ${t.accentText}`}>{valorSecundario}</span>
            <span className="text-lg text-gray-400">{unidadSecundaria}</span>
          </div>
          {/* Barra de progreso */}
          <div className="w-full h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
            <div className={`h-full ${t.accentBg}`} style={{ width: `${porcentajeBarra}%` }} />
          </div>
        </div>
      </div>

      {/* Footer interior oscuro */}
      <div className="relative z-10 bg-black/30 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined ${t.accentText} text-[20px]`}>thumb_up</span>
          <p className="text-sm text-gray-300 leading-tight">
            {mensajeInferior}
          </p>
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span>Mínima hoy: {min}</span>
          <span>Máxima hoy: {max}</span>
        </div>
      </div>
    </div>
  );
}