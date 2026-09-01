/**
 * Translation table.
 *
 * Flat keys, one EN/ES pair each. Every hardcoded UI string across the 8 screen components moves
 * here — including strings that already read as Spanish (receipt-field labels like "Monto"), so
 * the toggle controls them too rather than leaving them assumed-already-done in one language.
 *
 * Sentences that wrap a `<strong>`/`<code>` span in the original JSX are split into `_pre`/`_mid`/
 * `_post` fragments so the component can keep the same embedded element, translated on both sides.
 *
 * Strings owned by the domain layer (src/domain/verdict.ts, src/domain/receipt.ts) are out of
 * scope by design — that layer is carried over unchanged, per the migration's architecture.
 */

export type Lang = 'EN' | 'ES';

const en = {
  // Disclaimer
  d_strong: 'Independent case study. Not affiliated with, endorsed by, or connected to Yape or BCP.',
  d_p1:
    'A front-end demonstration built against fabricated fixtures. No real payment, account, or ledger is involved, and no real payment can be verified here.',
  d_p2_pre: 'Visual treatment follows an ',
  d_p2_strong: 'approximate',
  d_p2_post:
    ' palette and type reference derived from screen inspection for the case study — not from any published design system, and not a reproduction of any real product.',

  // EntryScreen
  entry_h: 'Check a payment receipt',
  entry_lede:
    'Enter the operation number from the receipt. It is the only field on it the sender cannot invent.',
  entry_samples_aria: 'Sample receipts',
  entry_field_op_label: 'Nro. de operación',
  entry_field_op_aria: 'Operation number field',
  entry_field_amount_label: 'Monto',
  entry_field_amount_aria: 'Amount field',
  entry_optional_summary: 'Other fields on the receipt (optional)',
  entry_optional_note: 'Leave these as “not shown” if you can’t read them. You’ll still get a verdict.',
  entry_recipient_check: 'Recipient not shown',
  entry_recipient_placeholder: 'Destinatario',
  entry_recipient_aria: 'Claimed recipient name',
  entry_code_check: 'Security code not shown / I don’t know',
  entry_code_placeholder: 'Código de seguridad',
  entry_code_aria: 'Claimed security code',
  entry_cta: 'Verify this receipt',
  entry_hint_amount: 'Enter the amount the receipt claims.',
  entry_hint_operation: 'Enter the operation number (6–12 digits).',

  // Shared secure keypad
  kp_aria_prefix: 'Secure keypad',
  kp_aria_operation: 'operation number',
  kp_aria_amount: 'amount',
  kp_aria_pin: 'PIN entry',
  kp_clear: 'Clear',
  kp_delete_aria: 'Delete last digit',

  // Shared actions
  action_cancel: 'Cancel',

  // ProcessingScrim
  ps_dialog_aria: 'Verifying',
  ps_status_handshake: 'Establishing a secure channel…',
  ps_status_requesting: 'Checking the ledger…',
  ps_transport_security: 'Transport security',

  // ProvenanceBadge
  badge_sim_label: 'SIMULATED',
  badge_sim_title:
    'Demonstrated against fabricated fixtures. Not a real credential, connection, or measurement.',
  badge_impl_label: 'IMPLEMENTED',
  badge_impl_title: 'A control that genuinely runs in this app’s client code.',

  // SecurityPanel
  sec_h: 'Security layer',
  sec_sim_heading: 'Demonstrated security patterns',
  sec_sim_note:
    'The patterns below are demonstrated in the interface against fabricated fixtures. The certificates are not issued by any authority, the fingerprints identify nothing, the keys sign nothing, and the risk score measures nothing. Nothing in this panel is a measurement of anything. This page’s actual transport security is whatever its host provides — these rows describe a staged exchange, not that connection.',
  sec_riskmode_aria: 'Staged session risk',
  sec_riskmode_label: 'Staged session',
  sec_riskmode_low: 'Low risk',
  sec_riskmode_elevated: 'Elevated → step-up',
  sec_riskmode_note:
    'Picks which staged session the next verification runs against. An elevated score demands re-authentication before the ledger is touched.',
  sec_transport_label: 'Transport',
  sec_transport_value: 'HTTPS — SSL/TLS record layer',
  sec_protocol_label: 'Protocol',
  sec_cipher_label: 'Cipher suite',
  sec_keyexchange_label: 'Key exchange',
  sec_keyexchange_value: 'ECDHE with RSA-2048 asymmetric keys',
  sec_mutualauth_label: 'Mutual authentication',
  sec_mutualauth_value: 'Both sides presented and validated a certificate',
  sec_cert_server_title: 'Server certificate',
  sec_cert_client_title: 'Client certificate',
  sec_cert_subject: 'Subject',
  sec_cert_issuer: 'Issuer',
  sec_cert_serial: 'Serial',
  sec_cert_valid: 'Valid',
  sec_cert_key: 'Key',
  sec_cert_sha: 'SHA-256',
  sec_risk_heading: 'RSA Adaptive — risk scoring',
  sec_risk_note_stepup: 'This band demands a step-up challenge before the ledger call proceeds.',
  sec_risk_note_clear:
    'This band clears without a challenge. Switch the staged session above to see the step-up path.',
  sec_empty: 'Run a verification to see the staged handshake for this session.',
  sec_impl_heading: 'Controls that actually run here',
  sec_impl_note:
    'These run in this app’s client code and can be exercised on this page right now. They are the controls behind the staged patterns above — the pad the step-up PIN is typed on is this pad.',
  sec_impl_item1_strong: 'In-app secure keypad',
  sec_impl_item1_post: '— the app’s own numeric pad, so a third-party keyboard never sees the input.',
  sec_impl_item2_strong: 'Shuffled digits',
  sec_impl_item2_post: '— key positions change per session, so watching the finger path reveals nothing.',
  sec_impl_item3_strong: 'Execution lock',
  sec_impl_item3_post: '— one verification at a time; a second tap is dropped before it reaches the network.',
  sec_impl_item4_strong: 'Blocking scrim',
  sec_impl_item4_mid: '— the page behind it is ',
  sec_impl_item4_and: ' and',
  sec_impl_item4_post: ' while a request is in flight.',
  sec_impl_item5_strong: 'Privacy defaults',
  sec_impl_item5_post:
    '— recipient names truncated, phone numbers masked to the last three digits.',
  sec_impl_item6_strong: 'Single session instance',
  sec_impl_item6_mid: '— ',
  sec_impl_item6_post: ' returns the same object every time',
  sec_impl_item6_fail_suffix: ' (assertion failed)',
  sec_impl_item6_end: '; the execution lock depends on that. Session ',

  // StepUpChallenge
  stepup_dialog_aria: 'Step-up authentication',
  stepup_h: 'Confirm it’s you',
  stepup_why_pre: 'This session scored ',
  stepup_why_post: ', so the ledger check needs your PIN before it runs.',
  stepup_pin_aria_mid: ' of ',
  stepup_pin_aria_end: ' digits entered',
  stepup_note_pre: 'Staged challenge — any ',
  stepup_note_post: ' digits are accepted. No credential is checked or sent.',
  stepup_confirm: 'Confirm',

  // VerdictScreen
  verdict_verified_title: 'Payment found',
  verdict_verified_line: 'The ledger has this operation, and every field you could read matches it.',
  verdict_mismatch_title: 'Do not accept',
  verdict_mismatch_line: 'The ledger has this operation — but the receipt disagrees with it.',
  verdict_notfound_title: 'No such payment',
  verdict_notfound_line: 'The ledger has no operation with this number. Nothing was transferred.',
  verdict_eyebrow_prefix: 'Nro. de operación',
  verdict_flag_mismatch_pre: 'Disagrees with the ledger: ',
  verdict_flag_mismatch_post:
    '. A real operation number does not make the rest of the receipt true.',
  verdict_flag_notfound:
    'Every other field on a receipt can be typed by whoever made it. This one could not be — which is why its absence is conclusive.',
  verdict_skipped_pre: 'Not checked, because you couldn’t read ',
  verdict_skipped_it: 'it',
  verdict_skipped_them: 'them',
  verdict_skipped_post:
    '. The verdict above rests on the operation number, which is enough.',
  verdict_sub_ledger: 'What the ledger says',
  verdict_record_amount_label: 'Monto',
  verdict_record_recipient_label: 'Destinatario',
  verdict_record_phone_label: 'Nro. de celular',
  verdict_record_date_label: 'Fecha y hora',
  verdict_record_dest_label: 'Destino',
  verdict_sub_fieldbyfield: 'Field by field',
  verdict_table_field: 'Field',
  verdict_table_receipt: 'Receipt says',
  verdict_table_ledger: 'Ledger says',
  verdict_sr_nomatch: 'does not match',
  verdict_sr_match: 'matches',
  verdict_sr_notchecked: 'not checked',
  verdict_sub_why: 'Why only one field settles this',
  verdict_prov_backend: 'Written by the ledger',
  verdict_prov_sender: 'Set by the sender',
  verdict_cta: 'Check another receipt',

  // Language toggle
  lang_toggle_aria: 'Switch language',
};

