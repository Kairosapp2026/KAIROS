interface Props {
  onBack: () => void;
}

export function Legal({ onBack }: Props) {
  return (
    <main className="screen legal">
      <button className="link" onClick={onBack}>Volver</button>
      <h1 style={{ marginTop: 8 }}>Informacion legal</h1>
      <p className="muted">Aviso legal, privacidad, terminos de uso y cookies de Kairos.</p>

      <section id="aviso">
        <h2>1. Aviso legal</h2>
        <p>
          En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Informacion (LSSI),
          se informa de que el sitio kairostraining.es y la aplicacion Kairos son titularidad de:
        </p>
        <p>
          <strong>Titular:</strong> [Nombre y apellidos del titular]<br />
          <strong>NIF:</strong> [NIF]<br />
          <strong>Domicilio:</strong> [Direccion a efectos de notificaciones]<br />
          <strong>Contacto:</strong> appkairos2026@gmail.com
        </p>
        <p>
          El acceso y uso de este sitio atribuye la condicion de usuario e implica la aceptacion
          de las condiciones aqui recogidas. Todos los contenidos del sitio (textos, disenos,
          software y marca Kairos) son propiedad de su titular o de terceros licenciantes y estan
          protegidos por la normativa de propiedad intelectual e industrial.
        </p>
      </section>

      <section id="privacidad">
        <h2>2. Politica de privacidad</h2>
        <p>
          <strong>Responsable del tratamiento:</strong> el titular indicado en el aviso legal.
          Tratamos tus datos conforme al Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD 3/2018.
        </p>
        <p><strong>Datos que tratamos y para que:</strong></p>
        <p>
          - <strong>Datos de cuenta</strong> (nombre, email, contrasena cifrada): para crear y
          gestionar tu cuenta y comunicarnos contigo sobre el servicio.<br />
          - <strong>Datos de entrenamiento</strong> (programacion elegida, nivel, tiempo
          disponible, marcas, comentarios y molestias fisicas declaradas): para adaptar tus
          sesiones, guardar tu historial y permitir el seguimiento por parte del coach. Las
          molestias fisicas pueden constituir datos relativos a la salud: solo las tratamos con
          tu <strong>consentimiento explicito</strong>, prestado al crear la cuenta y al
          declararlas voluntariamente en cada sesion. Puedes entrenar sin declarar molestias.<br />
          - <strong>Datos de pago:</strong> los gestiona integramente Stripe Payments Europe Ltd.
          Kairos no almacena numeros de tarjeta; solo recibimos el estado de tu suscripcion.
        </p>
        <p>
          <strong>Base juridica:</strong> ejecucion del contrato (prestarte el servicio),
          consentimiento explicito (molestias fisicas) e interes legitimo (seguridad y mejora
          del servicio).
        </p>
        <p>
          <strong>Encargados y ubicacion:</strong> los datos se alojan en Supabase (base de datos
          en la Union Europea, region Francfort) y la web se sirve mediante Vercel. Los pagos los
          procesa Stripe. Estos proveedores actuan como encargados del tratamiento con garantias
          adecuadas.
        </p>
        <p>
          <strong>Conservacion:</strong> mientras mantengas tu cuenta. Si la eliminas, borraremos
          tus datos personales, salvo los que debamos conservar por obligaciones legales
          (por ejemplo, facturacion).
        </p>
        <p>
          <strong>Tus derechos:</strong> puedes ejercer los derechos de acceso, rectificacion,
          supresion, oposicion, limitacion y portabilidad escribiendo a appkairos2026@gmail.com.
          Tambien puedes reclamar ante la Agencia Espanola de Proteccion de Datos (aepd.es).
        </p>
      </section>

      <section id="terminos">
        <h2>3. Terminos y condiciones del servicio</h2>
        <p>
          <strong>El servicio:</strong> Kairos es una aplicacion de programacion de entrenamiento
          por suscripcion que adapta las sesiones al tiempo disponible, nivel y molestias
          declaradas por el usuario.
        </p>
        <p>
          <strong>Precio y prueba:</strong> la suscripcion cuesta 14,99 EUR al mes (impuestos
          incluidos), con un periodo de prueba gratuito de 7 dias con acceso completo. Tras la
          prueba, la suscripcion se renueva automaticamente cada mes por el mismo importe salvo
          cancelacion.
        </p>
        <p>
          <strong>Cancelacion:</strong> puedes cancelar en cualquier momento desde "Gestionar mi
          suscripcion", sin penalizacion ni explicaciones. Mantendras el acceso hasta el final
          del periodo ya pagado. No se realizan reembolsos de periodos ya iniciados.
        </p>
        <p>
          <strong>Cambio de programacion:</strong> la eleccion entre las programaciones
          disponibles se mantiene durante el mes en curso y puede cambiarse al renovar.
        </p>
        <p>
          <strong>Uso responsable y salud:</strong> Kairos ofrece programacion deportiva de
          caracter general y <strong>no constituye consejo medico, diagnostico ni tratamiento</strong>.
          Las adaptaciones por molestias son sugerencias de entrenamiento, no valoraciones
          clinicas. Antes de iniciar cualquier programa de ejercicio, y especialmente si tienes
          una lesion, dolencia o condicion medica, consulta con un profesional sanitario. Si una
          molestia persiste o se agrava, deja de entrenar y busca valoracion profesional. El
          entrenamiento se realiza bajo la exclusiva responsabilidad del usuario.
        </p>
        <p>
          <strong>Cuenta:</strong> eres responsable de la confidencialidad de tus credenciales.
          La cuenta es personal e intransferible. Podremos suspender cuentas en caso de uso
          fraudulento o contrario a estos terminos.
        </p>
        <p>
          <strong>Modificaciones:</strong> podremos actualizar el servicio y estos terminos;
          los cambios relevantes se comunicaran con antelacion razonable. La legislacion
          aplicable es la espanola.
        </p>
      </section>

      <section id="cookies">
        <h2>4. Politica de cookies</h2>
        <p>
          Kairos utiliza unicamente almacenamiento tecnico imprescindible para el funcionamiento
          del servicio: el necesario para mantener tu sesion iniciada y tus preferencias de uso.
          No utilizamos cookies publicitarias ni de seguimiento de terceros. Al procesar un pago,
          Stripe puede utilizar cookies tecnicas propias necesarias para la seguridad de la
          transaccion. Por su caracter estrictamente tecnico, estas cookies estan exentas de
          consentimiento conforme al criterio de la AEPD.
        </p>
      </section>

      <p className="note" style={{ marginTop: 20 }}>
        Ultima actualizacion: julio de 2026.
      </p>
      <button className="link" onClick={onBack}>Volver</button>
    </main>
  );
}
