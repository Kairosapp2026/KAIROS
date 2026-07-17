import { useEffect, useState } from 'react';

interface Props {
  onStart: () => void;
  onLogin: () => void;
}

const SLIDES = [
  {
    title: 'Paso 1 - Tu tiempo',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">LUNES - PASO 2 DE 3</p>
        <p className="phtitle">Cuanto tienes hoy?</p>
        <div className="phoption on"><strong>1 hora</strong><span>Nucleo del dia: lo innegociable</span></div>
        <div className="phoption"><strong>2 horas</strong><span>Sesion completa</span></div>
      </div>
    ),
  },
  {
    title: 'Paso 2 - Tu estado',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">LUNES - PASO 3 DE 3</p>
        <p className="phtitle">Alguna molestia hoy?</p>
        <div className="phgrid">
          <div className="phchip on">Hombro<br /><small>en carga</small></div>
          <div className="phchip">Muneca</div>
          <div className="phchip">Lumbar</div>
          <div className="phchip">Rodilla</div>
        </div>
        <div className="phcta">Adaptar mi entreno</div>
      </div>
    ),
  },
  {
    title: 'Tu sesion, reconstruida',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">LUNES - ACUMULACION - RX</p>
        <p className="phtitle">Sentadilla + motor</p>
        <div className="phblock">
          <p className="phformat">AMRAP - 15 MIN</p>
          <p className="phline">15/12 cal remo</p>
          <p className="phline">12 medball clean 9/6</p>
          <p className="phadapted">ADAPTADO - hombro en carga - sustituye a wallball</p>
          <p className="phline">9 toes to bar</p>
        </div>
        <div className="phblock soft">
          <p className="phformat green">MOVILIDAD FINAL - HOMBRO - 8 MIN</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Cada sesion, explicada',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">LUNES - SEMANA 3 DE 6</p>
        <p className="phtitle">Sentadilla + motor</p>
        <div className="phblock soft">
          <p className="phformat green">POR QUE HOY ESTO</p>
          <p className="phwhy">
            Semana de acumulacion: construimos base de fuerza en piernas y capacidad
            aerobica. La intensidad sube la semana que viene. Confia en el proceso.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Sabes donde estas del ciclo',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">TU CICLO ACTUAL</p>
        <p className="phtitle">Acumulacion</p>
        <div className="phcycle">
          <div className="phbar"><span style={{ width: '50%' }} /></div>
          <p className="phbarlabel">Semana 3 de 6</p>
        </div>
        <div className="phoption on"><strong>Acumulacion</strong><span>Volumen y base - estas aqui</span></div>
        <div className="phoption"><strong>Intensidad</strong><span>Menos volumen, mas carga</span></div>
        <div className="phoption"><strong>Realizacion</strong><span>Ritmo de competicion</span></div>
      </div>
    ),
  },
  {
    title: 'Tu semana, tu registro',
    screen: (
      <div className="phscreen">
        <p className="pheyebrow">SEMANA 3 DE 6 - ACUMULACION</p>
        <p className="phtitle">Tu semana</p>
        <div className="phday ok"><strong>LUNES</strong><em>COMPLETADO</em></div>
        <div className="phday ok"><strong>MARTES</strong><em>COMPLETADO</em></div>
        <div className="phday part"><strong>MIERCOLES</strong><em>EMPEZADO</em></div>
        <div className="phday"><strong>JUEVES - HOY</strong></div>
      </div>
    ),
  },
];

function DemoCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 3200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="carousel">
      <div className="phone">
        <div className="phnotch" />
        {SLIDES[i].screen}
      </div>
      <p className="slidetitle">{SLIDES[i].title}</p>
      <div className="dots">
        {SLIDES.map((_, n) => (
          <button key={n} className={`dot ${n === i ? 'on' : ''}`} onClick={() => setI(n)} aria-label={'Pantalla ' + (n + 1)} />
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: 'Cuanto tiempo necesito para entrenar?',
    a: 'El que tengas. Cada dia eliges entre sesion de 1 hora o de 2: con 1 hora hacemos el nucleo del dia (el estimulo innegociable) y comprimimos lo accesorio. El ciclo avanza igual.',
  },
  {
    q: 'Que pasa si tengo una molestia?',
    a: 'La marcas en el check-in (zona y cuando molesta) y la sesion se reconstruye: sustituimos los ejercicios que la cargan por alternativas equivalentes y anadimos movilidad dirigida al final. Si se repite varios dias, te recomendamos consultar con un profesional.',
  },
  {
    q: 'Cual es el objetivo de la programacion?',
    a: 'Que progreses de verdad sin que la vida te saque del ciclo. Trabajamos con ciclos cortos periodizados (acumulacion, intensidad, realizacion) y progresion real: no solo mas kilos, tambien variacion de ejercicios, tempos, rangos y patrones. Cada sesion te explica por que toca lo que toca.',
  },
  {
    q: 'Puedo cambiar entre CrossFit e HYROX?',
    a: 'Si, al renovar tu mes. Durante el mes tu programacion se mantiene fija porque un bloque de entrenamiento necesita continuidad para funcionar.',
  },
  {
    q: 'Como cancelo?',
    a: 'Tu mismo, desde "Gestionar mi suscripcion", en un minuto y sin dar explicaciones. Mantienes el acceso hasta el final del periodo que ya has pagado.',
  },
];

export function Landing({ onStart, onLogin }: Props) {
  return (
    <main className="screen landing">

      <section className="hero">
        <p className="eyebrow">Programacion CrossFit e HYROX</p>
        <h1 className="brand xl">KAIROS</h1>
        <p className="herotext">
          <strong>Tu dices cuanto tiempo tienes y como estas.</strong><br />
          Kairos construye el mejor entreno posible hoy, sin romper tu ciclo.
        </p>
        <div className="herobadges">
          <span>Adaptacion diaria</span>
          <span>4 niveles</span>
          <span>Open y Pro</span>
        </div>
        <button className="cta" onClick={onStart}>Empieza tu semana gratis</button>
        <button className="link" style={{ textAlign: 'center', width: '100%' }} onClick={onLogin}>
          Ya tengo cuenta - Entrar
        </button>
      </section>

      <section className="demo">
        <p className="eyebrow center">Asi se ve por dentro</p>
        <h2 className="center">De tu dia a tu entreno en 20 segundos</h2>
        <DemoCarousel />
      </section>

      <section className="metodo">
        <p className="eyebrow">El metodo</p>
        <h2>Ciencia, no ocurrencias</h2>
        <div className="metodogrid">
          <div className="metodoitem">
            <strong>Ciclos cortos periodizados</strong>
            <p>Acumulacion, intensidad y realizacion. Sabes en que fase estas y por que toca lo que toca, cada dia.</p>
          </div>
          <div className="metodoitem">
            <strong>Progresion real</strong>
            <p>Progresar no es solo subir kilos: variamos ejercicios, patrones, tempos y rangos para que el estimulo nunca se estanque.</p>
          </div>
          <div className="metodoitem">
            <strong>+7 anos programando</strong>
            <p>Cientos de atletas de box reales detras de cada decision: gente con trabajo, familia y molestias, no profesionales del CrossFit.</p>
          </div>
        </div>
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
      </section>

      <section className="pricing">
        <p className="eyebrow">Precio claro</p>
        <h2>14,99 EUR al mes</h2>
        <p className="muted center">
          Tu primera semana es gratis, con acceso completo. Despues, un unico plan con todo dentro.
          Se renueva solo y cancelas cuando quieras.
        </p>
        <button className="cta" onClick={onStart}>Empieza tu semana gratis</button>
        <p className="note center">
          Sin PDF ni hojas de calculo. Sin sesiones imposibles de 2 horas. Tu entreno, adaptado a tu dia.
        </p>
      </section>

      <section className="faq">
        <p className="eyebrow">Preguntas frecuentes</p>
        <h2>Lo que todo el mundo pregunta</h2>
        {FAQS.map((f, i) => (
          <details key={i} className="faqitem">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <footer className="landfoot">
        <span className="logo">KAIROS</span>
        <p className="note center">El momento oportuno. El mejor entreno posible, hoy.</p>
      </footer>
    </main>
  );
}