const es: Record<keyof typeof en, string> = {
  d_strong: 'Estudio de caso independiente. Sin afiliación, respaldo ni conexión con Yape o BCP.',
  d_p1:
    'Una demostración de front-end construida sobre datos ficticios. No hay ningún pago, cuenta o registro real involucrado, y ningún pago real puede verificarse aquí.',
  d_p2_pre: 'El tratamiento visual sigue una paleta y una referencia tipográfica ',
  d_p2_strong: 'aproximadas',
  d_p2_post:
    ', derivadas de la inspección de pantallas para este estudio de caso — no de ningún sistema de diseño publicado, ni una reproducción de ningún producto real.',

  entry_h: 'Verifica un comprobante de pago',
  entry_lede:
    'Ingresa el número de operación del comprobante. Es el único campo que quien envía no puede inventar.',
  entry_samples_aria: 'Comprobantes de ejemplo',
  entry_field_op_label: 'Nro. de operación',
  entry_field_op_aria: 'Campo de número de operación',
  entry_field_amount_label: 'Monto',
  entry_field_amount_aria: 'Campo de monto',
  entry_optional_summary: 'Otros campos del comprobante (opcional)',
  entry_optional_note:
    'Marca estos como “no visible” si no puedes leerlos. Igual obtendrás un veredicto.',
  entry_recipient_check: 'Destinatario no visible',
  entry_recipient_placeholder: 'Destinatario',
  entry_recipient_aria: 'Nombre de destinatario declarado',
  entry_code_check: 'Código de seguridad no visible / No lo sé',
  entry_code_placeholder: 'Código de seguridad',
  entry_code_aria: 'Código de seguridad declarado',
  entry_cta: 'Verificar este comprobante',
  entry_hint_amount: 'Ingresa el monto que declara el comprobante.',
  entry_hint_operation: 'Ingresa el número de operación (6–12 dígitos).',

  kp_aria_prefix: 'Teclado seguro',
  kp_aria_operation: 'número de operación',
  kp_aria_amount: 'monto',
  kp_aria_pin: 'entrada de PIN',
  kp_clear: 'Borrar',
  kp_delete_aria: 'Eliminar último dígito',

  action_cancel: 'Cancelar',

  ps_dialog_aria: 'Verificando',
  ps_status_handshake: 'Estableciendo un canal seguro…',
  ps_status_requesting: 'Consultando el registro…',
  ps_transport_security: 'Seguridad de transporte',

  badge_sim_label: 'SIMULADO',
  badge_sim_title:
    'Demostrado sobre datos ficticios. No es una credencial, conexión ni medición real.',
  badge_impl_label: 'IMPLEMENTADO',
  badge_impl_title: 'Un control que realmente se ejecuta en el código cliente de esta app.',

  sec_h: 'Capa de seguridad',
  sec_sim_heading: 'Patrones de seguridad demostrados',
  sec_sim_note:
    'Los patrones a continuación se demuestran en la interfaz sobre datos ficticios. Los certificados no son emitidos por ninguna autoridad, las huellas digitales no identifican nada, las claves no firman nada y el puntaje de riesgo no mide nada. Nada en este panel es una medición real. La seguridad de transporte real de esta página es la que provee su servidor — estas filas describen un intercambio simulado, no esa conexión.',
  sec_riskmode_aria: 'Riesgo de la sesión simulada',
  sec_riskmode_label: 'Sesión simulada',
  sec_riskmode_low: 'Riesgo bajo',
  sec_riskmode_elevated: 'Elevado → verificación adicional',
  sec_riskmode_note:
    'Elige contra qué sesión simulada corre la siguiente verificación. Un puntaje elevado exige reautenticación antes de tocar el registro.',
  sec_transport_label: 'Transporte',
  sec_transport_value: 'HTTPS — capa de registro SSL/TLS',
  sec_protocol_label: 'Protocolo',
  sec_cipher_label: 'Conjunto de cifrado',
  sec_keyexchange_label: 'Intercambio de claves',
  sec_keyexchange_value: 'ECDHE con claves asimétricas RSA-2048',
  sec_mutualauth_label: 'Autenticación mutua',
  sec_mutualauth_value: 'Ambas partes presentaron y validaron un certificado',
  sec_cert_server_title: 'Certificado del servidor',
  sec_cert_client_title: 'Certificado del cliente',
  sec_cert_subject: 'Sujeto',
  sec_cert_issuer: 'Emisor',
  sec_cert_serial: 'Serie',
  sec_cert_valid: 'Vigencia',
  sec_cert_key: 'Clave',
  sec_cert_sha: 'SHA-256',
  sec_risk_heading: 'RSA Adaptive — puntaje de riesgo',
  sec_risk_note_stepup:
    'Este nivel exige una verificación adicional antes de que la llamada al registro continúe.',
  sec_risk_note_clear:
    'Este nivel pasa sin verificación adicional. Cambia la sesión simulada arriba para ver ese flujo.',
  sec_empty: 'Ejecuta una verificación para ver el protocolo simulado de esta sesión.',
  sec_impl_heading: 'Controles que realmente se ejecutan aquí',
  sec_impl_note:
    'Estos se ejecutan en el código cliente de esta app y pueden probarse en esta página ahora mismo. Son los controles detrás de los patrones simulados de arriba — el teclado donde se escribe el PIN de verificación adicional es este mismo teclado.',
  sec_impl_item1_strong: 'Teclado seguro en la app',
  sec_impl_item1_post:
    '— el teclado numérico propio de la app, así un teclado de terceros nunca ve lo que se escribe.',
  sec_impl_item2_strong: 'Dígitos mezclados',
  sec_impl_item2_post:
    '— las posiciones de las teclas cambian por sesión, así que observar el recorrido del dedo no revela nada.',
  sec_impl_item3_strong: 'Bloqueo de ejecución',
  sec_impl_item3_post:
    '— una verificación a la vez; un segundo toque se descarta antes de llegar a la red.',
  sec_impl_item4_strong: 'Cortina de bloqueo',
  sec_impl_item4_mid: '— la página detrás de ella está en ',
  sec_impl_item4_and: ' y',
  sec_impl_item4_post: ' mientras una solicitud está en curso.',
  sec_impl_item5_strong: 'Valores predeterminados de privacidad',
  sec_impl_item5_post:
    '— nombres de destinatario truncados, números de teléfono enmascarados hasta los últimos tres dígitos.',
  sec_impl_item6_strong: 'Instancia de sesión única',
  sec_impl_item6_mid: '— ',
  sec_impl_item6_post: ' devuelve el mismo objeto siempre',
  sec_impl_item6_fail_suffix: ' (falló la verificación)',
  sec_impl_item6_end: '; el bloqueo de ejecución depende de eso. Sesión ',

  stepup_dialog_aria: 'Verificación adicional',
  stepup_h: 'Confirma que eres tú',
  stepup_why_pre: 'Esta sesión obtuvo un puntaje ',
  stepup_why_post: ', así que la consulta al registro necesita tu PIN antes de ejecutarse.',
  stepup_pin_aria_mid: ' de ',
  stepup_pin_aria_end: ' dígitos ingresados',
  stepup_note_pre: 'Desafío simulado — se acepta cualquier PIN de ',
  stepup_note_post: ' dígitos. No se verifica ni se envía ninguna credencial.',
  stepup_confirm: 'Confirmar',

  verdict_verified_title: 'Pago encontrado',
  verdict_verified_line: 'El registro tiene esta operación, y todos los campos que pudiste leer coinciden.',
  verdict_mismatch_title: 'No aceptar',
  verdict_mismatch_line: 'El registro tiene esta operación — pero el comprobante no coincide con ella.',
  verdict_notfound_title: 'No existe ese pago',
  verdict_notfound_line: 'El registro no tiene ninguna operación con este número. No se transfirió nada.',
  verdict_eyebrow_prefix: 'Nro. de operación',
  verdict_flag_mismatch_pre: 'No coincide con el registro: ',
  verdict_flag_mismatch_post:
    '. Un número de operación real no hace verdadero el resto del comprobante.',
  verdict_flag_notfound:
    'Todos los demás campos de un comprobante pueden ser escritos por quien lo creó. Este no podía — por eso su ausencia es concluyente.',
  verdict_skipped_pre: 'No verificado, porque no pudiste leer ',
  verdict_skipped_it: 'este campo',
  verdict_skipped_them: 'estos campos',
  verdict_skipped_post:
    '. El veredicto anterior se apoya en el número de operación, que es suficiente.',
  verdict_sub_ledger: 'Lo que dice el registro',
  verdict_record_amount_label: 'Monto',
  verdict_record_recipient_label: 'Destinatario',
  verdict_record_phone_label: 'Nro. de celular',
  verdict_record_date_label: 'Fecha y hora',
  verdict_record_dest_label: 'Destino',
  verdict_sub_fieldbyfield: 'Campo por campo',
  verdict_table_field: 'Campo',
  verdict_table_receipt: 'Dice el comprobante',
  verdict_table_ledger: 'Dice el registro',
  verdict_sr_nomatch: 'no coincide',
  verdict_sr_match: 'coincide',
  verdict_sr_notchecked: 'no verificado',
  verdict_sub_why: 'Por qué un solo campo lo decide',
  verdict_prov_backend: 'Escrito por el registro',
  verdict_prov_sender: 'Puesto por quien envía',
  verdict_cta: 'Verificar otro comprobante',

  lang_toggle_aria: 'Cambiar idioma',
};

export const translations = { EN: en, ES: es } as const;

export type TranslationKey = keyof typeof en;
