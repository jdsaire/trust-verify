/**
 * Entry — what does the receipt in your hand say?
 *
 * Two fields are required: the operation number, and the amount claimed. Everything else is
 * optional and defaults to "not shown", because a merchant may not be able to read it — the
 * security code in particular is printed on every receipt but appears nowhere in the public
 * anti-fraud guidance, so a verifier may not know it exists.
 *
 * Precondition gating follows the reference flow: the amount starts at S/ 0 and the primary
 * action stays disabled — and ignores taps — until a valid amount is present.
 */

import { useState } from 'react';
import { SecureKeypad } from './SecureKeypad.tsx';
import { NOT_SHOWN, type ClaimedReceipt } from '../domain/receipt.ts';
import { SAMPLES, type Sample } from '../domain/samples.ts';

interface EntryScreenProps {
  onSubmit: (claim: ClaimedReceipt) => void;
  disabled: boolean;
}

type Field = 'operation' | 'amount';

export function EntryScreen({ onSubmit, disabled }: EntryScreenProps) {
  const [operation, setOperation] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [code, setCode] = useState('');
  const [codeNotShown, setCodeNotShown] = useState(true);
  const [recipientNotShown, setRecipientNotShown] = useState(true);
  const [focused, setFocused] = useState<Field>('operation');

  const operationValid = /^\d{6,12}$/.test(operation);
  const amountValue = Number(amount) / 100;
  const amountValid = amount.length > 0 && amountValue > 0;
  // The gate: both preconditions, or the action does nothing.
  const ready = operationValid && amountValid && !disabled;

  const push = (d: string) => {
    if (focused === 'operation') setOperation((v) => (v.length >= 12 ? v : v + d));
    else setAmount((v) => (v.length >= 9 ? v : (v + d).replace(/^0+(?=\d)/, '')));
  };
  const back = () =>
    focused === 'operation' ? setOperation((v) => v.slice(0, -1)) : setAmount((v) => v.slice(0, -1));
  const clear = () => (focused === 'operation' ? setOperation('') : setAmount(''));

  const applySample = (s: Sample) => {
    setOperation(s.claim.operationNumber);
    setAmount(s.claim.amount === NOT_SHOWN ? '' : String(Math.round(s.claim.amount * 100)));
    const r = s.claim.recipientName;
    setRecipientNotShown(r === NOT_SHOWN);
    setRecipient(r === NOT_SHOWN ? '' : r);
    const c = s.claim.securityCode;
    setCodeNotShown(c === NOT_SHOWN);
    setCode(c === NOT_SHOWN ? '' : c);
  };

  const submit = () => {
    if (!ready) return; // Belt and braces: the gate holds even if the button is reached another way.
    onSubmit({
      operationNumber: operation,
      amount: amountValue,
      recipientName: recipientNotShown || !recipient.trim() ? NOT_SHOWN : recipient.trim(),
      securityCode: codeNotShown || !code.trim() ? NOT_SHOWN : code.trim(),
    });
  };

  return (
    <section className="entry" aria-labelledby="entry-h">
      <h2 id="entry-h" className="entry__h">
        Check a payment receipt
      </h2>
      <p className="entry__lede">
        Enter the operation number from the receipt. It is the only field on it the sender cannot
        invent.
      </p>

      <div className="samples" role="group" aria-label="Sample receipts">
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="samples__chip"
            onClick={() => applySample(s)}
            disabled={disabled}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="fields">
        <button
          type="button"
          className={`field ${focused === 'operation' ? 'field--on' : ''}`}
          onClick={() => setFocused('operation')}
          aria-label="Operation number field"
        >
          <span className="field__label">Nro. de operación</span>
          <span className="field__value field__value--mono">{operation || '—'}</span>
        </button>

        <button
          type="button"
          className={`field ${focused === 'amount' ? 'field--on' : ''}`}
          onClick={() => setFocused('amount')}
          aria-label="Amount field"
        >
          <span className="field__label">Monto</span>
          <span className="field__value field__value--money">
            S/ {amount ? amountValue.toFixed(2) : '0'}
          </span>
        </button>
      </div>

      <SecureKeypad
        onDigit={push}
        onBackspace={back}
        onClear={clear}
        disabled={disabled}
        ariaLabel={`Secure keypad, ${focused === 'operation' ? 'operation number' : 'amount'}`}
      />

      <details className="optional">
        <summary>Other fields on the receipt (optional)</summary>
        <p className="optional__note">
          Leave these as “not shown” if you can’t read them. You’ll still get a verdict.
        </p>

        <label className="check">
          <input
            type="checkbox"
            checked={recipientNotShown}
            onChange={(e) => setRecipientNotShown(e.target.checked)}
            disabled={disabled}
          />
          Recipient not shown
        </label>
        <input
          className="text"
          type="text"
          value={recipient}
          placeholder="Destinatario"
          aria-label="Claimed recipient name"
          disabled={disabled || recipientNotShown}
          onChange={(e) => setRecipient(e.target.value)}
        />

        <label className="check">
          <input
            type="checkbox"
            checked={codeNotShown}
            onChange={(e) => setCodeNotShown(e.target.checked)}
            disabled={disabled}
          />
          Security code not shown / I don’t know
        </label>
        <input
          className="text"
          type="text"
          inputMode="numeric"
          value={code}
          placeholder="Código de seguridad"
          aria-label="Claimed security code"
          disabled={disabled || codeNotShown}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
        />
      </details>

      <button
        type="button"
        className="cta"
        onClick={submit}
        disabled={!ready}
        aria-disabled={!ready}
      >
        Verify this receipt
      </button>
      {!ready && !disabled && (
        <p className="cta__hint" role="status">
          {operationValid
            ? 'Enter the amount the receipt claims.'
            : 'Enter the operation number (6–12 digits).'}
        </p>
      )}
    </section>
  );
}
