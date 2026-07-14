interface Props {
  onStart: () => void;
  onLogin: () => void;
}

export function Landing({ onStart, onLogin }: Props) {
  return (
    <main className="screen landing">

      <section className="hero">
        <p className="eyebrow">Programacion CrossFit e HYROX</p>
        <h1 className="brand">KAIROS</h1>
        <p className="herotext">
          La unica programacion que se adapta a tu dia, no al reves.
          Tu dices cuanto tiempo tienes y como estas. Kairos decide el mejor entreno posible hoy.
        </p>
        <button className="cta" onClick={onStart}>Empieza tu semana gratis</button>
        <button className="link" style={{ textAlign: 'center', width: '100%' }} onClick={onLogin}>
          Ya tengo cuenta - Entrar
        </button>
      </section>

      <section className="demo">
        <p className="eyebrow">Asi funciona de verdad</p>
        <h2>Tu check-in de 20 segundos</h2>
        <div className="demochips">
          <span className="demochip">Hoy tengo 1 hora</span>
          <span className="demochip warn">Muneca - con carga</span>
        </div>
        <div className="demoarrow">y tu sesion se reconstruye</div>
        <div className="block demoblock">
          <header>
            <span className="format">HALTEROFILIA</span>
            <span className="tag nucleo">NUCLEO</span>
          </header>
          <h3 className="demoname">Power Clean - ondulante</h3>
          <ul>
            <li>
              Clean con mancuernas 7x2
              <div className="adapted">
                ADAPTADO - Muneca en carga - sustituye a Power clean con barra (agarre neutro, muneca protegida)
              </div>
            </li>
          </ul>
          <p className="note">Complementario comprimido por tiempo. El estimulo clave del dia, intacto.</p>
        </div>
        <p className="muted center">
          Sin improvisar. Sin saltarte el dia. Sin romper tu ciclo de entrenamiento.
        </p>
      </section>

      <section className="steps">
        <p className="eyebrow">Como funciona</p>
        <h2>Tres pasos cada dia</h2>
        <div className="step"><span className="stepnum">1</span><div><strong>Abre tu semana</strong><p>Ves el ciclo completo y eliges dia. Cada sesion explica por que toca lo que toca.</p></div></div>
        <div className="step"><span className="stepnum">2</span><div><strong>Cuenta como estas</strong><p>Nivel, tiempo disponible y molestias. Veinte segundos.</p></div></div>
        <div className="step"><span className="stepnum">3</span><div><strong>Entrena y registra</strong><p>Sesion adaptada, marcas, comentarios y tu semana en verde. Tu progreso, visible.</p></div></div>
      </section>

      <section className="tracks">
        <p className="eyebrow">Dos programaciones</p>
        <h2>Elige tu camino</h2>
        <div className="option" style={{ cursor: 'default' }}>
          <strong>CrossFit</strong>
          <span>Fuerza, halterofilia, gimnasticos y WODs con periodizacion explicada. Niveles: Escalado, Intermedio, RX y Elite.</span>
        </div>
        <div className="option" style={{ cursor: 'default' }}>
          <strong>HYROX</strong>
          <span>Carrera comprometida, trineos, estaciones y simulaciones race pace. Divisiones Open y Pro con cargas oficiales.</span>
        </div>
        <p className="note center">Tu eleccion se mantiene el mes completo: un bloque necesita continuidad para funcionar.</p>
      </section>

      <section className="pricing">
        <p className="eyebrow">Precio claro</p>
        <h2>14,99 EUR al mes</h2>
        <p className="muted center">
          Tu primera semana es gratis, con acceso completo. Despues, un unico plan con todo dentro.
          Se renueva solo y cancelas cuando quieras.
        </p>
        <button className="cta" onClick={onStart}>Empieza tu semana gratis</button>
        <p className="note center">Sin permanencia - Cambia de programacion al renovar tu mes</p>
      </section>

      <footer className="landfoot">
        <span className="logo">KAIROS</span>
        <p className="note center">El momento oportuno. El mejor entreno posible, hoy.</p>
      </footer>
    </main>
  );
}
